---
title: "4. Fuzzing Lua Interpreter"
categories:
  - Uncategorized
tags:
  - Lua
---
Nowadays, as application programs have lots of feature, it is not easy to find vulnerabilities by simply analyzing codes or binaries. Fuzzing can be an efficient way of finding software vulnerabilities. However, there was no fuzzer that targeted Lua. We needed to implement our own Lua fuzzer. Thorugh trial and error, we developed a fuzzer that aims at Lua interpreter. It was not an easy task. We hope some readers to improve our fuzzer to discover hidden vulnerabilities in Lua!

