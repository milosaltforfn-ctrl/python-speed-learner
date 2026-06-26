import React, { useState, useMemo } from "react";

/*
  PYTHON SPEED LEARNER — Leaving Cert Section C edition
  ------------------------------------------------------
  Self-contained React component. No localStorage (per your constraint):
  all progress lives in useState and resets on refresh.

  Components in this file:
    - StarField   : animated cosmic background (pure CSS, no Framer Motion)
    - Hud         : score, rank, progress bar
    - SectorMap   : level/mission select; each topic = a sector node
    - TopicIntro  : plain-English blurb shown before the questions
    - QuestionCard: renders any of the 4 question types + immediate feedback
    - Quiz        : runs through a topic's questions and reports completion
    - App         : top-level state + screen routing

  Question types:
    mc            = multiple choice
    predict       = predict the output (multiple choice over outputs)
    bug           = spot the bug (multiple choice over lines/options)
    write         = write the code (free text, whitespace-normalised match)

  Write-in types (typed answer + green RUN button + simulated console):
    rewrite       = fix a broken/incomplete line by retyping it
    missing-word  = supply a missing keyword or variable (for/return/if/name)
    missing-punct = supply missing punctuation (colon/comma/bracket/quote).
                    These grade punctuation & quotes STRICTLY.

  Each write-in question carries authored output to simulate a console:
    expectedOutput = what prints when the answer is correct
    wrongOutput    = realistic wrong output OR a Python-style error
                     (e.g. "SyntaxError: invalid syntax") shown when wrong
*/

/* ----------------------------- DATA ----------------------------- */

