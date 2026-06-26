# Python Speed Learner 🚀

A space-themed quiz game for drilling the Python topics that come up most in the
Irish Leaving Cert Computer Science **Section C** (programming) exam.

Work through 13 "sectors" — strings, loops, functions, conditionals, lists,
`len()`, type checks, accumulators, formatted output, reading & modifying code,
averages, nested loops, and dictionaries. Each sector has 7 questions mixing
multiple choice, predict-the-output, spot-the-bug, and write-in code with a
green **RUN** button and a simulated console.

## Play it

**Online:** once GitHub Pages is enabled (see below), it's live at
`https://<your-username>.github.io/python-speed-learner/`

**Offline:** download `index.html` and open it in any browser. It's fully
self-contained — React, ReactDOM and Babel are bundled in, so it works with no
internet connection.

## Features

- 13 unlockable topic sectors in Leaving Cert Section C priority order
- 7 questions per sector, shuffled order every playthrough
- Multiple-choice options shuffled each time too
- Write-in code questions with a green RUN button and terminal-style output
- Light-yellow hint button on every question
- Score, rank, and progress tracking

## Project files

| File | What it is |
|------|------------|
| `index.html` | The complete game — open this to play. Everything is bundled in. |
| `PythonSpeedLearner.jsx` | The readable React source, if you want to edit the game. |

## Editing the game

Edit `PythonSpeedLearner.jsx` (the questions live in the `TOPICS` array near the
top). The `index.html` is a bundled copy, so after editing the source you'd
rebuild the HTML or paste your changes into the `<script type="text/babel">`
block inside `index.html`.

## Built with

React 18 · Babel (in-browser) · plain CSS animations. No build tooling required.
