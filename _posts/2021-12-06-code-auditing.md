---
title: "6. Code Auditing"
categories:
  - Uncategorized
tags:
  - Lua
---
Code auditing is literally analyzing codes to find software vulnerabilities. Lua is a open-source language, so we can audit code by inspecting C codes that consist Lua. While analyzing crash files, we often had hard time understanding some logics. Those kinds of crash were generated during garbage collection process. In order to fully grasp root cause of the crash, we audited garbage collection related codes in Lua.

# GC Memory

GC Process is a process(full gc/ cycle) that works to clean up certain objects.
This process has two stages

1) mark object ( marking under object that is garbage)  
2) release garbage memory ( erasing objects that are marked)  
   problem here is that to run a cycle cost is too much therefore lua made a variable named GC debt to make cycle divided and work with many steps.  

If debt is infinite exist step1 = cycle  
debt not infinite step1 = cycle/size  
debt < 0 GC stops and runs GC step with size zero.(minor collection)  


during mark process when object is marked process subtracts objects size value from debt   
during sweep process when object is released process subtracts objects size value from debt  

   

# Function in lgc.c

- #### [Function] getgclist (lgc.c)

  - getgclist code

    ```lua
    static GCObject **getgclist (GCObject *o) {
      switch (o->tt) {
        case LUA_VTABLE: return &gco2t(o)->gclist;
        case LUA_VLCL: return &gco2lcl(o)->gclist;
        case LUA_VCCL: return &gco2ccl(o)->gclist;
        case LUA_VTHREAD: return &gco2th(o)->gclist;
        case LUA_VPROTO: return &gco2p(o)->gclist;
        case LUA_VUSERDATA: {
          Udata *u = gco2u(o);
          lua_assert(u->nuvalue > 0);
          return &u->gclist;
        }
        default: lua_assert(0); return 0;
      }
    }
    ```

  - **functions used for**
    propagatemark
    correctgraylist

  - **functions used in**
    lua_assert

  - **working process**
    function that returns gclist according to Object *o type and types are  
    LUA_VTABLE=Table, LUA_VLCL=Lua closure, LUA_VCCL=C closure, Thread, Proto, UserData

  - **arguments**
    GCObject 

  - **return value information**
    return gclist which is list of garbage collect list

    

- #### [Function] reallymarkobject (lgc.c)

  - reallymarkobject code

    ```lua
    static void reallymarkobject (global_State *g, GCObject *o) {
      switch (o->tt) {
        case LUA_VSHRSTR:
        case LUA_VLNGSTR: {
          set2black(o);  /* nothing to visit */
          break;
        }
        case LUA_VUPVAL: {
          UpVal *uv = gco2upv(o);
          if (upisopen(uv))
            set2gray(uv);  /* open upvalues are kept gray */
          else
            set2black(uv);  /* closed upvalues are visited here */
          markvalue(g, uv->v);  /* mark its content */
          break;
        }
        case LUA_VUSERDATA: {
          Udata *u = gco2u(o);
          if (u->nuvalue == 0) {  /* no user values? */
            markobjectN(g, u->metatable);  /* mark its metatable */
            set2black(u);  /* nothing else to mark */
            break;
          }
          /* else... */
        }  /* FALLTHROUGH */
        case LUA_VLCL: case LUA_VCCL: case LUA_VTABLE:
        case LUA_VTHREAD: case LUA_VPROTO: {
          linkobjgclist(o, g->gray);  /* to be visited later */
          break;
        }
        default: lua_assert(0); break;
      }
    }
    ```

  - **functions used for**
    luaC_barrier_  
    traverseephemeron  
    markold  
    markvalue  

  - **functions used in**
    lua_assert

  - **working process**
    Function works according to GC Object's type  
    1.LUA_VLNGSTR is Lua string long and it colors any color to black.  
    2.LUA_VUPVAL is similar to external local variable  
        if upvalue is open color gray  
        if upvalue is closed color black  
    3.LUA_VUSERDATA is Lua Userdata and it sets color black  
    Also function binds LUA_VTABLE, LUA_VTHREAD,... into graylist using linkobjgclist to make it as list to check latertime.

  - **arguments**
    global_State
    GCObject