const TOPICS = [
  {
    id: "strings",
    name: "String Processing",
    sector: "Sector 01 · Lexis Prime",
    blurb:
      "Strings are sequences of characters you can loop through one at a time. You can check membership with `if char in \"aeiou\"`, count things with a running total, and grab the ends with indexing: text[0] is the first character and text[-1] is the last.",
    questions: [
      {
        type: "mc",
        prompt: "Which expression gives the LAST character of the string word?",
        options: ["word[1]", "word[-1]", "word[len(word)]", "word.last()"],
        answer: "word[-1]",
        explain: "Negative indexing counts from the end, so -1 is always the last character.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: 'word = "radar"\ncount = 0\nfor ch in word:\n    if ch == "r":\n        count = count + 1\nprint(count)',
        options: ["1", "2", "3", "radar"],
        answer: "2",
        explain: "There are two 'r' characters in 'radar', so the counter ends at 2.",
      },
      {
        type: "mc",
        prompt: "How do you check whether the character ch is a vowel?",
        options: [
          'if ch in "aeiou":',
          'if ch = "aeiou":',
          'if vowel(ch):',
          'if ch.vowel():',
        ],
        answer: 'if ch in "aeiou":',
        explain: "`in` tests membership: it's True when ch is one of those five letters.",
      },
      {
        type: "write",
        prompt:
          "Write one line that prints the first character of a string stored in name.",
        accept: ["print(name[0])"],
        answer: "print(name[0])",
        explain: "Index 0 is the first character; print() shows it.",
      },
      {
        type: "bug",
        prompt:
          "This should count the letters in word but it errors. Which line is wrong?",
        code: '1  total = 0\n2  for ch in word\n3      total = total + 1\n4  print(total)',
        options: ["Line 1", "Line 2", "Line 3", "Line 4"],
        answer: "Line 2",
        explain: "A for-loop header needs a colon: `for ch in word:`.",
      },
      {
        type: "missing-punct",
        prompt:
          "This line is missing punctuation so it won't run. Retype it correctly (the for-loop header for looping over word).",
        code: "for ch in word",
        starter: "for ch in word",
        accept: ["for ch in word:"],
        answer: "for ch in word:",
        strictPunct: true,
        expectedOutput: "(loops over each character — no error)",
        wrongOutput: "  File \"program.py\", line 1\n    for ch in word\n                  ^\nSyntaxError: expected ':'",
        explain: "A for-loop header must end with a colon.",
      },
      {
        type: "rewrite",
        prompt:
          "This line should print the LAST character of word, but it prints the first. Rewrite it correctly.",
        code: "print(word[0])",
        starter: "print(word[0])",
        accept: ["print(word[-1])"],
        answer: "print(word[-1])",
        expectedOutput: "(prints the last character, e.g. 'n' for 'python')",
        wrongOutput: "p   ← this is the FIRST character, not the last",
        explain: "Use index -1 to reach the last character.",
      },
    ],
  },
  {
    id: "forloops",
    name: "For Loops & Lists",
    sector: "Sector 02 · Iteron Belt",
    blurb:
      "A for-loop repeats once for every item in a sequence. When you loop over a list, the loop variable becomes each element in turn, so you can print it, test it, or build something from it. The body of the loop must be indented.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [3, 6, 9]\nfor n in nums:\n    print(n * 2)",
        options: ["3 6 9", "6 12 18", "[6, 12, 18]", "2 2 2"],
        answer: "6 12 18",
        explain: "Each item is doubled and printed on its own line: 6, then 12, then 18.",
      },
      {
        type: "mc",
        prompt: "Which loop prints every name in the list students?",
        options: [
          "for name in students:\n    print(name)",
          "for students in name:\n    print(name)",
          "print(students in name)",
          "while students:\n    print(name)",
        ],
        answer: "for name in students:\n    print(name)",
        explain: "The loop variable (name) takes each element of students one at a time.",
      },
      {
        type: "write",
        prompt:
          "Write a 2-line for-loop that prints each item of a list called colours.",
        accept: ["for c in colours:\nprint(c)", "for colour in colours:\nprint(colour)"],
        answer: "for c in colours:\n    print(c)",
        explain: "Loop over the list and print the loop variable; the print must be indented.",
      },
      {
        type: "bug",
        prompt: "This should print each score but prints nothing useful. What's wrong?",
        code: "scores = [10, 20, 30]\nfor s in scores:\nprint(s)",
        options: [
          "scores is spelled wrong",
          "print(s) is not indented",
          "the list is empty",
          "you can't loop over numbers",
        ],
        answer: "print(s) is not indented",
        explain: "The loop body must be indented or Python raises an IndentationError.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "for i in range(4):\n    print(i)",
        options: ["1 2 3 4", "0 1 2 3", "0 1 2 3 4", "4"],
        answer: "0 1 2 3",
        explain: "range(4) gives 0, 1, 2, 3 — it starts at 0 and stops before 4.",
      },
      {
        type: "mc",
        prompt: "Which loop adds up every number in the list nums?",
        options: [
          "total = 0\nfor n in nums:\n    total += n",
          "total = 0\nfor n in nums:\ntotal += n",
          "for n in nums:\n    total = n",
          "total = sum",
        ],
        answer: "total = 0\nfor n in nums:\n    total += n",
        explain: "Start a total at 0, then add each item inside the indented loop.",
      },
      {
        type: "missing-punct",
        prompt:
          "This loop header over a list is missing its punctuation. Retype it correctly.",
        code: "for item in shopping",
        starter: "for item in shopping",
        accept: ["for item in shopping:"],
        answer: "for item in shopping:",
        strictPunct: true,
        expectedOutput: "(loops over each item — no error)",
        wrongOutput:
          "  File \"program.py\", line 1\n    for item in shopping\n                        ^\nSyntaxError: expected ':'",
        explain: "A for-loop header always ends with a colon.",
      },
    ],
  },
  {
    id: "functions",
    name: "Functions",
    sector: "Sector 03 · Defluxe Station",
    blurb:
      "A function packages reusable code. You define it with `def name(parameters):` and send a result back with `return`. Boolean functions return True or False, which is handy for checks like 'is this number even?'.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "def add(a, b):\n    return a + b\n\nprint(add(4, 5))",
        options: ["9", "45", "a + b", "None"],
        answer: "9",
        explain: "add(4, 5) returns 9, and print() shows it.",
      },
      {
        type: "mc",
        prompt: "Which function correctly returns True when n is even?",
        options: [
          "def is_even(n):\n    return n % 2 == 0",
          "def is_even(n):\n    print(n % 2 == 0)",
          "def is_even(n):\n    n % 2 == 0",
          "def is_even(n):\n    return n / 2",
        ],
        answer: "def is_even(n):\n    return n % 2 == 0",
        explain: "n % 2 == 0 is a boolean expression; returning it gives True or False.",
      },
      {
        type: "write",
        prompt:
          "Write a function called square(n) that returns n multiplied by itself.",
        accept: ["def square(n):\nreturn n * n", "def square(n):\nreturn n*n", "def square(n):\nreturn n ** 2"],
        answer: "def square(n):\n    return n * n",
        explain: "Use return to send back n * n (or n ** 2).",
      },
      {
        type: "bug",
        prompt: "Calling greet('Sam') prints nothing. Why?",
        code: "def greet(name):\n    message = 'Hi ' + name\n\ngreet('Sam')",
        options: [
          "name is undefined",
          "the function never returns or prints message",
          "you can't add strings",
          "greet is a reserved word",
        ],
        answer: "the function never returns or prints message",
        explain: "It builds message but never returns or prints it, so nothing appears.",
      },
      {
        type: "missing-word",
        prompt:
          "This function should send back the total, but the missing keyword means it gives None. Retype the last line with the keyword added.",
        code: "def total(a, b):\n    ___ a + b\n\nprint(total(2, 3))",
        starter: "___ a + b",
        accept: ["return a + b"],
        answer: "return a + b",
        expectedOutput: "5",
        wrongOutput: "None   ← the function returned nothing",
        explain: "Without `return`, a function hands back None.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "def is_positive(n):\n    return n > 0\n\nprint(is_positive(-3))",
        options: ["True", "False", "-3", "None"],
        answer: "False",
        explain: "-3 > 0 is False, and that boolean is returned then printed.",
      },
      {
        type: "rewrite",
        prompt:
          "This function header is wrong — it uses the wrong keyword to define a function. Rewrite the header line correctly.",
        code: "function greet(name):\n    return 'Hi ' + name",
        starter: "function greet(name):",
        accept: ["def greet(name):"],
        answer: "def greet(name):",
        expectedOutput: "(defines the function — no error)",
        wrongOutput: "  File \"program.py\", line 1\n    function greet(name):\n             ^^^^^\nSyntaxError: invalid syntax",
        explain: "Python defines functions with `def`, not `function`.",
      },
    ],
  },
  {
    id: "conditionals",
    name: "If / Elif / Else",
    sector: "Sector 04 · Branchworld",
    blurb:
      "Conditionals choose between paths. Python checks `if` first; if it's False it tries each `elif`, and `else` catches everything left over. Order matters — put the most specific or highest test first.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print when mark = 72?",
        code: "mark = 72\nif mark >= 85:\n    print('A')\nelif mark >= 70:\n    print('B')\nelse:\n    print('C')",
        options: ["A", "B", "C", "Nothing"],
        answer: "B",
        explain: "72 fails >= 85 but passes >= 70, so the elif branch runs and prints 'B'.",
      },
      {
        type: "mc",
        prompt: "Which keyword handles every case not already matched above it?",
        options: ["else", "elif", "endif", "default"],
        answer: "else",
        explain: "`else` runs only when all the if/elif tests were False.",
      },
      {
        type: "bug",
        prompt:
          "This grades a score but every score over 50 prints 'Pass' only, never 'Distinction'. Why?",
        code: "if score > 50:\n    print('Pass')\nelif score > 80:\n    print('Distinction')",
        options: [
          "elif should be if",
          "the > 80 test can never be reached because > 50 catches it first",
          "score is a string",
          "missing an else",
        ],
        answer: "the > 80 test can never be reached because > 50 catches it first",
        explain: "Test the higher threshold first; otherwise > 50 always wins.",
      },
      {
        type: "write",
        prompt:
          "Write an if/else that prints 'even' if n % 2 == 0, otherwise prints 'odd'. (3 lines)",
        accept: [
          "if n % 2 == 0:\nprint('even')\nelse:\nprint('odd')",
          'if n % 2 == 0:\nprint("even")\nelse:\nprint("odd")',
        ],
        answer: "if n % 2 == 0:\n    print('even')\nelse:\n    print('odd')",
        explain: "Check the remainder, then branch with else for the odd case.",
      },
      {
        type: "missing-punct",
        prompt:
          "This if-statement header is missing its punctuation. Retype the header line correctly.",
        code: "if mark >= 40\n    print('Pass')",
        starter: "if mark >= 40",
        accept: ["if mark >= 40:"],
        answer: "if mark >= 40:",
        strictPunct: true,
        expectedOutput: "Pass",
        wrongOutput: "  File \"program.py\", line 1\n    if mark >= 40\n                ^\nSyntaxError: expected ':'",
        explain: "Every if header ends with a colon.",
      },
      {
        type: "predict",
        prompt: "What does this print when temp = 30?",
        code: "temp = 30\nif temp > 30:\n    print('hot')\nelif temp == 30:\n    print('warm')\nelse:\n    print('cool')",
        options: ["hot", "warm", "cool", "Nothing"],
        answer: "warm",
        explain: "30 > 30 is False, but 30 == 30 is True, so the elif branch runs.",
      },
      {
        type: "write",
        prompt:
          "Write an if/elif/else that prints 'pass' for mark >= 40, 'fail' otherwise. (4 lines)",
        accept: [
          "if mark >= 40:\nprint('pass')\nelse:\nprint('fail')",
          'if mark >= 40:\nprint("pass")\nelse:\nprint("fail")',
        ],
        answer: "if mark >= 40:\n    print('pass')\nelse:\n    print('fail')",
        explain: "One threshold test with an else covers both outcomes.",
      },
    ],
  },
  {
    id: "lists",
    name: "List Operations",
    sector: "Sector 05 · Arrayon Cluster",
    blurb:
      "Lists hold many values in order. You reach any item by index (starting at 0), change it by assigning to that index, and build new lists by appending items that pass a test. max() and min() find the largest and smallest.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [5, 8, 2, 8]\nnums[0] = 10\nprint(nums)",
        options: ["[5, 8, 2, 8]", "[10, 8, 2, 8]", "[10, 8, 2, 10]", "Error"],
        answer: "[10, 8, 2, 8]",
        explain: "Assigning to nums[0] replaces only the first element.",
      },
      {
        type: "mc",
        prompt: "How do you find the largest value in a list called marks?",
        options: ["max(marks)", "marks.max()", "biggest(marks)", "marks[-1]"],
        answer: "max(marks)",
        explain: "max() returns the largest item; marks[-1] is just the last one, not the biggest.",
      },
      {
        type: "write",
        prompt:
          "Write a loop that appends every number > 0 from nums into a new list called positives. Assume positives = [] already exists. (3 lines)",
        accept: [
          "for n in nums:\nif n > 0:\npositives.append(n)",
        ],
        answer: "for n in nums:\n    if n > 0:\n        positives.append(n)",
        explain: "Loop, test each value, and append only the ones that pass.",
      },
      {
        type: "bug",
        prompt: "This should change the 3rd item to 0 but hits the wrong one. Fix?",
        code: "data = [1, 2, 3, 4]\ndata[3] = 0",
        options: [
          "should be data[2] = 0 (indexing starts at 0)",
          "should be data(3) = 0",
          "lists can't be changed",
          "nothing is wrong",
        ],
        answer: "should be data[2] = 0 (indexing starts at 0)",
        explain: "The 3rd item is at index 2 because indexing starts at 0.",
      },
      {
        type: "rewrite",
        prompt:
          "This tries to read the first item but uses the wrong brackets, so it errors. Rewrite the line correctly.",
        code: "data = [10, 20, 30]\nprint(data(0))",
        starter: "print(data(0))",
        accept: ["print(data[0])"],
        answer: "print(data[0])",
        expectedOutput: "10",
        wrongOutput: "TypeError: 'list' object is not callable",
        explain: "Index a list with square brackets, not parentheses.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [4, 9, 2, 7]\nprint(min(nums))",
        options: ["9", "2", "4", "7"],
        answer: "2",
        explain: "min() returns the smallest value in the list, which is 2.",
      },
      {
        type: "mc",
        prompt: "How do you add the value 5 to the end of a list called nums?",
        options: ["nums.append(5)", "nums.add(5)", "nums + 5", "nums.push(5)"],
        answer: "nums.append(5)",
        explain: ".append() adds a single item to the end of a list.",
      },
    ],
  },
  {
    id: "len",
    name: "len() & Length Checks",
    sector: "Sector 06 · Measureon",
    blurb:
      "len() tells you how many items are in a string or list. It's used constantly for validation — checking a password is long enough, a list isn't empty, or looping a set number of times.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: 'word = "python"\nprint(len(word))',
        options: ["5", "6", "7", "python"],
        answer: "6",
        explain: "'python' has six characters, so len returns 6.",
      },
      {
        type: "mc",
        prompt: "Which test is True only when the list items is empty?",
        options: ["len(items) == 0", "items == 0", "len(items) > 0", "items.empty()"],
        answer: "len(items) == 0",
        explain: "An empty list has length 0.",
      },
      {
        type: "write",
        prompt:
          "Write an if statement that prints 'too short' when a string password has fewer than 8 characters. (2 lines)",
        accept: [
          "if len(password) < 8:\nprint('too short')",
          'if len(password) < 8:\nprint("too short")',
        ],
        answer: "if len(password) < 8:\n    print('too short')",
        explain: "Compare len(password) to 8 and print the warning inside the if.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "items = [5, 10, 15, 20]\nprint(len(items))",
        options: ["3", "4", "20", "50"],
        answer: "4",
        explain: "len() counts the number of items, and there are four.",
      },
      {
        type: "mc",
        prompt: "Which test is True when the list nums has more than 3 items?",
        options: ["len(nums) > 3", "nums > 3", "len(nums) >= 3", "nums.size > 3"],
        answer: "len(nums) > 3",
        explain: "len() gives the count; compare that count to 3.",
      },
      {
        type: "rewrite",
        prompt:
          "This tries to get the length but calls len wrongly, so it errors. Rewrite the line correctly.",
        code: "n = len.word",
        starter: "n = len.word",
        accept: ["n = len(word)"],
        answer: "n = len(word)",
        expectedOutput: "(stores the length — no error)",
        wrongOutput: "AttributeError: 'builtin_function_or_method' object has no attribute 'word'",
        explain: "len is a function — call it with parentheses: len(word).",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "name = ''\nprint(len(name))",
        options: ["0", "1", "None", "Error"],
        answer: "0",
        explain: "An empty string has no characters, so its length is 0.",
      },
    ],
  },
  {
    id: "typechecks",
    name: "Type & Digit Checks",
    sector: "Sector 07 · Verifold",
    blurb:
      "Sometimes you need to know what a character is. The string method .isdigit() returns True when a character (or string) is made only of digits 0–9. It's perfect for validating input or counting numbers inside text.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: 'print("7".isdigit())\nprint("a".isdigit())',
        options: ["True True", "True False", "False True", "7 a"],
        answer: "True False",
        explain: "'7' is a digit so it's True; 'a' is a letter so it's False.",
      },
      {
        type: "mc",
        prompt: "Which loop counts how many digits are in the string text?",
        options: [
          "count = 0\nfor ch in text:\n    if ch.isdigit():\n        count += 1",
          "count = text.isdigit()",
          "count = len(text.digits)",
          "for ch in text:\n    count = ch.isdigit()",
        ],
        answer: "count = 0\nfor ch in text:\n    if ch.isdigit():\n        count += 1",
        explain: "Loop each character, test .isdigit(), and add to a running count.",
      },
      {
        type: "bug",
        prompt: "This should test if ch is a digit, but errors. What's wrong?",
        code: "if ch.isdigit:\n    print('digit')",
        options: [
          "isdigit needs parentheses: ch.isdigit()",
          "should be isnumber()",
          "ch must be an int",
          "missing else",
        ],
        answer: "isdigit needs parentheses: ch.isdigit()",
        explain: "Without () you reference the method instead of calling it, so it's always truthy.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: 'print("2024".isdigit())',
        options: ["True", "False", "2024", "Error"],
        answer: "True",
        explain: "Every character in '2024' is a digit, so isdigit() returns True.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: 'print("12a".isdigit())',
        options: ["True", "False", "12", "Error"],
        answer: "False",
        explain: "The 'a' is not a digit, so the whole string fails the test.",
      },
      {
        type: "write",
        prompt:
          "Write an if statement that prints 'number' when a single character ch is a digit. (2 lines)",
        accept: [
          "if ch.isdigit():\nprint('number')",
          'if ch.isdigit():\nprint("number")',
        ],
        answer: "if ch.isdigit():\n    print('number')",
        explain: "Call .isdigit() with parentheses and act inside the if.",
      },
      {
        type: "missing-punct",
        prompt:
          "This calls isdigit but is missing punctuation so it never actually runs the check. Retype the line so the method is called.",
        code: "if ch.isdigit:",
        starter: "if ch.isdigit:",
        accept: ["if ch.isdigit():"],
        answer: "if ch.isdigit():",
        strictPunct: true,
        expectedOutput: "(checks the character correctly)",
        wrongOutput: "(always True — you referenced the method instead of calling it)",
        explain: "Add () so the method runs and returns True/False.",
      },
    ],
  },
  {
    id: "accumulator",
    name: "Accumulator Patterns",
    sector: "Sector 08 · Totalix",
    blurb:
      "An accumulator is a variable you set up before a loop (often to 0) and update on each pass to build a running total or count. This pattern is behind sums, counts, and averages — start at zero, add inside the loop, use the result after.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [4, 6, 10]\ntotal = 0\nfor n in nums:\n    total = total + n\nprint(total)",
        options: ["0", "20", "3", "[4, 6, 10]"],
        answer: "20",
        explain: "total accumulates 4 + 6 + 10 = 20 across the loop.",
      },
      {
        type: "bug",
        prompt: "This always prints the wrong total. What's the mistake?",
        code: "for n in nums:\n    total = 0\n    total = total + n\nprint(total)",
        options: [
          "total = 0 is inside the loop, so it resets every pass",
          "total should be a list",
          "you can't add n",
          "print is misplaced",
        ],
        answer: "total = 0 is inside the loop, so it resets every pass",
        explain: "Initialise the accumulator once, before the loop — not on every iteration.",
      },
      {
        type: "write",
        prompt:
          "Given a list nums, write code that counts how many are greater than 10 into a variable big. Start big = 0. (4 lines incl. the start line)",
        accept: [
          "big = 0\nfor n in nums:\nif n > 10:\nbig += 1",
          "big = 0\nfor n in nums:\nif n > 10:\nbig = big + 1",
        ],
        answer: "big = 0\nfor n in nums:\n    if n > 10:\n        big += 1",
        explain: "Initialise the counter, loop, test, and increment when the test passes.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "count = 0\nfor ch in 'hello':\n    count += 1\nprint(count)",
        options: ["4", "5", "hello", "0"],
        answer: "5",
        explain: "The counter goes up once per character; 'hello' has 5.",
      },
      {
        type: "mc",
        prompt: "What's the right way to start a running total before a loop?",
        options: ["total = 0", "total = []", "total", "total = nums"],
        answer: "total = 0",
        explain: "A numeric accumulator starts at 0 so the first addition works.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "total = 0\nfor n in [2, 4, 6]:\n    total += n\nprint(total)",
        options: ["12", "246", "0", "3"],
        answer: "12",
        explain: "2 + 4 + 6 accumulates to 12.",
      },
      {
        type: "rewrite",
        prompt:
          "This should keep a running total but uses = instead of adding on. Rewrite the line inside the loop so it accumulates.",
        code: "total = 0\nfor n in nums:\n    total = n",
        starter: "total = n",
        accept: ["total = total + n", "total += n"],
        answer: "total += n",
        expectedOutput: "(builds the correct running total)",
        wrongOutput: "(total just holds the LAST number, not the sum)",
        explain: "Use += so each value is added to what's already there.",
      },
    ],
  },
  {
    id: "output",
    name: "Formatted Output",
    sector: "Sector 09 · Glyphline",
    blurb:
      "Neat output makes a program readable. You can join labels and values with commas in print(), use f-strings like f\"{name}: {score}\" to slot values into text, and line things up in columns. The exam often wants labelled, tidy results.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print when name = 'Mia' and age = 16?",
        code: "name = 'Mia'\nage = 16\nprint(f'{name} is {age}')",
        options: ["Mia is 16", "{name} is {age}", "Mia is age", "f'Mia is 16'"],
        answer: "Mia is 16",
        explain: "An f-string substitutes the variables inside the braces.",
      },
      {
        type: "mc",
        prompt: "Which line prints exactly:  Score: 50",
        options: [
          "print('Score:', 50)",
          "print('Score:' 50)",
          "print('Score: 50)",
          "print(Score: 50)",
        ],
        answer: "print('Score:', 50)",
        explain: "print() adds a space between comma-separated arguments, giving 'Score: 50'.",
      },
      {
        type: "write",
        prompt:
          "Using an f-string, write one line that prints the total stored in t as: Total: <value>",
        accept: ["print(f'Total: {t}')", 'print(f"Total: {t}")'],
        answer: "print(f'Total: {t}')",
        explain: "Put the label as plain text and {t} to insert the value.",
      },
      {
        type: "predict",
        prompt: "What does this print when x = 3 and y = 4?",
        code: "x = 3\ny = 4\nprint(x, y)",
        options: ["3 4", "34", "x y", "7"],
        answer: "3 4",
        explain: "Comma-separated values print with a space between them.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "print('Result:', 10 + 5)",
        options: ["Result: 15", "Result: 10 + 5", "Result:15", "15"],
        answer: "Result: 15",
        explain: "The expression is worked out first, then printed after the label.",
      },
      {
        type: "missing-punct",
        prompt:
          "This f-string is missing a quotation mark, so it won't run. Retype the line correctly.",
        code: "print(f'Score: {s})",
        starter: "print(f'Score: {s})",
        accept: ["print(f'Score: {s}')"],
        answer: "print(f'Score: {s}')",
        strictPunct: true,
        expectedOutput: "Score: (value of s)",
        wrongOutput: "  File \"program.py\", line 1\n    print(f'Score: {s})\n                       ^\nSyntaxError: unterminated string literal",
        explain: "Every opening quote needs a matching closing quote.",
      },
      {
        type: "write",
        prompt:
          "Write one line that prints the name in name and age in age as: <name> is <age> — use an f-string.",
        accept: ["print(f'{name} is {age}')", 'print(f"{name} is {age}")'],
        answer: "print(f'{name} is {age}')",
        explain: "Insert both variables into the f-string with braces.",
      },
    ],
  },
  {
    id: "readmodify",
    name: "Read & Modify Code",
    sector: "Sector 10 · Refactoria",
    blurb:
      "A big part of Section C is reading starter code and making a small, correct change. Trace what the code does first, find the one line that needs editing, and change only that — don't rewrite the whole thing.",
    questions: [
      {
        type: "predict",
        prompt: "What does this starter code print?",
        code: "total = 0\nfor n in [1, 2, 3, 4]:\n    total += n\nprint(total)",
        options: ["10", "4", "1234", "0"],
        answer: "10",
        explain: "1 + 2 + 3 + 4 = 10.",
      },
      {
        type: "mc",
        prompt:
          "The code above sums all numbers. Which single change makes it sum only EVEN numbers?",
        options: [
          "add `if n % 2 == 0:` before total += n (and indent it)",
          "change total = 0 to total = 2",
          "change the list to [2, 4]",
          "change += to -=",
        ],
        answer: "add `if n % 2 == 0:` before total += n (and indent it)",
        explain: "Guard the accumulation with an even test; the rest of the structure stays.",
      },
      {
        type: "write",
        prompt:
          "Starter: `for n in nums: print(n)`. Rewrite it as a 2-line loop that prints only n when n > 0.",
        accept: ["for n in nums:\nif n > 0:\nprint(n)"],
        answer: "for n in nums:\n    if n > 0:\n        print(n)",
        explain: "Add an if-guard inside the existing loop rather than changing the loop itself.",
      },
      {
        type: "predict",
        prompt: "What does this starter code print?",
        code: "word = 'python'\nprint(word[0] + word[-1])",
        options: ["pn", "py", "pp", "nn"],
        answer: "pn",
        explain: "First char 'p' joined with last char 'n' gives 'pn'.",
      },
      {
        type: "mc",
        prompt:
          "The code above prints first + last char. Which change makes it print the first TWO characters instead?",
        options: [
          "change to print(word[0] + word[1])",
          "change to print(word[0] + word[0])",
          "change to print(word[-1])",
          "change to print(word + word)",
        ],
        answer: "change to print(word[0] + word[1])",
        explain: "Index 0 and index 1 are the first two characters.",
      },
      {
        type: "rewrite",
        prompt:
          "Starter prints every number. Rewrite the print line into 2 lines so it prints only numbers less than 5. (loop already given: `for n in nums:`)",
        code: "for n in nums:\n    print(n)",
        starter: "print(n)",
        accept: ["if n < 5:\nprint(n)"],
        answer: "if n < 5:\n    print(n)",
        expectedOutput: "(prints only the numbers below 5)",
        wrongOutput: "(still prints every number)",
        explain: "Add an if-guard before the print so only small numbers show.",
      },
      {
        type: "predict",
        prompt: "What does this starter code print?",
        code: "nums = [1, 2, 3]\nnums[1] = nums[1] * 10\nprint(nums)",
        options: ["[1, 20, 3]", "[10, 20, 30]", "[1, 2, 3]", "[1, 12, 3]"],
        answer: "[1, 20, 3]",
        explain: "Only index 1 changes: 2 * 10 = 20.",
      },
    ],
  },
  {
    id: "averages",
    name: "Averages & Medians",
    sector: "Sector 11 · Meanfield",
    blurb:
      "An average (mean) is the total divided by how many items there are: sum / count. The exam usually wants you to compute it without importing libraries — accumulate the total in a loop, count the items (or use len), then divide.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [4, 8, 6]\ntotal = 0\nfor n in nums:\n    total += n\nprint(total / len(nums))",
        options: ["6.0", "18", "3", "9.0"],
        answer: "6.0",
        explain: "Total is 18, len is 3, so 18 / 3 = 6.0.",
      },
      {
        type: "bug",
        prompt: "This average is always wrong (too big). What's the issue?",
        code: "total = 0\nfor n in nums:\n    total += n\naverage = total\nprint(average)",
        options: [
          "it never divides by len(nums)",
          "total should start at 1",
          "you can't divide lists",
          "average is a keyword",
        ],
        answer: "it never divides by len(nums)",
        explain: "The mean is total / number of items; the division step is missing.",
      },
      {
        type: "write",
        prompt:
          "Given a non-empty list scores, write one line that prints the mean using sum() and len().",
        accept: ["print(sum(scores) / len(scores))", "print(sum(scores)/len(scores))"],
        answer: "print(sum(scores) / len(scores))",
        explain: "sum() gives the total, len() gives the count; divide for the mean.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "nums = [10, 20]\nprint(sum(nums) / len(nums))",
        options: ["15.0", "30", "2", "10.0"],
        answer: "15.0",
        explain: "Sum 30 divided by count 2 is 15.0.",
      },
      {
        type: "mc",
        prompt: "What does the mean of a list equal?",
        options: [
          "the total divided by how many items there are",
          "the biggest item",
          "the middle item",
          "the total times the count",
        ],
        answer: "the total divided by how many items there are",
        explain: "Mean = sum ÷ count.",
      },
      {
        type: "rewrite",
        prompt:
          "This computes the mean but divides in the wrong order, giving a tiny number. Rewrite the line correctly.",
        code: "mean = len(nums) / sum(nums)",
        starter: "mean = len(nums) / sum(nums)",
        accept: ["mean = sum(nums) / len(nums)"],
        answer: "mean = sum(nums) / len(nums)",
        expectedOutput: "(correct average)",
        wrongOutput: "(a tiny fraction — you divided count by total)",
        explain: "Divide the total by the count, not the other way round.",
      },
      {
        type: "write",
        prompt:
          "Without using sum(), write a 3-line accumulator that totals nums into total (start total = 0), so you could later divide by len(nums).",
        accept: ["total = 0\nfor n in nums:\ntotal += n", "total = 0\nfor n in nums:\ntotal = total + n"],
        answer: "total = 0\nfor n in nums:\n    total += n",
        explain: "Accumulate the total in a loop, then you'd divide by len(nums) for the mean.",
      },
    ],
  },
  {
    id: "nested",
    name: "Nested Loops",
    sector: "Sector 12 · Latticeon",
    blurb:
      "A nested loop is a loop inside another loop. For every single pass of the outer loop, the inner loop runs completely. They're used for grids, pairs, and patterns — count the total runs by multiplying the two ranges.",
    questions: [
      {
        type: "predict",
        prompt: "How many times does print run here?",
        code: "for i in range(3):\n    for j in range(2):\n        print(i, j)",
        options: ["3", "2", "5", "6"],
        answer: "6",
        explain: "The inner loop (2 runs) happens for each of the 3 outer runs: 3 × 2 = 6.",
      },
      {
        type: "predict",
        prompt: "What is the FIRST line printed?",
        code: "for i in range(2):\n    for j in range(2):\n        print(i, j)",
        options: ["0 0", "0 1", "1 0", "1 1"],
        answer: "0 0",
        explain: "Both loops start at 0, so the first output is 0 0.",
      },
      {
        type: "bug",
        prompt: "This should print a 3x3 grid of stars but prints one long line. Why?",
        code: "for i in range(3):\n    for j in range(3):\n        print('*', end='')",
        options: [
          "there's no print() after the inner loop to start a new line",
          "end='' is illegal",
          "range(3) is wrong",
          "stars can't be printed",
        ],
        answer: "there's no print() after the inner loop to start a new line",
        explain: "Add an empty print() in the outer loop to move to the next row.",
      },
      {
        type: "predict",
        prompt: "How many times does the inner line run in total?",
        code: "for i in range(4):\n    for j in range(3):\n        print('x')",
        options: ["7", "12", "4", "3"],
        answer: "12",
        explain: "4 outer runs × 3 inner runs = 12.",
      },
      {
        type: "predict",
        prompt: "What is the LAST line printed?",
        code: "for i in range(2):\n    for j in range(2):\n        print(i, j)",
        options: ["1 1", "0 0", "1 0", "2 2"],
        answer: "1 1",
        explain: "Both counters reach their highest value (1) on the final pass.",
      },
      {
        type: "mc",
        prompt: "In a nested loop, how many times does the inner loop run?",
        options: [
          "fully, once for every single pass of the outer loop",
          "once in total",
          "only on the first outer pass",
          "the same number of times as the outer loop only",
        ],
        answer: "fully, once for every single pass of the outer loop",
        explain: "The inner loop completes entirely for each outer iteration.",
      },
      {
        type: "missing-punct",
        prompt:
          "The inner for-loop header is missing its punctuation. Retype the inner header line correctly.",
        code: "for i in range(3):\n    for j in range(3)\n        print(i, j)",
        starter: "for j in range(3)",
        accept: ["for j in range(3):"],
        answer: "for j in range(3):",
        strictPunct: true,
        expectedOutput: "(runs the nested loop — no error)",
        wrongOutput: "  File \"program.py\", line 2\n    for j in range(3)\n                     ^\nSyntaxError: expected ':'",
        explain: "Both loop headers — inner and outer — need a colon.",
      },
    ],
  },
  {
    id: "dicts",
    name: "Dictionaries (Basic)",
    sector: "Sector 13 · Keyvault",
    blurb:
      "A dictionary stores key–value pairs, like a labelled lookup table: ages = {'Mia': 16}. You read a value with ages['Mia'], add or update with ages['Sam'] = 17, and loop over keys with `for key in ages:`.",
    questions: [
      {
        type: "predict",
        prompt: "What does this print?",
        code: "ages = {'Mia': 16, 'Sam': 17}\nprint(ages['Sam'])",
        options: ["16", "17", "Sam", "KeyError"],
        answer: "17",
        explain: "Looking up the key 'Sam' returns its value, 17.",
      },
      {
        type: "mc",
        prompt: "How do you add a new pair 'Lee' → 15 to the dictionary ages?",
        options: [
          "ages['Lee'] = 15",
          "ages.add('Lee', 15)",
          "ages['Lee', 15]",
          "ages += {'Lee': 15}",
        ],
        answer: "ages['Lee'] = 15",
        explain: "Assigning to a new key creates the pair.",
      },
      {
        type: "write",
        prompt:
          "Write a 2-line loop that prints every key in a dictionary called scores.",
        accept: ["for key in scores:\nprint(key)", "for k in scores:\nprint(k)"],
        answer: "for key in scores:\n    print(key)",
        explain: "Looping directly over a dict gives its keys.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "fruit = {'apple': 3, 'pear': 5}\nprint(fruit['apple'])",
        options: ["3", "5", "apple", "KeyError"],
        answer: "3",
        explain: "Looking up 'apple' returns its value, 3.",
      },
      {
        type: "predict",
        prompt: "What does this print?",
        code: "d = {'a': 1}\nd['a'] = d['a'] + 10\nprint(d['a'])",
        options: ["11", "1", "10", "Error"],
        answer: "11",
        explain: "The value at 'a' is updated from 1 to 11.",
      },
      {
        type: "mc",
        prompt: "How do you check whether the key 'Mia' is in the dictionary ages?",
        options: [
          "'Mia' in ages",
          "ages.has('Mia')",
          "ages['Mia'] exists",
          "in ages('Mia')",
        ],
        answer: "'Mia' in ages",
        explain: "`in` tests whether a key is present in the dictionary.",
      },
      {
        type: "rewrite",
        prompt:
          "This tries to read a value but uses the wrong brackets, so it errors. Rewrite the line correctly to read the value for key 'Sam'.",
        code: "print(ages('Sam'))",
        starter: "print(ages('Sam'))",
        accept: ["print(ages['Sam'])"],
        answer: "print(ages['Sam'])",
        expectedOutput: "(prints Sam's value)",
        wrongOutput: "TypeError: 'dict' object is not callable",
        explain: "Look up a dictionary value with square brackets, not parentheses.",
      },
    ],
  },
];

