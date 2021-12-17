---
title: "8. Applying to Host Programs"
categories:
  - Uncategorized
tags:
  - Lua
---
We selected ten widely-used host programs that use Lua script for plugins. Although we cannot show names of the host programs chosen,  we basically used similar methods to apply our vulnerabilities.



# 1. How to mod Lua

Modding means applying script file to host program. Every host program has there own modding method, and you can easily find them from google, or manual of the program. Check whether your script works fine through executing code such as `print("test")`. If "test" string appears on your monitor while you execute your host program, it means you succeded to mod Lua.



# 2. Check the version of Lua

Although the newest version of Lua is v5.4.4, host programs use various kinds of Lua. Some of our target programs used 5.2. As there are some differences on each version of Lua, you need to get the version of Lua of the host program. You can simply get version information from executing `print(_VERSION)` from your Lua script. If this not works, you can try static analysis to find version related strings in the host program.



# 3. Analyze differences from original Lua

Probably, this would be the trickiest job. Host programs usually modify original Lua codes and build their own Lua interpreter. Some dangerous functions are excluded before compilation. Furthermore, there are execution differences between host programs and sole Lua interpreter. Most host programs are executed in Windows operating system. All of the Objects made in Lua use heap area. This implies you need to consider which heap allocator is used in your operating system.



We considered conditions above in order to apply our vulnerabilities to the host programs. As a result, we found out that six host programs had security problems, and reported these issues to each vendor of the programs.