- #### [Function] genstep (lgc.c)

  - genstep code

    ```lua
    static void genstep (lua_State *L, global_State *g) {
      if (g->lastatomic != 0)  /* last collection was a bad one? */
        stepgenfull(L, g);  /* do a full step */
      else {
        lu_mem majorbase = g->GCestimate;  /* memory after last major collection */
        lu_mem majorinc = (majorbase / 100) * getgcparam(g->genmajormul);
        if (g->GCdebt > 0 && gettotalbytes(g) > majorbase + majorinc) {
          lu_mem numobjs = fullgen(L, g);  /* do a major collection */
          if (gettotalbytes(g) < majorbase + (majorinc / 2)) {
            /* collected at least half of memory growth since last major
               collection; keep doing minor collections */
            setminordebt(g);
          }
          else {  /* bad collection */
            g->lastatomic = numobjs;  /* signal that last collection was bad */
            setpause(g);  /* do a long wait for next (major) collection */
          }
        }
        else {  /* regular case; do a minor collection */
          youngcollection(L, g);
          setminordebt(g);
          g->GCestimate = majorbase;  /* preserve base value */
        }
      }
      lua_assert(isdecGCmodegen(g));
    }
    ```

  - **functions used for**
    luaC_step

  - **functions used in**
    stepgenfull  
    fullgen  
    setminordebt  
    setpause  
    youngcollection  
    setminordebt  

  - **working process**
    Run generational step in garbage collect
    which means running minor collection(traverses only objects recently created)  


    major base : memory of what is left after major collection  
    majorinc : this value can be changed but in here it is same with majorbase  
    during major collection we say it is bad collection and pause  
    when `gettotalbytes(g) > majorbase + (majorinc / 2)` = `gettotalbytes(g) > majorbase + (majorbase / 2)`  
    Therefore bad collection is checking whether memory is freed enough  

  - **arguments**
    lua_State  
    global_State

  - **comment**
    functions that are connected with gc generation step are  
    stepgenfull (full step)  
    fullgen (major collection)  
    youngcollection (minor collection)  


- #### [Function] genlink (lgc.c)

  - genlink code

    ```lua
    static void genlink (global_State *g, GCObject *o) {
      lua_assert(isblack(o));
      if (getage(o) == G_TOUCHED1) {  /* touched in this cycle? */
        linkobjgclist(o, g->grayagain);  /* link it back in 'grayagain' */
      }  /* everything else do not need to be linked back */
      else if (getage(o) == G_TOUCHED2)
        changeage(o, G_TOUCHED2, G_OLD);  /* advance age */
    }
    ```

  - **functions used for**
    traverseephemeron  
    traversestrongtable  
    traverseudata  

  - **functions used in**
    linkobjgclist

  - **working process**
    check if object should be kept in grayagain list  
    if "o" is G_TOUCHED1(old object touched this cycle) it goes into grayagain  
    if "o" is G_TOUCHED2(old object touched in previous cycle) it is changed into G_OLD(really old object (not to be visited))  

  - **arguments**
    global_State
    GCObject

    

- #### [Function] luaC_newobj

  - luaC_newobj code

    ```c
    GCObject *luaC_newobj (lua_State *L, int tt, size_t sz) {
      global_State *g = G(L);
      GCObject *o = cast(GCObject *, luaM_newobject(L, novariant(tt), sz));
      o->marked = luaC_white(g);
      o->tt = tt;
      o->next = g->allgc;
      g->allgc = o;
      return o;
    }
    ```

  - **functions used for**
    luaF_newLclosure (lfunc.c)

  - **functions used in**
    luaM_newobject

  - **working process**
    get new object by luaM_newobject and type cast into GCObject * aslo as object is new set it as white color  
    g→allgc = o means that this object is allowed for collecting

  - **arguments**
    lua_State *L : lua state   
    int tt : new object's typetag value  
    size_t sz : size to be allocated  

  - **return value information**
    GCObject * : returns address of gc object

      

- #### [Function] propagatemark (lgc.c)

  - propagatemark code

    ```lua
    static lu_mem propagatemark (global_State *g) {
      GCObject *o = g->gray;
      nw2black(o);
      g->gray = *getgclist(o);  /* remove from 'gray' list */
      switch (o->tt) {
        case LUA_VTABLE: return traversetable(g, gco2t(o));
        case LUA_VUSERDATA: return traverseudata(g, gco2u(o));
        case LUA_VLCL: return traverseLclosure(g, gco2lcl(o));
        case LUA_VCCL: return traverseCclosure(g, gco2ccl(o));
        case LUA_VPROTO: return traverseproto(g, gco2p(o));
        case LUA_VTHREAD: return traversethread(g, gco2th(o));
        default: lua_assert(0); return 0;
      }
    }
    ```

  - **functions used for**
    propagateall (lgc.c)  
    singlestep (lgc.c)  

  - **functions used in**
    traversetable  
    traverseudata  
    traverseLclosure  
    traverseCclosure  
    traverseproto  
    traversethread  

  - **working process**
    all objects referenced by object  
    all starting from the object  

    propagatemark works until it founds all objects for two cases above and change gray objects into black

  - **arguments**
    global_State 

  - **return value information**
    returns return of traverse function

    


​        

- #### [Function] enterinc (lgc.c)

  - enterinc code

    ```lua
    static void enterinc (global_State *g) {
      whitelist(g, g->allgc);
      g->reallyold = g->old1 = g->survival = NULL;
      whitelist(g, g->finobj);
      whitelist(g, g->tobefnz);
      g->finobjrold = g->finobjold1 = g->finobjsur = NULL;
      g->gcstate = GCSpause;
      g->gckind = KGC_INC;
      g->lastatomic = 0;
    }
    ```

  - **functions used for**
    luaC_changemode  
    fullgen  
    stepgenfull  

  - **functions used in**
    whitelist

  - **working process**
    enter incremental mode and turn all objects white  
    allgc : list of all collectable objects  
    finobj : list of collectable objects with finalizers  
    tobefnz : list of userdata to be GC  

  - **arguments**
    global_State 
