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
    tiers: { "rookie": [
        { "type": "mc", "prompt": "Which expression gives the LAST character of the string word?", "options": [
          "word[1]",
          "word[-1]",
          "word[len(word)]",
          "word.last()"
        ], "answer": "word[-1]", "explain": "Negative indexing counts from the end, so -1 is the last character." },
        { "type": "predict", "prompt": "What does this print?", "code": "word = \"radar\"\ncount = 0\nfor ch in word:\n    if ch == \"r\":\n        count = count + 1\nprint(count)", "options": [
          "1",
          "2",
          "3",
          "radar"
        ], "answer": "2", "explain": "There are two 'r' characters in 'radar'." },
        { "type": "mc", "prompt": "How do you check whether the character ch is a vowel?", "options": [
          "if ch in \"aeiou\":",
          "if ch = \"aeiou\":",
          "if vowel(ch):",
          "if ch.vowel():"
        ], "answer": "if ch in \"aeiou\":", "explain": "`in` tests membership against those five letters." },
        { "type": "write", "prompt": "Write one line that prints the first character of a string stored in name.", "accept": [
          "print(name[0])"
        ], "answer": "print(name[0])", "explain": "Index 0 is the first character." },
        { "type": "bug", "prompt": "This should count the letters in word but it errors. Which line is wrong?", "code": "1  total = 0\n2  for ch in word\n3      total = total + 1\n4  print(total)", "options": [
          "Line 1",
          "Line 2",
          "Line 3",
          "Line 4"
        ], "answer": "Line 2", "explain": "A for-loop header needs a colon: `for ch in word:`." },
        { "type": "missing-punct", "prompt": "This line is missing punctuation so it won't run. Retype it correctly.", "code": "for ch in word", "starter": "for ch in word", "accept": [
          "for ch in word:"
        ], "answer": "for ch in word:", "strictPunct": true, "expectedOutput": "(loops over each character — no error)", "wrongOutput": "  File \"program.py\", line 1\n    for ch in word\n                  ^\nSyntaxError: expected ':'", "explain": "A for-loop header must end with a colon." },
        { "type": "rewrite", "prompt": "This should print the LAST character of word, but prints the first. Rewrite it.", "code": "print(word[0])", "starter": "print(word[0])", "accept": [
          "print(word[-1])"
        ], "answer": "print(word[-1])", "expectedOutput": "(prints the last character)", "wrongOutput": "p   ← this is the FIRST character, not the last", "explain": "Use index -1 to reach the last character." }
      ], "nebula": [
        { "type": "predict", "prompt": "What does this print?", "code": "word = \"banana\"\ncount = 0\nfor ch in word:\n    if ch in \"aeiou\":\n        count += 1\nprint(count)", "options": [
          "2",
          "3",
          "4",
          "6"
        ], "answer": "3", "explain": "The vowels in 'banana' are a, a, a → 3." },
        { "type": "predict", "prompt": "What does this print?", "code": "word = \"python\"\nprint(word[1] + word[-2])", "options": [
          "yo",
          "yn",
          "po",
          "ph"
        ], "answer": "yo", "explain": "word[1] is 'y', word[-2] is 'o' → 'yo'." },
        { "type": "write", "prompt": "Write a 3-line loop that counts the vowels in word into a variable count (start count = 0).", "accept": [
          "count = 0\nfor ch in word:\nif ch in 'aeiou':\ncount += 1",
          "count = 0\nfor ch in word:\nif ch in \"aeiou\":\ncount += 1",
          "count = 0\nfor ch in word:\nif ch in 'aeiou':\ncount = count + 1"
        ], "answer": "count = 0\nfor ch in word:\n    if ch in 'aeiou':\n        count += 1", "explain": "Initialise, loop each character, test membership, increment." },
        { "type": "bug", "prompt": "This should count digits in s but counts everything. What's wrong?", "code": "count = 0\nfor ch in s:\n    count += 1", "options": [
          "missing an if ch.isdigit() test",
          "count should start at 1",
          "needs range()",
          "ch is undefined"
        ], "answer": "missing an if ch.isdigit() test", "explain": "It increments for every character; guard it with a digit test." },
        { "type": "rewrite", "prompt": "This builds the reverse but the slice is wrong. Rewrite the line to reverse word.", "code": "rev = word[::1]", "starter": "rev = word[::1]", "accept": [
          "rev = word[::-1]"
        ], "answer": "rev = word[::-1]", "expectedOutput": "(reverses the string)", "wrongOutput": "(unchanged — step of 1 keeps the original order)", "explain": "A step of -1 walks the string backwards." },
        { "type": "predict", "prompt": "What does this print?", "code": "name = \"Mia\"\nprint(name[0:2])", "options": [
          "Mi",
          "Mia",
          "ia",
          "M"
        ], "answer": "Mi", "explain": "Slice 0:2 takes indexes 0 and 1, stopping before 2." },
        { "type": "missing-word", "prompt": "Fill the missing method so this lowercases word before checking. Retype the line.", "code": "if word.___() == 'yes':", "starter": "if word.___() == 'yes':", "accept": [
          "if word.lower() == 'yes':",
          "if word.lower() == \"yes\":"
        ], "answer": "if word.lower() == 'yes':", "expectedOutput": "(compares case-insensitively)", "wrongOutput": "(NameError or wrong match without .lower())", "explain": ".lower() returns a lowercase copy for safe comparison." }
      ], "cosmic": [
        { "type": "predict", "prompt": "What does this print?", "code": "word = \"mississippi\"\ncount = 0\nfor i in range(len(word)):\n    if word[i] == \"s\":\n        count += 1\nprint(count)", "options": [
          "2",
          "4",
          "3",
          "5"
        ], "answer": "4", "explain": "Indexing by position, there are four 's' characters in 'mississippi'." },
        { "type": "predict", "prompt": "What does this print?", "code": "s = \"abcabc\"\nresult = \"\"\nfor ch in s:\n    if ch not in result:\n        result += ch\nprint(result)", "options": [
          "abc",
          "abcabc",
          "aabbcc",
          "cba"
        ], "answer": "abc", "explain": "Each new character is added only the first time it's seen → 'abc'." },
        { "type": "write", "prompt": "Write a function count_upper(s) that returns how many UPPERCASE letters are in s. Use .isupper().", "accept": [
          "def count_upper(s):\nc = 0\nfor ch in s:\nif ch.isupper():\nc += 1\nreturn c",
          "def count_upper(s):\ncount = 0\nfor ch in s:\nif ch.isupper():\ncount += 1\nreturn count"
        ], "answer": "def count_upper(s):\n    c = 0\n    for ch in s:\n        if ch.isupper():\n            c += 1\n    return c", "explain": "Accumulate inside the function and return the count." },
        { "type": "bug", "prompt": "This should print each character with its index, but errors. What's wrong?", "code": "for i in word:\n    print(i, word[i])", "options": [
          "i is the character, not an index — use range(len(word))",
          "print needs a comma",
          "word is immutable",
          "missing colon"
        ], "answer": "i is the character, not an index — use range(len(word))", "explain": "Looping over a string gives characters; to index, loop range(len(word))." },
        { "type": "predict", "prompt": "What does this print?", "code": "s = \"hello world\"\nwords = 0\nfor ch in s:\n    if ch == \" \":\n        words += 1\nprint(words + 1)", "options": [
          "1",
          "2",
          "11",
          "10"
        ], "answer": "2", "explain": "One space → words counter 1, plus 1 = 2 (a no-split word count)." },
        { "type": "rewrite", "prompt": "Rewrite the body into 2 lines so it builds a string of only the consonants of word (vowels skipped). Loop given: `for ch in word:` and `out` starts as ''.", "code": "for ch in word:\n    out += ch", "starter": "out += ch", "accept": [
          "if ch not in 'aeiou':\nout += ch",
          "if ch not in \"aeiou\":\nout += ch"
        ], "answer": "if ch not in 'aeiou':\n    out += ch", "expectedOutput": "(out collects only consonants)", "wrongOutput": "(out collects every character, vowels included)", "explain": "Guard the append with a 'not a vowel' test." },
        { "type": "predict", "prompt": "What does this print?", "code": "word = \"level\"\nis_pal = True\nfor i in range(len(word)):\n    if word[i] != word[-1-i]:\n        is_pal = False\nprint(is_pal)", "options": [
          "True",
          "False",
          "level",
          "None"
        ], "answer": "True", "explain": "'level' reads the same forwards and backwards, so it stays True." }
      ] },
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
    tiers: { "rookie": [
        { "type": "predict", "prompt": "What does this print?", "code": "nums = [3, 6, 9]\nfor n in nums:\n    print(n * 2)", "options": [
          "3 6 9",
          "6 12 18",
          "[6, 12, 18]",
          "2 2 2"
        ], "answer": "6 12 18", "explain": "Each item is doubled and printed: 6, 12, 18." },
        { "type": "mc", "prompt": "Which loop prints every name in the list students?", "options": [
          "for name in students:\n    print(name)",
          "for students in name:\n    print(name)",
          "print(students in name)",
          "while students:\n    print(name)"
        ], "answer": "for name in students:\n    print(name)", "explain": "The loop variable takes each element in turn." },
        { "type": "write", "prompt": "Write a 2-line for-loop that prints each item of a list called colours.", "accept": [
          "for c in colours:\nprint(c)",
          "for colour in colours:\nprint(colour)"
        ], "answer": "for c in colours:\n    print(c)", "explain": "Loop the list and print the loop variable." },
        { "type": "bug", "prompt": "This should print each score but prints nothing useful. What's wrong?", "code": "scores = [10, 20, 30]\nfor s in scores:\nprint(s)", "options": [
          "scores is spelled wrong",
          "print(s) is not indented",
          "the list is empty",
          "can't loop over numbers"
        ], "answer": "print(s) is not indented", "explain": "The loop body must be indented." },
        { "type": "predict", "prompt": "What does this print?", "code": "for i in range(4):\n    print(i)", "options": [
          "1 2 3 4",
          "0 1 2 3",
          "0 1 2 3 4",
          "4"
        ], "answer": "0 1 2 3", "explain": "range(4) is 0,1,2,3 — starts at 0, stops before 4." },
        { "type": "mc", "prompt": "Which loop adds up every number in the list nums?", "options": [
          "total = 0\nfor n in nums:\n    total += n",
          "total = 0\nfor n in nums:\ntotal += n",
          "for n in nums:\n    total = n",
          "total = sum"
        ], "answer": "total = 0\nfor n in nums:\n    total += n", "explain": "Start a total at 0, add each item inside the loop." },
        { "type": "missing-punct", "prompt": "This loop header over a list is missing its punctuation. Retype it.", "code": "for item in shopping", "starter": "for item in shopping", "accept": [
          "for item in shopping:"
        ], "answer": "for item in shopping:", "strictPunct": true, "expectedOutput": "(loops over each item — no error)", "wrongOutput": "  File \"program.py\", line 1\n    for item in shopping\n                        ^\nSyntaxError: expected ':'", "explain": "A for-loop header always ends with a colon." }
      ], "nebula": [
        { "type": "predict", "prompt": "What does this print?", "code": "total = 0\nfor n in range(1, 5):\n    total += n\nprint(total)", "options": [
          "10",
          "15",
          "4",
          "5"
        ], "answer": "10", "explain": "range(1,5) is 1,2,3,4 → 1+2+3+4 = 10." },
        { "type": "predict", "prompt": "What does this print?", "code": "for i in range(0, 10, 2):\n    print(i)", "options": [
          "0 2 4 6 8",
          "0 1 2 ... 10",
          "2 4 6 8 10",
          "0 2 4 6 8 10"
        ], "answer": "0 2 4 6 8", "explain": "Step 2 from 0, stopping before 10: 0,2,4,6,8." },
        { "type": "write", "prompt": "Write a 2-line loop that prints the numbers 1 to 5 using range.", "accept": [
          "for i in range(1, 6):\nprint(i)",
          "for n in range(1, 6):\nprint(n)"
        ], "answer": "for i in range(1, 6):\n    print(i)", "explain": "range(1,6) gives 1..5 because the stop is exclusive." },
        { "type": "bug", "prompt": "This should sum nums but always prints 0. What's wrong?", "code": "for n in nums:\n    total = 0\n    total += n\nprint(total)", "options": [
          "total = 0 is inside the loop so it resets",
          "should use range",
          "nums is empty",
          "print is wrong"
        ], "answer": "total = 0 is inside the loop so it resets", "explain": "Initialise the accumulator once, before the loop." },
        { "type": "predict", "prompt": "What does this print?", "code": "names = ['a', 'b', 'c']\nfor i in range(len(names)):\n    print(i, names[i])", "options": [
          "0 a / 1 b / 2 c",
          "a b c",
          "1 a / 2 b / 3 c",
          "0 1 2"
        ], "answer": "0 a / 1 b / 2 c", "explain": "range(len(names)) gives indexes 0,1,2 paired with each item." },
        { "type": "rewrite", "prompt": "This should print 5,4,3,2,1 but counts up. Rewrite the range to count DOWN.", "code": "for i in range(1, 6):\n    print(i)", "starter": "range(1, 6)", "accept": [
          "range(5, 0, -1)"
        ], "answer": "for i in range(5, 0, -1):\n    print(i)", "expectedOutput": "5 4 3 2 1", "wrongOutput": "1 2 3 4 5  ← counting up", "explain": "Start 5, stop before 0, step -1." },
        { "type": "missing-word", "prompt": "Fill the missing function so this loops i over 0..n-1. Retype the line.", "code": "for i in ___(n):", "starter": "for i in ___(n):", "accept": [
          "for i in range(n):"
        ], "answer": "for i in range(n):", "expectedOutput": "(loops n times)", "wrongOutput": "NameError: name '___' is not defined", "explain": "range(n) produces 0 to n-1." }
      ], "cosmic": [
        { "type": "predict", "prompt": "What does this print?", "code": "total = 0\nfor i in range(1, 6):\n    if i % 2 == 0:\n        total += i\nprint(total)", "options": [
          "6",
          "9",
          "15",
          "2"
        ], "answer": "6", "explain": "Even numbers in 1..5 are 2 and 4 → 6." },
        { "type": "predict", "prompt": "What does this print?", "code": "nums = [4, 7, 2, 9, 5]\nbig = nums[0]\nfor n in nums:\n    if n > big:\n        big = n\nprint(big)", "options": [
          "9",
          "4",
          "5",
          "27"
        ], "answer": "9", "explain": "A max-finding loop: big ends as the largest value, 9." },
        { "type": "write", "prompt": "Write a function count_evens(nums) that returns how many numbers in the list are even.", "accept": [
          "def count_evens(nums):\nc = 0\nfor n in nums:\nif n % 2 == 0:\nc += 1\nreturn c",
          "def count_evens(nums):\ncount = 0\nfor n in nums:\nif n % 2 == 0:\ncount += 1\nreturn count"
        ], "answer": "def count_evens(nums):\n    c = 0\n    for n in nums:\n        if n % 2 == 0:\n            c += 1\n    return c", "explain": "Accumulate a count, guard with an even test, return it." },
        { "type": "bug", "prompt": "This should find the smallest value but returns the wrong answer for all-positive lists. What's the flaw?", "code": "small = 0\nfor n in nums:\n    if n < small:\n        small = n\nprint(small)", "options": [
          "small starts at 0, so positives never beat it — start at nums[0]",
          "use > not <",
          "missing range",
          "needs sort()"
        ], "answer": "small starts at 0, so positives never beat it — start at nums[0]", "explain": "Seed the accumulator with the first element, not 0." },
        { "type": "predict", "prompt": "What does this print?", "code": "s = 0\nfor i in range(3):\n    for j in range(3):\n        s += 1\nprint(s)", "options": [
          "6",
          "9",
          "3",
          "12"
        ], "answer": "9", "explain": "Nested loops: 3 × 3 = 9 increments." },
        { "type": "rewrite", "prompt": "Rewrite the loop body (2 lines) so it sums only numbers greater than 10 into total. Loop given: `for n in nums:`, total starts 0.", "code": "for n in nums:\n    total += n", "starter": "total += n", "accept": [
          "if n > 10:\ntotal += n"
        ], "answer": "if n > 10:\n    total += n", "expectedOutput": "(sums only the large numbers)", "wrongOutput": "(sums everything)", "explain": "Guard the accumulation with a threshold test." },
        { "type": "predict", "prompt": "What does this print?", "code": "nums = [1, 2, 3, 4]\nrun = 0\nbest = 0\nfor n in nums:\n    run += n\n    if run > best:\n        best = run\nprint(best)", "options": [
          "10",
          "4",
          "6",
          "1"
        ], "answer": "10", "explain": "Running total reaches 1,3,6,10; best tracks the max → 10." }
      ] },
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
    tiers: { "rookie": [
        { "type": "predict", "prompt": "What does this print?", "code": "def add(a, b):\n    return a + b\n\nprint(add(4, 5))", "options": [
          "9",
          "45",
          "a + b",
          "None"
        ], "answer": "9", "explain": "add(4,5) returns 9." },
        { "type": "mc", "prompt": "Which function correctly returns True when n is even?", "options": [
          "def is_even(n):\n    return n % 2 == 0",
          "def is_even(n):\n    print(n % 2 == 0)",
          "def is_even(n):\n    n % 2 == 0",
          "def is_even(n):\n    return n / 2"
        ], "answer": "def is_even(n):\n    return n % 2 == 0", "explain": "n % 2 == 0 is a boolean that's returned." },
        { "type": "write", "prompt": "Write a function called square(n) that returns n multiplied by itself.", "accept": [
          "def square(n):\nreturn n * n",
          "def square(n):\nreturn n*n",
          "def square(n):\nreturn n ** 2"
        ], "answer": "def square(n):\n    return n * n", "explain": "Return n * n (or n ** 2)." },
        { "type": "bug", "prompt": "Calling greet('Sam') prints nothing. Why?", "code": "def greet(name):\n    message = 'Hi ' + name\n\ngreet('Sam')", "options": [
          "name is undefined",
          "the function never returns or prints message",
          "can't add strings",
          "greet is reserved"
        ], "answer": "the function never returns or prints message", "explain": "It builds message but never returns or prints it." },
        { "type": "predict", "prompt": "What does this print?", "code": "def is_positive(n):\n    return n > 0\n\nprint(is_positive(-3))", "options": [
          "True",
          "False",
          "-3",
          "None"
        ], "answer": "False", "explain": "-3 > 0 is False, and that boolean is returned." },
        { "type": "missing-word", "prompt": "This should send back the total but gives None. Retype the last line with the keyword.", "code": "def total(a, b):\n    ___ a + b\n\nprint(total(2, 3))", "starter": "___ a + b", "accept": [
          "return a + b"
        ], "answer": "return a + b", "expectedOutput": "5", "wrongOutput": "None   ← the function returned nothing", "explain": "Without `return`, a function hands back None." },
        { "type": "rewrite", "prompt": "This function header uses the wrong keyword. Rewrite the header line.", "code": "function greet(name):\n    return 'Hi ' + name", "starter": "function greet(name):", "accept": [
          "def greet(name):"
        ], "answer": "def greet(name):", "expectedOutput": "(defines the function — no error)", "wrongOutput": "  File \"program.py\", line 1\n    function greet(name):\n             ^^^^^\nSyntaxError: invalid syntax", "explain": "Python defines functions with `def`." }
      ], "nebula": [
        { "type": "predict", "prompt": "What does this print?", "code": "def bigger(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(bigger(3, 8))", "options": [
          "3",
          "8",
          "True",
          "None"
        ], "answer": "8", "explain": "8 is not less than 3, so the function returns b = 8." },
        { "type": "write", "prompt": "Write a function is_teen(age) that returns True when age is between 13 and 19 inclusive.", "accept": [
          "def is_teen(age):\nreturn age >= 13 and age <= 19",
          "def is_teen(age):\nreturn 13 <= age <= 19"
        ], "answer": "def is_teen(age):\n    return 13 <= age <= 19", "explain": "Return the boolean of the combined comparison." },
        { "type": "predict", "prompt": "What does this print?", "code": "def label(n):\n    if n == 0:\n        return 'zero'\n    elif n > 0:\n        return 'pos'\n    else:\n        return 'neg'\n\nprint(label(-5))", "options": [
          "zero",
          "pos",
          "neg",
          "None"
        ], "answer": "neg", "explain": "-5 hits the else branch → 'neg'." },
        { "type": "bug", "prompt": "double(4) prints None instead of 8. What's wrong?", "code": "def double(n):\n    print(n * 2)\n\nx = double(4)\nprint(x)", "options": [
          "it prints but never returns, so x is None",
          "n*2 is wrong",
          "missing colon",
          "double is reserved"
        ], "answer": "it prints but never returns, so x is None", "explain": "Printing isn't returning; x gets None. Use return." },
        { "type": "rewrite", "prompt": "This should RETURN the sum so it can be stored, but it only prints. Rewrite the body line.", "code": "def add(a, b):\n    print(a + b)", "starter": "print(a + b)", "accept": [
          "return a + b"
        ], "answer": "return a + b", "expectedOutput": "(value can now be stored in a variable)", "wrongOutput": "(prints, but returns None — can't be reused)", "explain": "return hands the value back to the caller." },
        { "type": "predict", "prompt": "What does this print?", "code": "def f(x):\n    return x * x\n\nprint(f(f(2)))", "options": [
          "4",
          "8",
          "16",
          "2"
        ], "answer": "16", "explain": "f(2) = 4, then f(4) = 16." },
        { "type": "missing-punct", "prompt": "This function definition is missing punctuation. Retype the header line.", "code": "def area(w, h)\n    return w * h", "starter": "def area(w, h)", "accept": [
          "def area(w, h):"
        ], "answer": "def area(w, h):", "strictPunct": true, "expectedOutput": "(defines the function — no error)", "wrongOutput": "  File \"program.py\", line 1\n    def area(w, h)\n                  ^\nSyntaxError: expected ':'", "explain": "A def header ends with a colon." }
      ], "cosmic": [
        { "type": "predict", "prompt": "What does this print?", "code": "def count_vowels(s):\n    c = 0\n    for ch in s:\n        if ch in 'aeiou':\n            c += 1\n    return c\n\nprint(count_vowels('education'))", "options": [
          "4",
          "5",
          "3",
          "9"
        ], "answer": "5", "explain": "e, u, a, i, o → 5 vowels in 'education'." },
        { "type": "write", "prompt": "Write a function average(nums) that returns the mean of a non-empty list (use sum and len).", "accept": [
          "def average(nums):\nreturn sum(nums) / len(nums)",
          "def average(nums):\nreturn sum(nums)/len(nums)"
        ], "answer": "def average(nums):\n    return sum(nums) / len(nums)", "explain": "Total divided by count gives the mean." },
        { "type": "predict", "prompt": "What does this print?", "code": "def classify(mark):\n    if mark >= 40:\n        return 'pass'\n    return 'fail'\n\nresults = [classify(m) for m in [35, 50, 40]]\nprint(results)", "options": [
          "['fail', 'pass', 'pass']",
          "['pass', 'pass', 'pass']",
          "['fail', 'fail', 'pass']",
          "fail pass pass"
        ], "answer": "['fail', 'pass', 'pass']", "explain": "35→fail, 50→pass, 40→pass (>= is inclusive)." },
        { "type": "bug", "prompt": "This should return the first vowel in s, but always returns None. What's wrong?", "code": "def first_vowel(s):\n    for ch in s:\n        if ch in 'aeiou':\n            found = ch\n    return found", "options": [
          "it never returns early — and 'found' may be undefined if no vowel",
          "missing colon",
          "s is immutable",
          "for is wrong"
        ], "answer": "it never returns early — and 'found' may be undefined if no vowel", "explain": "Return ch the moment a vowel is found, instead of assigning and looping on." },
        { "type": "rewrite", "prompt": "Make this return the vowel immediately when found. Rewrite the inner body line.", "code": "def first_vowel(s):\n    for ch in s:\n        if ch in 'aeiou':\n            found = ch", "starter": "found = ch", "accept": [
          "return ch"
        ], "answer": "return ch", "expectedOutput": "(returns the first vowel straight away)", "wrongOutput": "(keeps looping; returns nothing useful)", "explain": "Returning inside the loop stops at the first match." },
        { "type": "predict", "prompt": "What does this print?", "code": "def power(base, n):\n    result = 1\n    for i in range(n):\n        result *= base\n    return result\n\nprint(power(2, 3))", "options": [
          "6",
          "8",
          "9",
          "2"
        ], "answer": "8", "explain": "Multiplies 1 by 2 three times → 8 (2 cubed)." },
        { "type": "write", "prompt": "Write a boolean function all_digits(s) that returns True only if every character in s is a digit.", "accept": [
          "def all_digits(s):\nfor ch in s:\nif not ch.isdigit():\nreturn False\nreturn True"
        ], "answer": "def all_digits(s):\n    for ch in s:\n        if not ch.isdigit():\n            return False\n    return True", "explain": "Return False on the first non-digit; True if the loop finishes." }
      ] },
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
    tiers: { "rookie": [
        { "type": "predict", "prompt": "What does this print when mark = 72?", "code": "mark = 72\nif mark >= 85:\n    print('A')\nelif mark >= 70:\n    print('B')\nelse:\n    print('C')", "options": [
          "A",
          "B",
          "C",
          "Nothing"
        ], "answer": "B", "explain": "72 fails >=85 but passes >=70 → 'B'." },
        { "type": "mc", "prompt": "Which keyword handles every case not already matched above it?", "options": [
          "else",
          "elif",
          "endif",
          "default"
        ], "answer": "else", "explain": "else runs when all if/elif tests were False." },
        { "type": "bug", "prompt": "Every score over 50 prints 'Pass' only, never 'Distinction'. Why?", "code": "if score > 50:\n    print('Pass')\nelif score > 80:\n    print('Distinction')", "options": [
          "elif should be if",
          "the > 80 test can never be reached because > 50 catches it first",
          "score is a string",
          "missing else"
        ], "answer": "the > 80 test can never be reached because > 50 catches it first", "explain": "Test the higher threshold first." },
        { "type": "write", "prompt": "Write an if/else that prints 'even' if n % 2 == 0, otherwise 'odd'. (3 lines)", "accept": [
          "if n % 2 == 0:\nprint('even')\nelse:\nprint('odd')",
          "if n % 2 == 0:\nprint(\"even\")\nelse:\nprint(\"odd\")"
        ], "answer": "if n % 2 == 0:\n    print('even')\nelse:\n    print('odd')", "explain": "Check the remainder, branch with else." },
        { "type": "missing-punct", "prompt": "This if-statement header is missing its punctuation. Retype the header line.", "code": "if mark >= 40\n    print('Pass')", "starter": "if mark >= 40", "accept": [
          "if mark >= 40:"
        ], "answer": "if mark >= 40:", "strictPunct": true, "expectedOutput": "Pass", "wrongOutput": "  File \"program.py\", line 1\n    if mark >= 40\n                ^\nSyntaxError: expected ':'", "explain": "Every if header ends with a colon." },
        { "type": "predict", "prompt": "What does this print when temp = 30?", "code": "temp = 30\nif temp > 30:\n    print('hot')\nelif temp == 30:\n    print('warm')\nelse:\n    print('cool')", "options": [
          "hot",
          "warm",
          "cool",
          "Nothing"
        ], "answer": "warm", "explain": "30 > 30 is False, 30 == 30 is True → 'warm'." },
        { "type": "write", "prompt": "Write an if/else that prints 'pass' for mark >= 40, else 'fail'. (4 lines)", "accept": [
          "if mark >= 40:\nprint('pass')\nelse:\nprint('fail')",
          "if mark >= 40:\nprint(\"pass\")\nelse:\nprint(\"fail\")"
        ], "answer": "if mark >= 40:\n    print('pass')\nelse:\n    print('fail')", "explain": "One threshold test with an else." }
      ], "nebula": [
        { "type": "predict", "prompt": "What does this print when n = 15?", "code": "n = 15\nif n % 3 == 0 and n % 5 == 0:\n    print('both')\nelif n % 3 == 0:\n    print('three')\nelif n % 5 == 0:\n    print('five')", "options": [
          "both",
          "three",
          "five",
          "Nothing"
        ], "answer": "both", "explain": "15 is divisible by both 3 and 5, and that test is first." },
        { "type": "predict", "prompt": "What does this print?", "code": "age = 20\nhas_id = False\nif age >= 18 and has_id:\n    print('in')\nelse:\n    print('no')", "options": [
          "in",
          "no",
          "True",
          "Nothing"
        ], "answer": "no", "explain": "Both conditions must be True; has_id is False → else." },
        { "type": "write", "prompt": "Write code that prints 'leap' if year is divisible by 4 but NOT by 100. (use and/not, 2 lines)", "accept": [
          "if year % 4 == 0 and year % 100 != 0:\nprint('leap')",
          "if year % 4 == 0 and year % 100 != 0:\nprint(\"leap\")"
        ], "answer": "if year % 4 == 0 and year % 100 != 0:\n    print('leap')", "explain": "Combine the two divisibility tests with and." },
        { "type": "bug", "prompt": "This grade checker labels 90 as 'B'. Why?", "code": "if mark >= 70:\n    grade = 'B'\nelif mark >= 85:\n    grade = 'A'", "options": [
          "order is wrong — check >= 85 before >= 70",
          "use == not >=",
          "mark is a string",
          "missing else"
        ], "answer": "order is wrong — check >= 85 before >= 70", "explain": "Higher thresholds must come first or the lower one wins." },
        { "type": "rewrite", "prompt": "This should only print when BOTH are true, but prints too often. Rewrite the condition using and.", "code": "if a > 0 or b > 0:\n    print('both positive')", "starter": "if a > 0 or b > 0:", "accept": [
          "if a > 0 and b > 0:"
        ], "answer": "if a > 0 and b > 0:", "expectedOutput": "(prints only when both are positive)", "wrongOutput": "(prints when EITHER is positive)", "explain": "and requires both sides to be True." },
        { "type": "predict", "prompt": "What does this print when x = 5?", "code": "x = 5\nif x > 0:\n    if x > 10:\n        print('big')\n    else:\n        print('small')\nelse:\n    print('neg')", "options": [
          "big",
          "small",
          "neg",
          "Nothing"
        ], "answer": "small", "explain": "x>0 true, then x>10 false → inner else 'small'." },
        { "type": "missing-word", "prompt": "Fill the missing keyword so the third branch catches everything else. Retype the line.", "code": "if g == 'A':\n    ...\nelif g == 'B':\n    ...\n___:\n    print('other')", "starter": "___:", "accept": [
          "else:"
        ], "answer": "else:", "expectedOutput": "(handles all remaining cases)", "wrongOutput": "SyntaxError: invalid syntax", "explain": "else with a colon catches the rest." }
      ], "cosmic": [
        { "type": "predict", "prompt": "What does this print?", "code": "score = 67\nif score >= 90:\n    g = 'A'\nelif score >= 80:\n    g = 'B'\nelif score >= 70:\n    g = 'C'\nelif score >= 60:\n    g = 'D'\nelse:\n    g = 'F'\nprint(g)", "options": [
          "C",
          "D",
          "F",
          "B"
        ], "answer": "D", "explain": "67 fails 70 but passes 60 → 'D'." },
        { "type": "write", "prompt": "Write a function grade(m) returning 'pass' if m>=40 else 'fail', but 'invalid' if m<0 or m>100. (check invalid first)", "accept": [
          "def grade(m):\nif m < 0 or m > 100:\nreturn 'invalid'\nif m >= 40:\nreturn 'pass'\nreturn 'fail'"
        ], "answer": "def grade(m):\n    if m < 0 or m > 100:\n        return 'invalid'\n    if m >= 40:\n        return 'pass'\n    return 'fail'", "explain": "Guard the invalid range first, then the pass/fail split." },
        { "type": "predict", "prompt": "What does this print?", "code": "a, b, c = 3, 3, 5\nif a == b == c:\n    print('all')\nelif a == b or b == c:\n    print('two')\nelse:\n    print('none')", "options": [
          "all",
          "two",
          "none",
          "Nothing"
        ], "answer": "two", "explain": "Not all equal, but a == b is True → 'two'." },
        { "type": "bug", "prompt": "This should print 'teen' for ages 13–19 but also prints it for 25. What's wrong?", "code": "if age > 13 or age < 19:\n    print('teen')", "options": [
          "or should be and (25 passes age>13)",
          "use >= and <=",
          "age is a string",
          "missing colon"
        ], "answer": "or should be and (25 passes age>13)", "explain": "With or, any large age satisfies age>13; needs and." },
        { "type": "rewrite", "prompt": "Fix the range test so 'teen' prints only for 13 to 19 inclusive. Rewrite the condition.", "code": "if age > 13 or age < 19:\n    print('teen')", "starter": "if age > 13 or age < 19:", "accept": [
          "if age >= 13 and age <= 19:",
          "if 13 <= age <= 19:"
        ], "answer": "if 13 <= age <= 19:", "expectedOutput": "(prints only for 13–19)", "wrongOutput": "(prints for almost any age)", "explain": "Use and with inclusive bounds, or a chained comparison." },
        { "type": "predict", "prompt": "What does this print?", "code": "n = 0\nif n:\n    print('truthy')\nelse:\n    print('falsy')", "options": [
          "truthy",
          "falsy",
          "0",
          "Error"
        ], "answer": "falsy", "explain": "0 is falsy in Python, so the else runs." },
        { "type": "predict", "prompt": "What does this print?", "code": "items = []\nif items:\n    print('has stuff')\nelif len(items) == 0:\n    print('empty')\nelse:\n    print('?')", "options": [
          "has stuff",
          "empty",
          "?",
          "Nothing"
        ], "answer": "empty", "explain": "An empty list is falsy, so the elif runs → 'empty'." }
      ] },
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
        worked:
          "Trace the loop, one pass at a time:\n  start: total = 0\n  n = 4  → total = 0 + 4  = 4\n  n = 6  → total = 4 + 6  = 10\n  n = 10 → total = 10 + 10 = 20\nLoop ends → print(total) shows 20.",
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
        worked:
          "The inner loop runs fully for EACH outer pass:\n  i = 0 → j = 0,1,2  (3 prints)\n  i = 1 → j = 0,1,2  (3 prints)\n  i = 2 → j = 0,1,2  (3 prints)\n  i = 3 → j = 0,1,2  (3 prints)\nTotal = 4 × 3 = 12.",
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
// Three ranks, earned by sectors cleared (a badge of progress, separate from
// the difficulty the player chooses to drill at).
function rankFor(done) {
  if (done >= 10) return "Cosmic Legend";
  if (done >= 5) return "Nebula Navigator";
  return "Rookie Astronaut";
}