/* --------------------------- HELPERS --------------------------- */

// Fisher–Yates shuffle — returns a NEW shuffled array, leaves the original alone.
// Used to randomise question order per playthrough and option order per question.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Rank derived from completed-topic count (kept simple; uses your astronaut ranks)
function rankFor(done) {
  if (done >= 13) return "Cosmic Legend";
  if (done >= 9) return "Galaxy Commander";
  if (done >= 6) return "Nebula Navigator";
  if (done >= 3) return "Orbit Explorer";
  return "Rookie Astronaut";
}

// Normalise free-text code answers so trivial whitespace differences still match.
// We strip trailing spaces, collapse each line, and turn indentation into a single
// marker so the learner isn't punished for 2 vs 4 spaces.
function normalise(src) {
  return src
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim().replace(/\s+/g, " ");
      const indented = /^\s+/.test(line) ? "> " : "";
      return indented + trimmed;
    })
    .filter((l) => l !== "")
    .join("\n")
    .toLowerCase()
    .replace(/"/g, "'");
}

function checkWritten(input, accepted) {
  const got = normalise(input);
  return accepted.some((a) => normalise(a) === got);
}

// Strict version for punctuation questions: collapse only redundant spacing,
// but KEEP quotes and all punctuation exactly as typed. A missing colon,
// comma, bracket or quote will therefore fail the match.
function normaliseStrict(src) {
  return src
    .replace(/\t/g, "    ")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, "")) // trailing space only
    .filter((l) => l.trim() !== "")
    .join("\n")
    .replace(/[ ]{2,}/g, " "); // collapse runs of spaces, keep single spaces
}

