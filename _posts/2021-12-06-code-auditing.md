---
title: "6. Code Auditing"
categories:
  - Uncategorized
tags:
  - Lua
---
Code auditing is literally analyzing codes to find software vulnerabilities. Lua is a open-source language, so we can audit code by inspecting C codes that consist Lua. While analyzing crash files, we often had hard time understanding some logics. Those kinds of crash were generated during garbage collection process. In order to fully grasp root cause of the crash, we audited garbage collection related codes in Lua. 