/* --------------------------- DIFFICULTY ------------------------ */
// The three difficulty tiers the player can choose between. These are
// DECOUPLED from rank — you can play any tier at any rank.
const DIFFICULTIES = [
  { id: "rookie", label: "Rookie Astronaut", icon: "🧑‍🚀", blurb: "Easy — the basics" },
  { id: "nebula", label: "Nebula Navigator", icon: "🛰️", blurb: "Medium — trickier" },
  { id: "cosmic", label: "Cosmic Legend", icon: "🌌", blurb: "Hard — exam-tough" },
];

// Resolve the question pool for a topic at a chosen difficulty.
// If the topic has authored `tiers`, use the matching tier (falling back to
// rookie, then to any populated tier). If it has no tiers yet, use its plain
// `questions` list at every difficulty — so untiered sectors still work.
function questionsFor(topic, difficulty) {
  if (topic.tiers) {
    return (
      topic.tiers[difficulty] ||
      topic.tiers.rookie ||
      topic.tiers.nebula ||
      topic.tiers.cosmic ||
      topic.questions ||
      []
    );
  }
  return topic.questions || [];
}

// Does a topic actually have distinct tiers authored? (for UI hints)
function topicIsTiered(topic) {
  return !!topic.tiers;
}


/* ----------------------- USER / ACCOUNTS ----------------------- */
/*
  Progress now PERSISTS in localStorage (Option A) so streaks, stats, badges
  and completed sectors survive refreshes and return visits. Only progress
  data is stored — questions and the cosmic theme are untouched.

  Everything lives under one versioned key as a single object, so the whole
  save/load path is centralised and easy to migrate later. If you ever move to
  a real backend, swap loadProgress()/saveProgress() for fetch calls — nothing
  else in the app touches storage directly.
*/