// Unified checker for the write-in family.
// q.accept    : array of accepted answers
// q.strictPunct: if true, quotes/punctuation must match exactly
function checkWriteIn(input, q) {
  const accepted = q.accept || [q.answer];
  if (q.strictPunct) {
    const got = normaliseStrict(input);
    return accepted.some((a) => normaliseStrict(a) === got);
  }
  return checkWritten(input, accepted);
}

/* -------------------------- COMPONENTS ------------------------- */

// Animated cosmic backdrop: black hole + accretion ring + drifting stars.
// Pure CSS keyframes so the artifact needs no animation library.
function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
      })),
    []
  );
  return (
    <div className="psl-bg" aria-hidden="true">
      <style>{`
        @keyframes psl-twinkle { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes psl-spin { to { transform: rotate(360deg) } }
        @keyframes psl-pulse { 0%,100%{box-shadow:0 0 60px 10px #9B5CFF55} 50%{box-shadow:0 0 90px 20px #00D9FF55} }
        @media (prefers-reduced-motion: reduce){
          .psl-star,.psl-ring{animation:none!important}
        }
      `}</style>
      {stars.map((s, i) => (
        <span
          key={i}
          className="psl-star"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#fff",
            animation: `psl-twinkle 3s ${s.delay}s infinite`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: "12%",
          right: "8%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, #000 38%, #9B5CFF 40%, transparent 70%)",
          animation: "psl-pulse 5s infinite",
        }}
      />
      <div
        className="psl-ring"
        style={{
          position: "absolute",
          top: "12%",
          right: "8%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          border: "2px solid #00D9FF88",
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          animation: "psl-spin 8s linear infinite",
        }}
      />
    </div>
  );
}

