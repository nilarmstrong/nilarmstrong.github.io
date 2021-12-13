---
title: "2. What is Lua?"
categories:
  - Uncategorized
tags:
  - Lua
---
So, what is Lua? Lua is a lightweight, embeddable scripting language. For detailed information, we recommend you to refer [official website](https://www.lua.org/about.html) of Lua and "Programming in Lua". Although some of you might not heard about Lua, it is actually embedded on many famous host programs to support scripting. In this post, we will explain major attributes of Lua and give real examples of host programs that use Lua. 


<br>
# 1. Attributes
## 1) Open-source

Lua is an open-source language. It is implemented with C language. You can download its source code from both [official website](https://www.lua.org/download.html) and [github](https://github.com/lua/lua) of Lua. Thanks to its open-source attribute, we could make our analysis much more easily. People who are interested in Lua freely make discussions in [lua-l](http://lua-users.org/lists/lua-l/ ) for improvement and revision.
<br>
## 2) Lightweight

Once you download the source code of Lua, you can figure out that the number of codes that consist Lua is quite small. Official website of Lua says that several benchmarks show Lua is one of the fastest language in the realm of interpreted scripting Language.
<br>
## 3) Interpreted Language

Lua can be considered as Interpreted language, as it supports JIT(just-in-time) compiler. Unlike compiled language generates executable file such as .exe in Windows, interpreted language decode and execute source code line by line. C language is an example of compiled language, and python language a counterpart of interpreted one.



- Process of executing compiled language

![image-center]({{ '/images/what-is-lua/1.png' | absolute_url }}){: .align-center}


<br>
- Process of executing interpreted language

![image-center]({{ '/images/what-is-lua/2.png' | absolute_url }}){: .align-center}



Lua interpreter receives files with .lua extension as input, compile with its JIT compiler, making scripts into internally interpretable form.

- Executing test.lua file

![image-center]({{ '/images/what-is-lua/3.JPG' | absolute_url }}){: .align-center}

![image-center]({{ '/images/what-is-lua/4.JPG' | absolute_url }}){: .align-center}

<br>
You can also test Lua codes by just executing the interpreter.

- Executing Lua interpreter

![image-center]({{ '/images/what-is-lua/5.JPG' | absolute_url }}){: .align-center}

<br>
## 4) Embeddable

Lua supports simple and well documented C API. Actually, Lua is solely used alone. Instead, it occupies small portions of applications in embedded form. Let me give a toy example on how C API is used to interact with Lua.



![image-center]({{ '/images/what-is-lua/6.png' | absolute_url }}){: .align-center}



variable "L" of lua_State * type is used to communicate with Lua. luaL_newstate() function is used to create state information, and lua_close() function is used to delete the information(Similar to allocating / deallocating memory). luaL_dofile() function executes "example.lua" script. In order to share data between C and Lua, virtual stack is used.



![image-center]({{ '/images/what-is-lua/7.png' | absolute_url }}){: .align-center}

 

Figure above shows indexes when five data is pushed on virtual stack. Top of the stack can be accessed with index 5 and -1.



So, now suppose that there is a function that multiplies two parameters and returns the result in "example.lua" script.

![image-center]({{ '/images/what-is-lua/8.png' | absolute_url }}){: .align-center}



main function in C source file is written as below.

![image-center]({{ '/images/what-is-lua/9.png' | absolute_url }}){: .align-center}

In line 18, function "multiply" is pushed on virtual stack by calling lua_getglobal function. Two arguments(5 and 7) are pushed on virtual stack in line 20 ~ 21. lua_pcall function is called to execute "multiply" function, and return value is retrieved through calling lua_tonumber function(). You can see that variable "ans" has expected value through printing out its content, which is 35(5 times 7).



![image-center]({{ '/images/what-is-lua/10.png' | absolute_url }}){: .align-center}

<br>
# 2. Examples

There are various host programs that use Lua. In this part, we give famous example programs that use Lua for scripting. Some host programs modify original Lua and use their own API system.



## 1) Software tools

### (1) Wireshark

Wireshark is one of the most famous network protocol analyzer. It uses Lua to write dissectors, taps, and capture file readers and writers.



![image-center]({{ '/images/what-is-lua/11.JPG' | absolute_url }}){: .align-center}



You can refer to [gitlab](https://gitlab.com/wireshark/wireshark/-/wikis/Lua) of wireshark for further information.



### (2) Cheat Engine

Cheat Engine is a development environment focused on modding games and applications for personal use.



![image-center]({{ '/images/what-is-lua/12.JPG' | absolute_url }}){: .align-center}



You can refer to Lua documentation of cheat engine from Help->Lua documentation menu for further information.



## 2) Games

### (1) World of Warcraft

World of Warcraft is MMORPG game developed by Blizzard. World of Warcraft(a.k.a WoW) supports WoW AddOn system to customize UI. You can refer to [wowwiki](https://wowwiki-archive.fandom.com/wiki/Lua_file) website to figure out how Lua script is used.



### (2) Roblox

Roblox is an online game platform that users can create games and enjoy them. Roblox uses modified Lua internally. You can learn how to use Lua in Roblox from [developer.roblox.com](https://developer.roblox.com/en-us/learn-roblox/coding-scripts). 