const STORAGE_KEY = "psl_progress_v1";

// Safe storage wrapper: localStorage when available, else an in-memory Map so
// the game never crashes (Safari private mode, file:// edge cases, etc.).
const storage = (() => {
  let ok = false;
  try {
    const t = "__psl_test__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    ok = true;
  } catch (e) {
    ok = false;
  }
  const mem = new Map();
  return {
    persistent: ok,
    get(key) {
      try {
        return ok ? window.localStorage.getItem(key) : mem.get(key) ?? null;
      } catch (e) {
        return mem.get(key) ?? null;
      }
    },
    set(key, value) {
      try {
        if (ok) window.localStorage.setItem(key, value);
        else mem.set(key, value);
      } catch (e) {
        mem.set(key, value);
      }
    },
  };
})();

// The shape of a fresh save. Keep all progress fields here so there's one
// source of truth. `stats` is keyed by topic id → { seen, correct }.
function freshProgress() {
  return {
    version: 1,
    name: null,
    score: 0,
    completed: [], // topic ids cleared at least once
    stats: {}, // topicId -> { seen, correct }
    mistakes: [], // unique question keys answered wrong (for review mode)
    badges: [], // earned badge ids
    streak: { count: 0, lastPlayed: null }, // YYYY-MM-DD of last active day
    writeInsCorrect: 0, // running count, drives a badge
    difficulty: "rookie", // chosen question tier (rookie | nebula | cosmic)
  };
}