function Hud({ score, done, total }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="psl-hud">
      <div className="psl-hud-row">
        <span className="psl-chip">Score: {score}</span>
        <span className="psl-chip">🚀 {rankFor(done)}</span>
        <span className="psl-chip">
          🪐 Sectors: {done}/{total}
        </span>
      </div>
      <div className="psl-progress">
        <div className="psl-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SectorMap({ completed, onPick }) {
  // A sector is unlocked if it's the first, or the previous one is complete.
  return (
    <div className="psl-grid">
      {TOPICS.map((t, i) => {
        const isDone = completed.has(t.id);
        const unlocked = i === 0 || completed.has(TOPICS[i - 1].id);
        return (
          <button
            key={t.id}
            className={`psl-node ${isDone ? "done" : ""} ${unlocked ? "" : "locked"}`}
            disabled={!unlocked}
            onClick={() => unlocked && onPick(t.id)}
          >
            <div className="psl-node-sector">{t.sector}</div>
            <div className="psl-node-name">{t.name}</div>
            <div className="psl-node-state">
              {isDone ? "✅ Cleared" : unlocked ? "▶ Launch" : "🔒 Locked"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TopicIntro({ topic, onStart, onBack }) {
  return (
    <div className="psl-panel">
      <div className="psl-node-sector">{topic.sector}</div>
      <h2 className="psl-h2">{topic.name}</h2>
      <p className="psl-blurb">{topic.blurb}</p>
      <div className="psl-row">
        <button className="psl-btn" onClick={onStart}>
          Begin mission ({topic.questions.length} questions)
        </button>
        <button className="psl-btn ghost" onClick={onBack}>
          Back to map
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ q, onResult }) {
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState(q.starter || "");
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [consoleText, setConsoleText] = useState(null); // simulated output
  const [showHint, setShowHint] = useState(false);

  // Write-in family: user types code, presses RUN, sees simulated console output.
  const WRITE_IN = ["rewrite", "missing-word", "missing-punct"];
  const isWriteIn = WRITE_IN.includes(q.type);
  const isWrite = q.type === "write";
  const isTyped = isWrite || isWriteIn;

  // For multiple-choice family: grade on "Check answer".
  function submitChoice() {
    const ok = isWrite ? checkWritten(typed, q.accept) : selected === q.answer;
    setCorrect(ok);
    setRevealed(true);
  }

  // For write-in family: RUN grades, simulates console output, then reveals.
  function run() {
    const ok = checkWriteIn(typed, q);
    setCorrect(ok);
    // Show the authored "correct" output, or the wrong output / Python error.
    setConsoleText(ok ? q.expectedOutput : q.wrongOutput);
    setRevealed(true);
  }

  const typeLabel = {
    mc: "Multiple choice",
    predict: "Predict the output",
    bug: "Spot the bug",
    write: "Write the code",
    rewrite: "Rewrite the line",
    "missing-word": "Add the missing word",
    "missing-punct": "Fix the punctuation",
  }[q.type];

  // Use the question's own hint if it has one; otherwise fall back to the
  // explanation so the hint button always has something helpful to show.
  const hintText = q.hint || q.explain;

  // Shuffle the answer options once per question (useMemo keyed on the prompt),
  // so they don't reorder on every click but DO differ between playthroughs.
  const shuffledOptions = useMemo(
    () => (q.options ? shuffle(q.options) : []),
    [q.prompt]
  );

  return (
    <div className="psl-card">
      <div className="psl-qtype">{typeLabel}</div>
      <p className="psl-prompt">{q.prompt}</p>
      {q.code && <pre className="psl-code">{q.code}</pre>}

      {/* ---- Multiple-choice family ---- */}
      {!isTyped && (
        <div className="psl-options">
          {shuffledOptions.map((opt) => {
            const chosen = selected === opt;
            let cls = "psl-opt";
            if (revealed) {
              if (opt === q.answer) cls += " right";
              else if (chosen) cls += " wrong";
            } else if (chosen) cls += " chosen";
            return (
              <button
                key={opt}
                className={cls}
                disabled={revealed}
                onClick={() => setSelected(opt)}
              >
                <pre className="psl-opt-text">{opt}</pre>
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Typed answer box (both write & write-in) ---- */}
      {isTyped && (
        <textarea
          className="psl-input"
          rows={isWriteIn ? 3 : 4}
          spellCheck={false}
          placeholder="Type your Python here…"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={revealed}
        />
      )}

      {/* ---- Action button + Hint button (side by side) ---- */}
      {!revealed && (
        <div className="psl-actions">
          {!isWriteIn && (
            <button
              className="psl-btn"
              disabled={isWrite ? typed.trim() === "" : selected === null}
              onClick={submitChoice}
            >
              Check answer
            </button>
          )}
          {isWriteIn && (
            <button
              className="psl-run"
              disabled={typed.trim() === ""}
              onClick={run}
            >
              ▶ RUN
            </button>
          )}
          <button
            className="psl-hint-btn"
            onClick={() => setShowHint((h) => !h)}
          >
            💡 {showHint ? "Hide hint" : "Hint"}
          </button>
        </div>
      )}

      {/* ---- Hint popup ---- */}
      {!revealed && showHint && (
        <div className="psl-hint-box">💡 {hintText}</div>
      )}

      {/* ---- Simulated console (write-in only) ---- */}
      {isWriteIn && consoleText !== null && (
        <div className="psl-console" role="status" aria-live="polite">
          <div className="psl-console-bar">
            <span className="psl-dot r" />
            <span className="psl-dot y" />
            <span className="psl-dot g" />
            <span className="psl-console-title">output</span>
          </div>
          <pre className="psl-console-body">
            {">>> python program.py\n" + consoleText}
          </pre>
        </div>
      )}

      {/* ---- Feedback ---- */}
      {revealed && (
        <div className={`psl-feedback ${correct ? "ok" : "no"}`}>
          <strong>{correct ? "✅ Correct! +10" : "❌ Not quite."}</strong>
          {!correct && (
            <div className="psl-answerline">
              Answer:
              <pre className="psl-code small">{q.answer}</pre>
            </div>
          )}
          <p className="psl-explain">{q.explain}</p>
          <button className="psl-btn" onClick={() => onResult(correct)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function Quiz({ topic, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);

  // Shuffle the questions once when this topic's quiz starts, so the order
  // differs every playthrough. useMemo keyed on topic.id keeps it stable
  // while the player works through this attempt.
  const questions = useMemo(() => shuffle(topic.questions), [topic.id]);

  function handleResult(correct) {
    const newHits = hits + (correct ? 1 : 0);
    if (idx + 1 >= questions.length) {
      onFinish(newHits, questions.length);
    } else {
      setHits(newHits);
      setIdx(idx + 1);
    }
  }

  return (
    <div className="psl-panel">
      <div className="psl-row between">
        <div className="psl-node-sector">{topic.sector}</div>
        <button className="psl-btn ghost small" onClick={onBack}>
          Abort to map
        </button>
      </div>
      <div className="psl-counter">
        Question {idx + 1} of {questions.length}
      </div>
      <QuestionCard key={idx} q={questions[idx]} onResult={handleResult} />
    </div>
  );
}

/* ----------------------------- APP ----------------------------- */

export default function App() {
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [screen, setScreen] = useState("map"); // map | intro | quiz | result
  const [activeId, setActiveId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const active = TOPICS.find((t) => t.id === activeId) || null;

  function pickTopic(id) {
    setActiveId(id);
    setScreen("intro");
  }

  function finishTopic(hits, total) {
    setScore((s) => s + hits * 10);
    setCompleted((prev) => new Set(prev).add(activeId));
    setLastResult({ hits, total });
    setScreen("result");
  }

  return (
    <div className="psl-wrap">
      <style>{styles}</style>
      <StarField />
      <header className="psl-header">
        <div className="psl-logo">
          <span className="psl-logo-icon">🐍</span>
          <span className="psl-logo-text">PYTHON SPEED LEARNER</span>
        </div>
        <div className="psl-sub">Leaving Cert · Section C drills</div>
      </header>

      <Hud score={score} done={completed.size} total={TOPICS.length} />

      <main className="psl-main">
        {screen === "map" && (
          <>
            <p className="psl-lead">
              Pick a sector to drill. Clear one to unlock the next — they run in
              exam-priority order.
            </p>
            <SectorMap completed={completed} onPick={pickTopic} />
          </>
        )}

        {screen === "intro" && active && (
          <TopicIntro
            topic={active}
            onStart={() => setScreen("quiz")}
            onBack={() => setScreen("map")}
          />
        )}

        {screen === "quiz" && active && (
          <Quiz
            topic={active}
            onFinish={finishTopic}
            onBack={() => setScreen("map")}
          />
        )}

        {screen === "result" && active && lastResult && (
          <div className="psl-panel center">
            <h2 className="psl-h2">{active.name} — cleared</h2>
            <p className="psl-bigscore">
              {lastResult.hits} / {lastResult.total} correct
            </p>
            <p className="psl-explain">
              +{lastResult.hits * 10} points added. New rank:{" "}
              {rankFor(completed.size)}.
            </p>
            <div className="psl-row center">
              <button className="psl-btn" onClick={() => setScreen("map")}>
                Back to sector map
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------------------- STYLES --------------------------- */

const styles = `
.psl-wrap{position:relative;min-height:100vh;overflow-x:hidden;
  font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;
  color:#fff;background:#050510;padding:18px;box-sizing:border-box}
.psl-bg{position:fixed;inset:0;z-index:0;overflow:hidden;
  background:radial-gradient(ellipse at 70% 20%, #15123a 0%, #050510 60%)}
.psl-wrap>*:not(.psl-bg){position:relative;z-index:1}

.psl-header{text-align:center;margin-bottom:14px}
.psl-logo{display:inline-flex;align-items:center;gap:10px}
.psl-logo-icon{font-size:30px;filter:drop-shadow(0 0 8px #00FF88)}
.psl-logo-text{font-weight:800;letter-spacing:3px;font-size:clamp(20px,4vw,34px);
  background:linear-gradient(90deg,#00D9FF,#9B5CFF,#00FFFF);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:0 0 24px #00D9FF55}
.psl-sub{color:#9B5CFF;letter-spacing:2px;font-size:12px;margin-top:4px;text-transform:uppercase}

.psl-hud{max-width:900px;margin:0 auto 18px}
.psl-hud-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.psl-chip{background:#0d0d24;border:1px solid #00D9FF44;border-radius:999px;
  padding:6px 14px;font-size:13px;box-shadow:0 0 12px #00D9FF22}
.psl-progress{height:8px;background:#0d0d24;border-radius:999px;overflow:hidden;
  border:1px solid #ffffff14}
.psl-progress-fill{height:100%;background:linear-gradient(90deg,#00D9FF,#00FF88);
  transition:width .5s ease}

.psl-main{max-width:900px;margin:0 auto}
.psl-lead,.psl-blurb,.psl-explain{line-height:1.5}
.psl-lead{text-align:center;color:#c9c9e6;margin-bottom:18px}

.psl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.psl-node{text-align:left;background:#0c0c22;border:1px solid #9B5CFF33;border-radius:16px;
  padding:16px;color:#fff;cursor:pointer;transition:transform .15s,box-shadow .15s;min-height:104px}
.psl-node:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 0 24px #9B5CFF55;border-color:#00D9FF}
.psl-node.done{border-color:#00FF8855;box-shadow:0 0 16px #00FF8822}
.psl-node.locked{opacity:.4;cursor:not-allowed}
.psl-node-sector{font-size:11px;letter-spacing:1px;color:#00FFFF;text-transform:uppercase}
.psl-node-name{font-size:17px;font-weight:700;margin:6px 0}
.psl-node-state{font-size:13px;color:#c9c9e6}

.psl-panel{background:#0a0a1e;border:1px solid #9B5CFF33;border-radius:18px;padding:22px;
  box-shadow:0 0 30px #00000066}
.psl-panel.center{text-align:center}
.psl-h2{font-size:24px;margin:6px 0 12px;color:#00D9FF}
.psl-blurb{color:#d6d6ef;background:#11112b;border-left:3px solid #9B5CFF;
  padding:12px 14px;border-radius:8px;margin-bottom:18px}

.psl-row{display:flex;gap:10px;flex-wrap:wrap}
.psl-row.center{justify-content:center}
.psl-row.between{justify-content:space-between;align-items:center}

.psl-btn{background:linear-gradient(90deg,#00D9FF,#9B5CFF);color:#06061a;font-weight:700;
  border:none;border-radius:10px;padding:11px 18px;cursor:pointer;font-size:14px;
  transition:transform .12s,box-shadow .12s}
.psl-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 20px #00D9FF88}
.psl-btn:disabled{opacity:.4;cursor:not-allowed}
.psl-btn.ghost{background:transparent;border:1px solid #ffffff33;color:#fff}
.psl-btn.small{padding:7px 12px;font-size:12px}

.psl-counter{color:#9B5CFF;font-size:13px;margin:10px 0 14px;letter-spacing:1px}
.psl-card{background:#0d0d24;border:1px solid #ffffff10;border-radius:14px;padding:18px}
.psl-qtype{display:inline-block;font-size:11px;text-transform:uppercase;letter-spacing:1px;
  color:#00FFFF;border:1px solid #00FFFF44;border-radius:999px;padding:3px 10px;margin-bottom:10px}
.psl-prompt{font-size:17px;font-weight:600;margin:0 0 12px}
.psl-code{background:#05050f;border:1px solid #00D9FF22;border-radius:10px;padding:12px;
  font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:13px;
  white-space:pre-wrap;overflow-x:auto;color:#9fffe0;margin:0 0 14px}
.psl-code.small{margin:6px 0 0;color:#fff}

.psl-options{display:grid;gap:10px;margin-bottom:14px}
.psl-opt{text-align:left;background:#11112b;border:1px solid #ffffff14;border-radius:10px;
  padding:10px 12px;color:#fff;cursor:pointer;transition:border-color .12s,background .12s}
.psl-opt:hover:not(:disabled){border-color:#00D9FF}
.psl-opt.chosen{border-color:#9B5CFF;background:#1a1640}
.psl-opt.right{border-color:#00FF88;background:#0c2a1c;box-shadow:0 0 14px #00FF8844}
.psl-opt.wrong{border-color:#FF4D6D;background:#2a0c14}
.psl-opt-text{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;
  white-space:pre-wrap;background:none;color:inherit}

.psl-input{width:100%;box-sizing:border-box;background:#05050f;color:#9fffe0;
  border:1px solid #00D9FF33;border-radius:10px;padding:12px;font-size:13px;
  font-family:ui-monospace,Menlo,Consolas,monospace;margin-bottom:14px;resize:vertical}

/* Green RUN button — uses the success-green from the palette */
.psl-run{background:linear-gradient(90deg,#00FF88,#00D9AA);color:#04130c;font-weight:800;
  letter-spacing:1px;border:none;border-radius:10px;padding:11px 22px;cursor:pointer;
  font-size:14px;transition:transform .12s,box-shadow .12s;box-shadow:0 0 16px #00FF8855}
.psl-run:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 26px #00FF88aa}
.psl-run:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}

/* Action row: keeps Check/RUN and the Hint button side by side */
.psl-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}

/* Light-yellow hint button */
.psl-hint-btn{background:#fff3b0;color:#5a4b00;font-weight:700;border:1px solid #ffe066;
  border-radius:10px;padding:11px 16px;cursor:pointer;font-size:14px;
  transition:transform .12s,box-shadow .12s}
.psl-hint-btn:hover{transform:translateY(-2px);box-shadow:0 0 16px #ffe06688;background:#fff7c4}

.psl-hint-box{margin-top:12px;background:#241f08;border:1px solid #ffe06655;
  border-left:3px solid #ffe066;border-radius:10px;padding:12px 14px;
  color:#ffe9a8;font-size:14px;line-height:1.5}

/* Terminal-style console for simulated output */
.psl-console{margin:14px 0;border:1px solid #00FF8833;border-radius:12px;overflow:hidden;
  background:#04040c;box-shadow:0 0 18px #00000088}
.psl-console-bar{display:flex;align-items:center;gap:7px;padding:8px 12px;
  background:#0a0a18;border-bottom:1px solid #ffffff10}
.psl-dot{width:11px;height:11px;border-radius:50%}
.psl-dot.r{background:#FF4D6D}.psl-dot.y{background:#ffcf5c}.psl-dot.g{background:#00FF88}
.psl-console-title{margin-left:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;
  color:#7a7aa8}
.psl-console-body{margin:0;padding:14px;font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:13px;line-height:1.55;color:#00FF88;white-space:pre-wrap;
  text-shadow:0 0 8px #00FF8844;min-height:42px}

.psl-feedback{border-radius:12px;padding:14px;margin-top:6px}
.psl-feedback.ok{background:#0c2a1c;border:1px solid #00FF8855}
.psl-feedback.no{background:#2a0c14;border:1px solid #FF4D6D55}
.psl-answerline{margin:8px 0;font-size:14px}
.psl-explain{color:#d6d6ef;font-size:14px;margin:8px 0 12px}
.psl-bigscore{font-size:40px;font-weight:800;color:#00FF88;margin:10px 0}

@media (max-width:520px){
  .psl-grid{grid-template-columns:1fr 1fr}
  .psl-logo-text{letter-spacing:1.5px}
}
`;
