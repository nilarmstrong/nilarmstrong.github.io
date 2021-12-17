var store = [{
        "title": "Chocolate Chip Cookies",
        "excerpt":"A chocolate chip cookie is a drop cookie that originated in the United States and features chocolate chips as its distinguishing ingredient. The traditional recipe combines a dough composed of butter and both brown and white sugar with semi-sweet chocolate chips. Variations include recipes with other types of chocolate as...","categories": [],
        "tags": [],
        "url": "http://localhost:4000/demo/chocolate-chip-cookies/"
      },{
        "title": "Oatmeal Cookies",
        "excerpt":"Oatmeal cookies are a proverbial favorite with both kids and adults. This crisp and chewy cookie is loaded with oats, dried fruit, and chopped nuts. Ingredients 1 cup butter, softened 1 cup white sugar 1 cup packed brown sugar 2 eggs 1 teaspoon vanilla extract 2 cups all-purpose flour 1...","categories": [],
        "tags": [],
        "url": "http://localhost:4000/demo/oatmeal-cookies/"
      },{
        "title": "Peanut Butter Cookies",
        "excerpt":"A peanut butter cookie is a type of cookie that is distinguished for having peanut butter as a principal ingredient. The cookie generally originated in the United States, its development dating back to the 1910s. Ingredients 1 cup unsalted butter 1 cup crunchy peanut butter 1 cup white sugar 1...","categories": [],
        "tags": [],
        "url": "http://localhost:4000/demo/peanut-butter-cookies/"
      },{
        "title": "1. Introduction",
        "excerpt":"Hi, we are students from Korea, and are interested in cybersecurity. We belong to BoB(Best of the Best) which is a government supported 8-month program that trains passionate students to become cybersecurity experts. You can find more information about BoB from the link below. KITRI BoB During the process of...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/introduction/"
      },{
        "title": "2. What is Lua?",
        "excerpt":"So, what is Lua? Lua is a lightweight, embeddable scripting language. For detailed information, we recommend you to refer official website of Lua and “Programming in Lua”. Although some of you might not heard about Lua, it is actually embedded on many famous host programs to support scripting. In this...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/what-is-lua/"
      },{
        "title": "3. Previous Vulnerabilites",
        "excerpt":"We started our security research on Lua by analyzing1-day vulnerabilites. Case studying previous vulnerabilites may be helpful to excavate new vulnerabilites. Specifically, we reviewed sandbox escape vulnerability in Lua v5.2, and previous CVEs related Lua. 1. Sandbox escape The follwing is an analysis of the existing version of the sandbox...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/previous-vulnerabilites/"
      },{
        "title": "4. Fuzzing Lua Interpreter",
        "excerpt":"Nowadays, as application programs have lots of feature, it is not easy to find vulnerabilities by simply analyzing codes or binaries. Fuzzing can be an efficient way of finding software vulnerabilities. However, there was no fuzzer that targeted Lua. We needed to implement our own Lua fuzzer. Thorugh trial and...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/fuzzing-lua-interpreter/"
      },{
        "title": "5. Analyzing Crash Files",
        "excerpt":"From the implemented fuzzer, thousands of crash files were generated. Since we are just a small team and we had limited time for this project, we needed some strategy to classify our crash files. Also, as crash files were .lua script files, we spent much time on analyzing root cause...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/analyzing-crash-files/"
      },{
        "title": "6. Code Auditing",
        "excerpt":"Code auditing is literally analyzing codes to find software vulnerabilities. Lua is a open-source language, so we can audit code by inspecting C codes that consist Lua. While analyzing crash files, we often had hard time understanding some logics. Those kinds of crash were generated during garbage collection process. In...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/code-auditing/"
      },{
        "title": "7. Vulnerability Analysis",
        "excerpt":"With tools and knowledge prepared, we had excavated several vulnerabilities in Lua. In this post, you can figure out discussions we had made in Lua-l. As Lua is open-source language, you can see lots of people giving their opinions about our analysis. lua-l report vunlnerability 1) Lua 5.4.4 Sandbox Escaping...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/vulnerability-analysis/"
      },{
        "title": "8. Applying to Host Programs",
        "excerpt":"We selected ten widely-used host programs that use Lua script for plugins. Although we cannot show names of the host programs chosen, we basically used similar methods to apply our vulnerabilities. 1. How to mod Lua Modding means applying script file to host program. Every host program has there own...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/applying-to-host-programs/"
      },{
        "title": "8. 0-day exploitable vulnerability in Lua interpreter",
        "excerpt":"","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/zero-day-exploit/"
      },{
        "title": "9. How to Report",
        "excerpt":"If you find a new vulnerability from Lua, you can report it, but how? This post would be helpful to those who are trying to report Lua vulnerabilities. Lua-l Although there is Lua github, it hasn’t opened pull request. You can use Lua-l instead. Lua-l is an active and friendly...","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/how-to-report/"
      },{
        "title": "10. Achievements",
        "excerpt":"","categories": ["Uncategorized"],
        "tags": ["Lua"],
        "url": "http://localhost:4000/uncategorized/achievements/"
      }]
