---
title: "5. Analyzing Crash Files"
categories:
  - Uncategorized
tags:
  - Lua
---
From the implemented fuzzer, thousands of crash files were generated. Since we are just a small team and we had limited time for this project, we needed some strategy to classify our crash files. Also, as crash files were .lua script files, we spent much time on analyzing root cause of crash files. We believe this post would be helpful to those who are trying to analyze lua script that causes crash on Lua interprerter.



# 1. Classifyng crash files





# 2. Tips for analyzing the crash

## makefile

  - AddressSanitizer
    If you want to use AddressSanitizer, you need to add `-fsanitize=address` option to the makefile.
  
  - GDB debugging with source code
    If you want to debug with source code, you need to add `-g -O0` options to the makefile.

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