// Load + defensively merge onto a fresh object so older/partial saves still work.
function loadProgress() {
  const raw = storage.get(STORAGE_KEY);
  if (!raw) return freshProgress();
  try {
    const parsed = JSON.parse(raw);
    return { ...freshProgress(), ...parsed };
  } catch (e) {
    return freshProgress();
  }
}

function saveProgress(progress) {
  storage.set(STORAGE_KEY, JSON.stringify(progress));
}

// ----- Date + streak helpers -----

// Local date as YYYY-MM-DD (not UTC, so "today" matches the player's day).
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(aStr, bStr) {
  const a = new Date(aStr + "T00:00:00");
  const b = new Date(bStr + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// Update the streak for activity today. Same day → unchanged; consecutive day
// → +1; a gap → reset to 1. Returns the new streak object.
function bumpStreak(streak) {
  const today = todayStr();
  if (!streak.lastPlayed) return { count: 1, lastPlayed: today };
  if (streak.lastPlayed === today) return streak; // already counted today
  const gap = daysBetween(streak.lastPlayed, today);
  if (gap === 1) return { count: streak.count + 1, lastPlayed: today };
  return { count: 1, lastPlayed: today }; // missed a day → restart
}

// ----- Stats helpers -----

// A stable key for a question so we can log mistakes and de-dupe them.
function questionKey(topicId, q) {
  return topicId + "::" + q.prompt;
}

// ----- Achievements -----
// Each badge has an id, label, icon, and a test(progress) predicate. Keeping
// them data-driven means adding a badge later is a one-line change.
const BADGES = [
  {
    id: "first_sector",
    label: "First Launch",
    icon: "🚀",
    desc: "Clear your first sector",
    test: (p) => p.completed.length >= 1,
  },
  {
    id: "five_sectors",
    label: "Sector Sweep",
    icon: "🛰️",
    desc: "Clear 5 sectors",
    test: (p) => p.completed.length >= 5,
  },
  {
    id: "all_sectors",
    label: "Galaxy Cleared",
    icon: "🌌",
    desc: "Clear all 13 sectors",
    test: (p) => p.completed.length >= TOPICS.length,
  },
  {
    id: "writein_10",
    label: "Code Slinger",
    icon: "⌨️",
    desc: "Answer 10 write-in questions correctly",
    test: (p) => p.writeInsCorrect >= 10,
  },
  {
    id: "streak_3",
    label: "On a Roll",
    icon: "🔥",
    desc: "Practise 3 days in a row",
    test: (p) => p.streak.count >= 3,
  },
  {
    id: "century",
    label: "Centurion",
    icon: "💯",
    desc: "Answer 100 questions in total",
    test: (p) =>
      Object.values(p.stats).reduce((n, s) => n + (s.seen || 0), 0) >= 100,
  },
];

// Return the ids of any newly-earned badges (earned now, not already held).
function newlyEarnedBadges(progress) {
  return BADGES.filter(
    (b) => !progress.badges.includes(b.id) && b.test(progress)
  ).map((b) => b.id);
}

// Which question types are "write-in" (typed answer + RUN). Used for a badge
// and for branching UI.
function isWriteInType(type) {
  return type === "rewrite" || type === "missing-word" || type === "missing-punct";
}

// Flatten questions across all topics at a given difficulty, tagging each with
// its topic id (mock exam uses this). Untiered topics contribute their plain
// questions at every difficulty via questionsFor().
function allQuestionsFlat(difficulty = "rookie") {
  const out = [];
  for (const t of TOPICS) {
    for (const q of questionsFor(t, difficulty)) out.push({ topicId: t.id, q });
  }
  return out;
}

// Every question that could ever be asked, across ALL tiers and untiered
// topics. Used to resolve logged mistakes back to question objects no matter
// which difficulty they came from.
function everyQuestion() {
  const out = [];
  for (const t of TOPICS) {
    const pools = t.tiers
      ? [t.tiers.rookie, t.tiers.nebula, t.tiers.cosmic]
      : [t.questions];
    for (const pool of pools) {
      if (!pool) continue;
      for (const q of pool) out.push({ topicId: t.id, q });
    }
  }
  return out;
}

// Resolve the stored mistake keys back into actual question objects.
function collectMistakeQuestions(mistakeKeys) {
  const want = new Set(mistakeKeys);
  return everyQuestion().filter(({ topicId, q }) =>
    want.has(questionKey(topicId, q))
  );
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
// The model `answer` is always included as an accepted form, so a learner who
// types exactly the displayed answer (indentation and all) is never marked wrong.
function checkWriteIn(input, q) {
  const accepted = [...(q.accept || []), q.answer].filter(Boolean);
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

function TopicIntro({ topic, onStart, onBack, difficulty }) {
  const pool = questionsFor(topic, difficulty);
  const diff = DIFFICULTIES.find((d) => d.id === difficulty);
  const tieredHere = topicIsTiered(topic);
  return (
    <div className="psl-panel">
      <div className="psl-node-sector">{topic.sector}</div>
      <h2 className="psl-h2">{topic.name}</h2>
      <p className="psl-blurb">{topic.blurb}</p>
      <div className="psl-intro-diff">
        Difficulty: <strong>{diff ? diff.icon + " " + diff.label : "Rookie"}</strong>
        {!tieredHere && (
          <span className="psl-intro-note"> · this sector isn't tiered yet, so you'll play its standard set</span>
        )}
      </div>
      <div className="psl-row">
        <button className="psl-btn" onClick={onStart}>
          Begin mission ({pool.length} questions)
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
    const ok = isWrite ? checkWritten(typed, [...(q.accept || []), q.answer].filter(Boolean)) : selected === q.answer;
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

          {/* Optional worked example for trickier topics */}
          {q.worked && (
            <div className="psl-worked">
              <div className="psl-worked-label">🔎 Worked example</div>
              <pre className="psl-worked-body">{q.worked}</pre>
            </div>
          )}

          <button className="psl-btn" onClick={() => onResult(correct, correct ? 10 : 0)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function Quiz({ topic, onFinish, onBack, onAnswer, difficulty }) {
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [points, setPoints] = useState(0);

  // Shuffle the questions once when this topic's quiz starts. Uses the chosen
  // difficulty tier (falls back to the topic's plain questions if untiered).
  const questions = useMemo(
    () => shuffle(questionsFor(topic, difficulty)),
    [topic.id, difficulty]
  );

  function handleResult(correct, earned) {
    if (onAnswer) onAnswer(questions[idx], correct); // record stats/mistakes
    const newHits = hits + (correct ? 1 : 0);
    const newPoints = points + (earned || 0);
    if (idx + 1 >= questions.length) {
      onFinish(newHits, questions.length, newPoints);
    } else {
      setHits(newHits);
      setPoints(newPoints);
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
      <QuestionCard
        key={idx}
        q={questions[idx]}
        onResult={handleResult}
      />
    </div>
  );
}

// Fire a Google Analytics event if gtag is available. Guarded so the app runs
// fine offline (file://) or anywhere gtag isn't loaded — it just no-ops then.
function trackEvent(name, params) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params || {});
  }
}

// Welcome / onboarding modal shown on launch.
// Collects a display name only, then calls onStart(name) to enter the game.
function WelcomeModal({ onStart }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const clean = name.trim();
    if (clean === "") {
      setError("Please enter a display name.");
      return;
    }
    onStart(clean);
  }

  return (
    <div className="psl-modal-overlay" role="dialog" aria-modal="true"
         aria-labelledby="psl-welcome-title">
      <div className="psl-modal">
        <div className="psl-modal-glow" aria-hidden="true" />

        <h2 id="psl-welcome-title" className="psl-modal-title">
          Welcome to Python Speed Learner!
        </h2>

        <p className="psl-modal-lead">Learn Python without the boredom! 🚀</p>
        <p className="psl-modal-intro">
          This fast-paced game turns coding into a fun challenge for Leaving
          Certificate students. Solve Python puzzles, race the clock, sharpen
          your skills, and level up your confidence while preparing for exams —
          all through play.
        </p>

        <div className="psl-form">
          <label className="psl-field">
            <span className="psl-label">What should we call you?</span>
            <input
              className={`psl-text-input ${error ? "bad" : ""}`}
              type="text"
              value={name}
              placeholder="e.g. Mia"
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <span className="psl-field-error">{error}</span>}
          </label>

          <div className="psl-modal-actions">
            <button className="psl-btn psl-btn-lg" onClick={submit}>
              Start playing 🚀
            </button>
          </div>

          <p className="psl-credit">
            Free game created by Milo Scott. Helping others learn
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------- NEW FEATURE COMPONENTS ------------------ */

// Difficulty toggle shown on the sector map. Choosing a tier changes which
// questions sectors and the mock exam serve. Decoupled from rank.
function DifficultyPicker({ value, onChange }) {
  return (
    <div className="psl-diff-picker">
      <div className="psl-diff-title">Choose your difficulty</div>
      <div className="psl-diff-row">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            className={`psl-diff-btn ${value === d.id ? "active" : ""}`}
            onClick={() => onChange(d.id)}
          >
            <span className="psl-diff-icon">{d.icon}</span>
            <span className="psl-diff-label">{d.label}</span>
            <span className="psl-diff-blurb">{d.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Top navigation between the game's modes. Review shows a count badge.
function NavBar({ screen, onNavigate, reviewCount }) {
  const tabs = [
    { id: "map", label: "🪐 Sectors" },
    { id: "mock", label: "📝 Mock Exam" },
    { id: "review", label: `🔁 Review${reviewCount ? ` (${reviewCount})` : ""}` },
    { id: "stats", label: "📊 Stats" },
    { id: "badges", label: "🏆 Badges" },
  ];
  // Highlight the closest matching tab (e.g. intro/quiz/result map to Sectors).
  const activeTab =
    screen === "intro" || screen === "quiz" || screen === "result"
      ? "map"
      : screen === "mockResult"
      ? "mock"
      : screen;
  return (
    <nav className="psl-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`psl-nav-btn ${activeTab === t.id ? "active" : ""}`}
          onClick={() => onNavigate(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// Floating toasts when a badge is unlocked. Auto-dismiss after a few seconds.
function BadgeToasts({ toasts, onDismiss }) {
  React.useEffect(() => {
    const timers = toasts.map((b) => setTimeout(() => onDismiss(b.id), 4500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;
  return (
    <div className="psl-toast-wrap">
      {toasts.map((b) => (
        <div key={b.id} className="psl-toast" onClick={() => onDismiss(b.id)}>
          <span className="psl-toast-icon">{b.icon}</span>
          <div>
            <div className="psl-toast-title">Badge unlocked!</div>
            <div className="psl-toast-label">
              {b.label} — {b.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Review Mode: drill ONLY questions you've previously gotten wrong. As you get
// them right they drop out of the list (handled by recordAnswer in App).
function ReviewMode({ questions, onAnswer, onBack }) {
  const [idx, setIdx] = useState(0);

  // Snapshot the queue once on mount so it doesn't reshuffle as items resolve.
  const queue = useMemo(() => shuffle(questions), []);

  if (queue.length === 0) {
    return (
      <div className="psl-panel center">
        <h2 className="psl-h2">Nothing to review 🎉</h2>
        <p className="psl-explain">
          You have no missed questions right now. Clear some sectors or sit a
          mock exam — anything you get wrong will show up here to drill.
        </p>
        <div className="psl-row center">
          <button className="psl-btn" onClick={onBack}>
            Back to map
          </button>
        </div>
      </div>
    );
  }

  function handleResult(correct) {
    const { topicId, q } = queue[idx];
    onAnswer(topicId, q, correct);
    if (idx + 1 >= queue.length) {
      setIdx(queue.length); // sentinel → done screen
    } else {
      setIdx(idx + 1);
    }
  }

  if (idx >= queue.length) {
    return (
      <div className="psl-panel center">
        <h2 className="psl-h2">Review complete ✅</h2>
        <p className="psl-explain">
          Nice work. Questions you answered correctly have been cleared from your
          review list.
        </p>
        <div className="psl-row center">
          <button className="psl-btn" onClick={onBack}>
            Back to map
          </button>
        </div>
      </div>
    );
  }

  const { topicId, q } = queue[idx];
  const topic = TOPICS.find((t) => t.id === topicId);
  return (
    <div className="psl-panel">
      <div className="psl-row between">
        <div className="psl-node-sector">Review · {topic ? topic.name : ""}</div>
        <button className="psl-btn ghost small" onClick={onBack}>
          Exit review
        </button>
      </div>
      <div className="psl-counter">
        Mistake {idx + 1} of {queue.length}
      </div>
      <QuestionCard key={idx} q={q} onResult={handleResult} />
    </div>
  );
}

// Dedicated mock-exam pool — original questions modelled on the most common
// Leaving Cert Section C topic patterns (loops, selection, lists, functions,
// string methods, formatted output, max-finding, frequency counting, charts).
const MOCK_QUESTIONS = [
  { "topicId": "lists", "q": { "type": "predict", "prompt": "What does this print?", "code": "scores = [12, 7, 19, 4, 19]\nbest = scores[0]\nfor s in scores:\n    if s > best:\n        best = s\nprint(best)", "options": [
    "12",
    "19",
    "4",
    "61"
  ], "answer": "19", "explain": "A max-finding loop: best ends as the largest value, 19." } },
  { "topicId": "lists", "q": { "type": "write", "prompt": "Write a function highest(nums) that returns the largest value in a non-empty list WITHOUT using max().", "accept": [
    "def highest(nums):\nbig = nums[0]\nfor n in nums:\nif n > big:\nbig = n\nreturn big"
  ], "answer": "def highest(nums):\n    big = nums[0]\n    for n in nums:\n        if n > big:\n            big = n\n    return big", "explain": "Seed with the first item, then keep the larger value as you loop." } },
  { "topicId": "averages", "q": { "type": "predict", "prompt": "What does this print?", "code": "marks = [40, 60, 80]\ntotal = 0\nfor m in marks:\n    total += m\nprint(total / len(marks))", "options": [
    "60.0",
    "180",
    "3",
    "60"
  ], "answer": "60.0", "explain": "Total 180 divided by 3 items = 60.0." } },
  { "topicId": "averages", "q": { "type": "write", "prompt": "Write code that prints the average of a non-empty list called marks. (1 line, use sum and len)", "accept": [
    "print(sum(marks) / len(marks))",
    "print(sum(marks)/len(marks))"
  ], "answer": "print(sum(marks) / len(marks))", "explain": "Sum gives the total, len the count; divide for the mean." } },
  { "topicId": "accumulator", "q": { "type": "predict", "prompt": "What does this print?", "code": "marks = [55, 30, 72, 40, 90]\ncount = 0\nfor m in marks:\n    if m >= 40:\n        count += 1\nprint(count)", "options": [
    "3",
    "4",
    "5",
    "2"
  ], "answer": "4", "explain": "55, 72, 40, 90 are all >= 40 → 4 (30 is the only one below)." } },
  { "topicId": "accumulator", "q": { "type": "write", "prompt": "Write a 4-line block that counts how many numbers in nums are over 100, into a variable big (start big = 0).", "accept": [
    "big = 0\nfor n in nums:\nif n > 100:\nbig += 1",
    "big = 0\nfor n in nums:\nif n > 100:\nbig = big + 1"
  ], "answer": "big = 0\nfor n in nums:\n    if n > 100:\n        big += 1", "explain": "Initialise the counter, loop, test, increment when it passes." } },
  { "topicId": "conditionals", "q": { "type": "predict", "prompt": "What does this print when mark = 55?", "code": "mark = 55\nif mark >= 70:\n    print('Honours')\nelif mark >= 40:\n    print('Pass')\nelse:\n    print('Fail')", "options": [
    "Honours",
    "Pass",
    "Fail",
    "Nothing"
  ], "answer": "Pass", "explain": "55 fails >=70 but passes >=40 → 'Pass'." } },
  { "topicId": "conditionals", "q": { "type": "bug", "prompt": "Every mark over 40 prints 'Pass', never 'Honours'. Why?", "code": "if mark >= 40:\n    print('Pass')\nelif mark >= 70:\n    print('Honours')", "options": [
    "the >= 70 test can't be reached — check it first",
    "elif should be if",
    "mark is a string",
    "missing else"
  ], "answer": "the >= 70 test can't be reached — check it first", "explain": "Higher thresholds must be tested before lower ones." } },
  { "topicId": "conditionals", "q": { "type": "write", "prompt": "Write an if/else that prints 'even' when n % 2 == 0, otherwise 'odd'. (3 lines)", "accept": [
    "if n % 2 == 0:\nprint('even')\nelse:\nprint('odd')",
    "if n % 2 == 0:\nprint(\"even\")\nelse:\nprint(\"odd\")"
  ], "answer": "if n % 2 == 0:\n    print('even')\nelse:\n    print('odd')", "explain": "Test the remainder, branch with else." } },
  { "topicId": "forloops", "q": { "type": "predict", "prompt": "What does this print?", "code": "total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)", "options": [
    "15",
    "10",
    "21",
    "6"
  ], "answer": "15", "explain": "range(1,6) is 1..5 → 1+2+3+4+5 = 15." } },
  { "topicId": "forloops", "q": { "type": "missing-punct", "prompt": "This loop header is missing its punctuation. Retype it correctly.", "code": "for roll in rolls", "starter": "for roll in rolls", "accept": [
    "for roll in rolls:"
  ], "answer": "for roll in rolls:", "strictPunct": true, "expectedOutput": "(loops over each roll — no error)", "wrongOutput": "  File \"program.py\", line 1\n    for roll in rolls\n                     ^\nSyntaxError: expected ':'", "explain": "A for-loop header always ends with a colon." } },
  { "topicId": "accumulator", "q": { "type": "predict", "prompt": "What does this print?", "code": "rolls = [6, 2, 6, 6, 1]\nsixes = 0\nfor r in rolls:\n    if r == 6:\n        sixes += 1\nprint(sixes)", "options": [
    "2",
    "3",
    "6",
    "5"
  ], "answer": "3", "explain": "Counting how often 6 appears: three times." } },
  { "topicId": "nested", "q": { "type": "predict", "prompt": "What does this print?", "code": "for n in [3, 1, 2]:\n    print('*' * n)", "options": [
    "***\n*\n**",
    "*\n*\n*",
    "3\n1\n2",
    "******"
  ], "answer": "***\n*\n**", "explain": "'*' * n repeats the star n times: 3, 1, then 2 stars." } },
  { "topicId": "nested", "q": { "type": "write", "prompt": "Write a 2-line loop that prints a bar of n stars for each number in a list called counts. (use '*' * n)", "accept": [
    "for n in counts:\nprint('*' * n)",
    "for n in counts:\nprint(\"*\" * n)"
  ], "answer": "for n in counts:\n    print('*' * n)", "explain": "Multiply the star string by each count to draw a simple bar." } },
  { "topicId": "strings", "q": { "type": "predict", "prompt": "What does this print?", "code": "name = '  Mia  '\nprint(name.strip().upper())", "options": [
    "MIA",
    "  MIA  ",
    "mia",
    "Mia"
  ], "answer": "MIA", "explain": ".strip() removes the spaces, .upper() capitalises → 'MIA'." } },
  { "topicId": "strings", "q": { "type": "predict", "prompt": "What does this print?", "code": "word = 'banana'\nprint(sorted(word))", "options": [
    "['a', 'a', 'a', 'b', 'n', 'n']",
    "'aaabnn'",
    "['b','a','n','a','n','a']",
    "banana"
  ], "answer": "['a', 'a', 'a', 'b', 'n', 'n']", "explain": "sorted() returns a list of the characters in alphabetical order." } },
  { "topicId": "strings", "q": { "type": "missing-word", "prompt": "Fill the missing method so the comparison ignores case. Retype the line.", "code": "if answer.___() == 'yes':", "starter": "if answer.___() == 'yes':", "accept": [
    "if answer.lower() == 'yes':",
    "if answer.lower() == \"yes\":"
  ], "answer": "if answer.lower() == 'yes':", "expectedOutput": "(matches 'Yes', 'YES', 'yes'...)", "wrongOutput": "(only matches the exact case typed)", "explain": ".lower() makes the comparison case-insensitive." } },
  { "topicId": "functions", "q": { "type": "predict", "prompt": "What does this print?", "code": "def is_pass(mark):\n    return mark >= 40\n\nprint(is_pass(38))", "options": [
    "True",
    "False",
    "38",
    "None"
  ], "answer": "False", "explain": "38 >= 40 is False, and that boolean is returned." } },
  { "topicId": "functions", "q": { "type": "write", "prompt": "Write a boolean function is_even(n) that returns True when n is even.", "accept": [
    "def is_even(n):\nreturn n % 2 == 0"
  ], "answer": "def is_even(n):\n    return n % 2 == 0", "explain": "Return the boolean n % 2 == 0." } },
  { "topicId": "output", "q": { "type": "predict", "prompt": "What does this print when name = 'Sam' and total = 7?", "code": "name = 'Sam'\ntotal = 7\nprint(f'{name}: {total}')", "options": [
    "Sam: 7",
    "{name}: {total}",
    "name: total",
    "Sam 7"
  ], "answer": "Sam: 7", "explain": "The f-string substitutes both variables → 'Sam: 7'." } },
  { "topicId": "output", "q": { "type": "write", "prompt": "Using an f-string, print the label and value as  Average: <avg>  (avg is a variable). 1 line.", "accept": [
    "print(f'Average: {avg}')",
    "print(f\"Average: {avg}\")"
  ], "answer": "print(f'Average: {avg}')", "explain": "Plain text label plus {avg} inserts the value." } },
  { "topicId": "readmodify", "q": { "type": "mc", "prompt": "This loop prints every mark. Which single change makes it print ONLY marks that are a fail (< 40)?", "code": "for m in marks:\n    print(m)", "options": [
    "add `if m < 40:` before print(m) and indent it",
    "change to range(40)",
    "change print to input",
    "change marks to 40"
  ], "answer": "add `if m < 40:` before print(m) and indent it", "explain": "Guard the print with a condition — extend the program without rewriting it." } },
  { "topicId": "readmodify", "q": { "type": "predict", "prompt": "What does this starter code print?", "code": "nums = [5, 10, 15]\nnums[1] = nums[1] + 100\nprint(nums)", "options": [
    "[5, 110, 15]",
    "[105, 110, 115]",
    "[5, 10, 15]",
    "[5, 10, 115]"
  ], "answer": "[5, 110, 15]", "explain": "Only index 1 changes: 10 + 100 = 110." } }
];

// Mock Exam: a long, mixed set drawn from the dedicated MOCK_QUESTIONS pool —
// original questions modelled on the most common Section C topic patterns.
function MockExam({ onStart, onAnswer, onFinish, onBack, difficulty }) {
  const QUESTION_COUNT = 15;

  // Build the paper once: shuffle the mock pool and take a spread of 15.
  // (The mock pool is its own exam-style set, separate from the sector drills.)
  const paper = useMemo(() => {
    const all = shuffle(MOCK_QUESTIONS);
    return all.slice(0, Math.min(QUESTION_COUNT, all.length));
  }, []);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [points, setPoints] = useState(0);

  function begin() {
    if (onStart) onStart();
    setStarted(true);
  }

  function handleResult(correct, earned) {
    const { topicId, q } = paper[idx];
    onAnswer(topicId, q, correct);
    const newHits = hits + (correct ? 1 : 0);
    const newPoints = points + (earned || 0);
    if (idx + 1 >= paper.length) {
      onFinish(newHits, paper.length, newPoints);
    } else {
      setHits(newHits);
      setPoints(newPoints);
      setIdx(idx + 1);
    }
  }

  if (!started) {
    return (
      <div className="psl-panel center">
        <h2 className="psl-h2">📝 Mock Exam</h2>
        <p className="psl-explain">
          {paper.length} mixed questions modelled on the topics that come up
          most in Section C — loops, selection, lists, functions, string
          methods, formatted output and finding the largest value. A good test
          of whether you can handle every topic type in one sitting.
        </p>
        <div className="psl-row center">
          <button className="psl-btn psl-btn-lg" onClick={begin}>
            Start the paper 🚀
          </button>
          <button className="psl-btn ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const { q } = paper[idx];
  return (
    <div className="psl-panel">
      <div className="psl-row between">
        <div className="psl-node-sector">Mock Exam · mixed topics</div>
        <button className="psl-btn ghost small" onClick={onBack}>
          Abort exam
        </button>
      </div>
      <div className="psl-counter">
        Question {idx + 1} of {paper.length}
      </div>
      <QuestionCard key={idx} q={q} onResult={handleResult} />
    </div>
  );
}

// Mock exam summary with a simple grade band.
function MockResult({ result, onBack }) {
  const pct = Math.round((result.hits / result.total) * 100);
  const band =
    pct >= 90 ? "H1 territory 🌟" :
    pct >= 80 ? "H2 — strong 💪" :
    pct >= 70 ? "H3 — solid 👍" :
    pct >= 55 ? "H4 — getting there" :
    pct >= 40 ? "H5 — keep drilling" :
    "Needs work — review your mistakes";
  return (
    <div className="psl-panel center">
      <h2 className="psl-h2">Mock exam complete</h2>
      <p className="psl-bigscore">{pct}%</p>
      <p className="psl-explain">
        {result.hits} / {result.total} correct · +{result.points || 0} points
        <br />
        <strong>{band}</strong>
      </p>
      <div className="psl-row center">
        <button className="psl-btn" onClick={onBack}>
          Back to map
        </button>
      </div>
    </div>
  );
}

// Stats dashboard: per-topic accuracy, totals, and weakest sector to study next.
function StatsDashboard({ progress, onBack }) {
  const rows = TOPICS.map((t) => {
    const s = progress.stats[t.id] || { seen: 0, correct: 0 };
    const acc = s.seen ? Math.round((s.correct / s.seen) * 100) : null;
    return { id: t.id, name: t.name, seen: s.seen, correct: s.correct, acc };
  });

  const totalSeen = rows.reduce((n, r) => n + r.seen, 0);
  const totalCorrect = rows.reduce((n, r) => n + r.correct, 0);
  const overall = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : null;

  // Weakest = lowest accuracy among topics actually attempted (min 2 seen).
  const attempted = rows.filter((r) => r.seen >= 2 && r.acc !== null);
  const weakest = attempted.length
    ? attempted.reduce((lo, r) => (r.acc < lo.acc ? r : lo))
    : null;

  return (
    <div className="psl-panel">
      <div className="psl-row between">
        <h2 className="psl-h2">📊 Your stats</h2>
        <button className="psl-btn ghost small" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="psl-stat-cards">
        <div className="psl-stat-card">
          <div className="psl-stat-num">{totalSeen}</div>
          <div className="psl-stat-cap">questions answered</div>
        </div>
        <div className="psl-stat-card">
          <div className="psl-stat-num">{overall === null ? "—" : overall + "%"}</div>
          <div className="psl-stat-cap">overall accuracy</div>
        </div>
        <div className="psl-stat-card">
          <div className="psl-stat-num">{progress.streak.count}</div>
          <div className="psl-stat-cap">day streak</div>
        </div>
      </div>

      {weakest && (
        <div className="psl-weakest">
          🎯 Study next: <strong>{weakest.name}</strong> — your lowest accuracy
          so far at {weakest.acc}%.
        </div>
      )}

      <div className="psl-stat-table">
        {rows.map((r) => (
          <div key={r.id} className="psl-stat-line">
            <span className="psl-stat-topic">{r.name}</span>
            <div className="psl-stat-bar-track">
              <div
                className="psl-stat-bar-fill"
                style={{ width: `${r.acc || 0}%` }}
              />
            </div>
            <span className="psl-stat-acc">
              {r.seen === 0 ? "—" : `${r.acc}% (${r.correct}/${r.seen})`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Badges screen: shows all badges, locked and unlocked.
function BadgesScreen({ earned, onBack }) {
  const earnedSet = new Set(earned);
  return (
    <div className="psl-panel">
      <div className="psl-row between">
        <h2 className="psl-h2">🏆 Achievements</h2>
        <button className="psl-btn ghost small" onClick={onBack}>
          Back
        </button>
      </div>
      <p className="psl-explain">
        {earnedSet.size} of {BADGES.length} unlocked.
      </p>
      <div className="psl-badge-grid">
        {BADGES.map((b) => {
          const have = earnedSet.has(b.id);
          return (
            <div key={b.id} className={`psl-badge ${have ? "earned" : "locked"}`}>
              <div className="psl-badge-icon">{have ? b.icon : "🔒"}</div>
              <div className="psl-badge-label">{b.label}</div>
              <div className="psl-badge-desc">{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- APP ----------------------------- */
export default function App() {
  // All progress lives in one persisted object. We mirror it into React state
  // so the UI re-renders, and write through saveProgress() on every change.
  const [progress, setProgress] = useState(() => loadProgress());
  const [screen, setScreen] = useState("map");
  // screen: map | intro | quiz | result | review | mock | mockResult | stats | badges
  const [activeId, setActiveId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [toasts, setToasts] = useState([]); // badge-unlock notifications

  const isSignedIn = !!progress.name;
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);
  const active = TOPICS.find((t) => t.id === activeId) || null;

  // Central updater: apply a change, persist it, surface any new badges.
  function commit(updater) {
    setProgress((prev) => {
      const next = updater({ ...prev });
      const earned = newlyEarnedBadges(next);
      if (earned.length) {
        next.badges = [...next.badges, ...earned];
        const defs = earned.map((id) => BADGES.find((b) => b.id === id));
        setToasts((t) => [...t, ...defs]);
      }
      saveProgress(next);
      return next;
    });
  }

  // Record one answered question into per-topic stats + mistake log.
  function recordAnswer(topicId, q, correct) {
    commit((p) => {
      const s = p.stats[topicId] || { seen: 0, correct: 0 };
      p.stats[topicId] = {
        seen: s.seen + 1,
        correct: s.correct + (correct ? 1 : 0),
      };
      const key = questionKey(topicId, q);
      if (correct) {
        // Clearing a previously-missed question removes it from review.
        p.mistakes = p.mistakes.filter((m) => m !== key);
        if (isWriteInType(q.type)) p.writeInsCorrect += 1;
      } else if (!p.mistakes.includes(key)) {
        p.mistakes.push(key);
      }
      return p;
    });
  }

  // Mark today active and advance the streak (called when any session starts).
  function markActiveToday() {
    commit((p) => {
      p.streak = bumpStreak(p.streak);
      return p;
    });
  }

  function pickTopic(id) {
    setActiveId(id);
    setScreen("intro");
  }

  // Finishing a sector: add score, mark complete, advance streak.
  function finishTopic(hits, total, points) {
    commit((p) => {
      p.score += points != null ? points : hits * 10;
      if (!p.completed.includes(activeId)) p.completed = [...p.completed, activeId];
      return p;
    });
    setLastResult({ hits, total, points });
    setScreen("result");
  }

  // Finishing the mock exam: add score + advance streak, show summary.
  function finishMock(hits, total, points) {
    commit((p) => {
      p.score += points != null ? points : hits * 10;
      return p;
    });
    setLastResult({ hits, total, points });
    setScreen("mockResult");
  }

  function dismissToast(id) {
    setToasts((t) => t.filter((b) => b.id !== id));
  }

  // Build the list of previously-missed questions for review mode.
  const reviewQuestions = useMemo(
    () => collectMistakeQuestions(progress.mistakes),
    [progress.mistakes]
  );

  // Onboarding gate.
  if (!isSignedIn) {
    return (
      <div className="psl-wrap">
        <style>{styles}</style>
        <StarField />
        <WelcomeModal
          onStart={(name) => {
            commit((p) => {
              p.name = name;
              p.streak = bumpStreak(p.streak);
              return p;
            });
            trackEvent("start_playing");
          }}
        />
      </div>
    );
  }

  return (
    <div className="psl-wrap">
      <style>{styles}</style>
      <StarField />
      <BadgeToasts toasts={toasts} onDismiss={dismissToast} />

      <header className="psl-header">
        <div className="psl-logo">
          <span className="psl-logo-icon">🐍</span>
          <span className="psl-logo-text">PYTHON SPEED LEARNER</span>
        </div>
        <div className="psl-sub">Leaving Cert · Section C drills</div>
        <div className="psl-greeting">
          Welcome, {progress.name}
          {progress.streak.count > 0 && (
            <span className="psl-streak-chip">🔥 {progress.streak.count}-day streak</span>
          )}
        </div>
      </header>

      <Hud score={progress.score} done={completed.size} total={TOPICS.length} />

      <NavBar screen={screen} onNavigate={setScreen} reviewCount={reviewQuestions.length} />

      <main className="psl-main">
        {screen === "map" && (
          <>
            <DifficultyPicker
              value={progress.difficulty}
              onChange={(d) => commit((p) => { p.difficulty = d; return p; })}
            />
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
            difficulty={progress.difficulty}
            onStart={() => {
              markActiveToday();
              setScreen("quiz");
            }}
            onBack={() => setScreen("map")}
          />
        )}

        {screen === "quiz" && active && (
          <Quiz
            topic={active}
            difficulty={progress.difficulty}
            onAnswer={(q, correct) => recordAnswer(active.id, q, correct)}
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
              +{lastResult.points != null ? lastResult.points : lastResult.hits * 10} points added. New rank: {rankFor(completed.size)}.
            </p>
            <div className="psl-row center">
              <button className="psl-btn" onClick={() => setScreen("map")}>
                Back to sector map
              </button>
            </div>
          </div>
        )}

        {screen === "review" && (
          <ReviewMode
            questions={reviewQuestions}
            onAnswer={recordAnswer}
            onBack={() => setScreen("map")}
          />
        )}

        {screen === "mock" && (
          <MockExam
            difficulty={progress.difficulty}
            onStart={markActiveToday}
            onAnswer={recordAnswer}
            onFinish={finishMock}
            onBack={() => setScreen("map")}
          />
        )}

        {screen === "mockResult" && lastResult && (
          <MockResult result={lastResult} onBack={() => setScreen("map")} />
        )}

        {screen === "stats" && (
          <StatsDashboard progress={progress} onBack={() => setScreen("map")} />
        )}

        {screen === "badges" && (
          <BadgesScreen earned={progress.badges} onBack={() => setScreen("map")} />
        )}
      </main>

      <footer className="psl-footer">
        Free game created by Milo Scott. Helping others learn
      </footer>
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

.psl-greeting{margin-top:8px;font-size:13px;color:#00FF88;letter-spacing:1px}

/* ---- Welcome / onboarding modal ---- */
@keyframes psl-fade-in{from{opacity:0}to{opacity:1}}
@keyframes psl-slide-up{from{opacity:0;transform:translateY(24px) scale(.98)}
  to{opacity:1;transform:translateY(0) scale(1)}}
@media (prefers-reduced-motion: reduce){
  .psl-modal-overlay,.psl-modal{animation:none!important}
}
.psl-modal-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;
  justify-content:center;padding:20px;box-sizing:border-box;
  background:rgba(3,3,14,.78);backdrop-filter:blur(6px);
  animation:psl-fade-in .35s ease}
.psl-modal{position:relative;width:100%;max-width:440px;box-sizing:border-box;
  background:linear-gradient(160deg,#11112b,#0a0a1e);border:1px solid #9B5CFF44;
  border-radius:22px;padding:30px 28px;overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 40px #9B5CFF22;
  animation:psl-slide-up .45s cubic-bezier(.18,.9,.32,1.1)}
.psl-modal-glow{position:absolute;top:-60px;right:-60px;width:180px;height:180px;
  border-radius:50%;background:radial-gradient(circle,#00D9FF55,transparent 70%);
  pointer-events:none}
.psl-modal-title{position:relative;font-size:24px;font-weight:800;margin:0 0 14px;
  line-height:1.25;background:linear-gradient(90deg,#00D9FF,#9B5CFF,#00FFFF);
  -webkit-background-clip:text;background-clip:text;color:transparent}
.psl-modal-lead{font-size:17px;font-weight:700;color:#00FF88;margin:0 0 10px}
.psl-modal-intro{font-size:14px;line-height:1.6;color:#d6d6ef;margin:0 0 22px}
.psl-modal-actions{display:flex;flex-direction:column;gap:12px}
.psl-btn-lg{padding:14px 18px;font-size:15px;width:100%;box-sizing:border-box}

.psl-modal-fineprint{font-size:12px;color:#8a8ab0;text-align:center;margin:14px 0 0}
.psl-credit{font-size:12.5px;color:#9B9BC4;text-align:center;margin:16px 0 0;
  font-style:italic;letter-spacing:.2px}
.psl-footer{max-width:900px;margin:32px auto 8px;text-align:center;font-size:12.5px;
  color:#7a7aa8;font-style:italic;letter-spacing:.2px;
  border-top:1px solid #ffffff10;padding-top:16px}

/* ---- Form ---- */
.psl-form{display:flex;flex-direction:column;gap:16px;animation:psl-fade-in .3s ease}
.psl-field{display:flex;flex-direction:column;gap:6px}
.psl-label{font-size:13px;color:#c9c9e6;letter-spacing:.3px}
.psl-text-input{background:#05050f;color:#fff;border:1px solid #ffffff22;border-radius:10px;
  padding:12px 14px;font-size:15px;font-family:inherit;transition:border-color .15s,box-shadow .15s}
.psl-text-input::placeholder{color:#6a6a90}
.psl-text-input:focus{outline:none;border-color:#00D9FF;box-shadow:0 0 0 3px #00D9FF22}
.psl-text-input.bad{border-color:#FF4D6D;box-shadow:0 0 0 3px #FF4D6D22}
.psl-field-error{font-size:12.5px;color:#FF8FA3}

/* ---- Streak chip in header ---- */
.psl-streak-chip{margin-left:10px;background:#2a1505;border:1px solid #ff9d3c55;
  border-radius:999px;padding:3px 10px;font-size:12px;color:#ffb866}

/* ---- Difficulty picker ---- */
.psl-diff-picker{max-width:900px;margin:0 auto 18px}
.psl-diff-title{text-align:center;font-size:13px;letter-spacing:1px;color:#9a9ac0;
  text-transform:uppercase;margin-bottom:10px}
.psl-diff-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.psl-diff-btn{display:flex;flex-direction:column;align-items:center;gap:4px;
  background:#0c0c22;border:1px solid #ffffff14;border-radius:16px;padding:16px 10px;
  color:#c9c9e6;cursor:pointer;transition:all .15s}
.psl-diff-btn:hover{border-color:#00D9FF;transform:translateY(-2px)}
.psl-diff-btn.active{background:linear-gradient(160deg,#1a1640,#0d0d24);
  border-color:#9B5CFF;box-shadow:0 0 20px #9B5CFF33}
.psl-diff-icon{font-size:26px}
.psl-diff-label{font-size:14px;font-weight:700;color:#fff;text-align:center}
.psl-diff-blurb{font-size:11px;color:#9a9ac0;text-align:center}

.psl-intro-diff{background:#0d0d24;border:1px solid #ffffff10;border-radius:10px;
  padding:10px 14px;font-size:13px;color:#c9c9e6;margin-bottom:16px}
.psl-intro-note{color:#8a8ab0}

/* ---- Nav bar ---- */
.psl-nav{max-width:900px;margin:0 auto 16px;display:flex;gap:8px;flex-wrap:wrap;
  justify-content:center}
.psl-nav-btn{background:#0c0c22;border:1px solid #ffffff14;border-radius:999px;
  padding:8px 14px;color:#c9c9e6;font-size:13px;cursor:pointer;transition:all .15s}
.psl-nav-btn:hover{border-color:#00D9FF;color:#fff}
.psl-nav-btn.active{background:linear-gradient(90deg,#00D9FF,#9B5CFF);color:#06061a;
  font-weight:700;border-color:transparent}

/* ---- Worked example ---- */
.psl-worked{margin:12px 0;background:#0a1a14;border:1px solid #00FF8833;
  border-left:3px solid #00FF88;border-radius:10px;padding:12px 14px}
.psl-worked-label{font-size:12px;text-transform:uppercase;letter-spacing:1px;
  color:#00FF88;margin-bottom:6px}
.psl-worked-body{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:13px;line-height:1.6;color:#cfeede;white-space:pre-wrap}

/* ---- Badge toasts ---- */
.psl-toast-wrap{position:fixed;top:16px;right:16px;z-index:60;display:flex;
  flex-direction:column;gap:10px;max-width:320px}
.psl-toast{display:flex;gap:12px;align-items:center;cursor:pointer;
  background:linear-gradient(160deg,#1a1640,#0d0d24);border:1px solid #FFD54F66;
  border-radius:14px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.5);
  animation:psl-slide-up .4s ease}
.psl-toast-icon{font-size:28px}
.psl-toast-title{font-size:12px;color:#FFD54F;text-transform:uppercase;letter-spacing:1px}
.psl-toast-label{font-size:13px;color:#fff;margin-top:2px}

/* ---- Stats dashboard ---- */
.psl-stat-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.psl-stat-card{background:#0d0d24;border:1px solid #ffffff10;border-radius:14px;
  padding:16px;text-align:center}
.psl-stat-num{font-size:28px;font-weight:800;color:#00D9FF}
.psl-stat-cap{font-size:12px;color:#9a9ac0;margin-top:4px}
.psl-weakest{background:#1a1208;border:1px solid #ffb86655;border-radius:10px;
  padding:12px 14px;font-size:14px;color:#ffd9a8;margin-bottom:16px}
.psl-stat-table{display:flex;flex-direction:column;gap:8px}
.psl-stat-line{display:grid;grid-template-columns:1.4fr 2fr auto;gap:10px;align-items:center}
.psl-stat-topic{font-size:13px;color:#d6d6ef}
.psl-stat-bar-track{height:8px;background:#0d0d24;border-radius:999px;overflow:hidden}
.psl-stat-bar-fill{height:100%;background:linear-gradient(90deg,#9B5CFF,#00D9FF)}
.psl-stat-acc{font-size:12px;color:#9a9ac0;text-align:right;font-variant-numeric:tabular-nums;
  white-space:nowrap}

/* ---- Badges screen ---- */
.psl-badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));
  gap:14px;margin-top:14px}
.psl-badge{background:#0d0d24;border:1px solid #ffffff12;border-radius:16px;padding:18px;
  text-align:center;transition:transform .15s}
.psl-badge.earned{border-color:#FFD54F55;box-shadow:0 0 18px #FFD54F18}
.psl-badge.earned:hover{transform:translateY(-3px)}
.psl-badge.locked{opacity:.5}
.psl-badge-icon{font-size:34px;margin-bottom:8px}
.psl-badge-label{font-size:15px;font-weight:700;color:#fff}
.psl-badge-desc{font-size:12px;color:#9a9ac0;margin-top:4px;line-height:1.4}

@media (max-width:520px){
  .psl-grid{grid-template-columns:1fr 1fr}
  .psl-logo-text{letter-spacing:1.5px}
  .psl-modal{padding:24px 20px}
  .psl-modal-title{font-size:21px}
  .psl-stat-cards{grid-template-columns:1fr}
  .psl-stat-line{grid-template-columns:1fr;gap:4px}
  .psl-stat-bar-track{order:3}
  .psl-diff-row{grid-template-columns:1fr}
}
`;
