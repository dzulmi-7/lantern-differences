# Test results

Run on 2026-11-21 with Node 22.23.5, installed Playwright and Chromium, at 1280×800.

- Playwright passed: initial scene, real-coordinate click hit testing, miss feedback without scoring, hint pulse without auto-solving, find from either image, paired rings, static art after discovery, saved partial finds and rings restored after refresh, Tab focus, spatial arrow navigation, Enter to find, victory overlay, next scene, independent progress per scene, replay reset, and sound toggle. No browser console or page errors occurred.
- Three screenshots are direct, unedited Chromium JPEG captures at 1280×800: `01-market.jpg` (67,598 bytes), `02-glasshouse.jpg` (67,594 bytes), and `03-observatory.jpg` (68,210 bytes). The cover shows two images, two discovery rings, and four remaining finds.
- `node --check game/game.js` and `node --check game/scenes.js` passed. `MAKEFUN_OUTPUT_DIR=/tmp/lantern-final node main.ts` generated the hand-in and dossier.
- The requested `makefun grade-local --kit <kit> --bot main.ts --driver process --worktree` command was attempted. The supplied kit has no scorer/reference data and the CLI refuses local grading for this server-graded program/v1 competition. No submission or upload was made.
