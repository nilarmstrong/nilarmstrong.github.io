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
  - AAR(arbitary Address Read)
  - Fake Object
  - Call frealloc
- Reference


## Background

### tostring
### Bytecode
### string.gsub
### string.dump

## Root cause

### 


## Exploit


## Exploit flow schematic

![image-center]({{ '/images/previous-vulnerabilities/exploit_flow1.jpeg' | absolute_url }}){: .align-center}
![image-center]({{ '/images/previous-vulnerabilities/exploit_flow2.jpeg' | absolute_url }}){: .align-center}
![image-center]({{ '/images/previous-vulnerabilities/exploit_flow3.jpeg' | absolute_url }}){: .align-center}


## Reference

[lua-5.2.4-sandbox-escape](https://github.com/erezto/lua-sandbox-escape)
[lua-5.4.4-sandbox-escape](https://github.com/Lua-Project/lua-5.4.4-sandbox-escape)




# 2. CVEs related to Lua

