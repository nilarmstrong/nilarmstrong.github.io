---
title: "5. Analyzing Crash Files"
categories:
  - Uncategorized
tags:
  - Lua
---
From the implemented fuzzer, thousands of crash files were generated. Since we are just a small team and we had limited time for this project, we needed some strategy to classify our crash files. Also, as crash files were .lua script files, we spent much time on analyzing root cause of crash files. We believe this post would be helpful to those who are trying to analyze lua script that causes crash on Lua interprerter.



# 1. Classifying crash files
## 1) Comparing hash value of call stack's  PC

Under the same environment, we made an assumption that if hash values of call stack's PC(from call stack #0 to call stack #4) of two crash files are same, they are overlapped.  We made script files to automate comparing process. You can refer the script files from [this link](https://github.com/JIHOI-KIM/MyLuaScript/tree/master/v2). Using this method the number of crash files was reduced from thousands to hundreds. 


## 2) Checking crash type

Hundreds of crash files are still a long way to go. There were various kinds of crash files. Crash files caused use-after-free, heap overflow, stack overflow, segmentation violation, etc. Not all crash files are related to worthwhile vulnerability. Our mentor recommended us to give precedence to crash type. We first analyzed use-after-free, segmentation violation, then heap overflow, and so on. Recently, we could find an exploitable vulnerability from use-after-free crash file. It would be helpful to first analyze suspicious crash files before trivial ones.





# 2. Tips for analyzing the crash

## makefile

  - AddressSanitizer
    If you want to use AddressSanitizer, you need to add `-fsanitize=address` option to the makefile.
  
  - GDB debugging with source code
    If you want to debug with source code, you need to add `-g -O0` options to the makefile.

  - `A makefile with nothing applied`
  ```make
  # skipped
  # enable Linux goodies
  MYCFLAGS= $(LOCAL) -std=c99 -DLUA_USE_LINUX -DLUA_USE_READLINE
  MYLDFLAGS= $(LOCAL) -Wl,-E
  MYLIBS= -ldl -lreadline


  CC= gcc
  CFLAGS= -Wall -O2 $(MYCFLAGS) -fno-stack-protector -fno-common -march=native
  AR= ar rc
  RANLIB= ranlib
  RM= rm -f
  # skipped
  ```

  - `ASAN, debug wth source code applied makefile`
  ```make
  # skipped
  # enable Linux goodies
  MYCFLAGS= $(LOCAL) -g -O0 -std=c99 -DLUA_USE_LINUX -DLUA_USE_READLINE -fsanitize=address #-DLUAI_ASSERT -DLUA_USE_APICHECK
  MYLDFLAGS= $(LOCAL) -Wl,-E
  MYLIBS= -ldl -lreadline -fsanitize=address


  CC= gcc
  CFLAGS= -Wall $(MYCFLAGS) -fno-stack-protector -fno-common -march=native
  AR= ar rc
  RANLIB= ranlib
  RM= rm -f
  # skipped
  ```


