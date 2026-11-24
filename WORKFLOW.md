# RAIZ DST — Day-to-day development workflow

Reference card for the git, commit and release routine. Keep this file at the
root of the `raiz-dst/` repository.

Companion documents: [`docs/model_equations.md`](docs/model_equations.md) owns
the maths, [`docs/developer_guide.md`](docs/developer_guide.md) owns the code,
the in-app 📖 Guide owns user documentation, [`CHANGELOG.md`](CHANGELOG.md)
owns the history. This file owns the routine.

---

## The golden rule: only you commit

**Claude Code never commits.** It never runs `git commit`, `git push`,
`git tag`, or anything else that changes git history or the remote. It edits
files in the working tree, runs the checks and suggests a commit message.
**You review, commit and push yourself.**

Pushing `main` deploys the live site, so nothing reaches field agents without
your review.

---

## Setup (one time only, already done)

| | |
|---|---|
| Repository | <https://github.com/guillaume-bruelle/raiz-dst> |
| Live URL | <https://guillaume-bruelle.github.io/raiz-dst/> |
| Local path | wherever you cloned `raiz-dst/` |

Tools used:
- **VS Code**: editing, committing and pushing to GitHub
- **Claude Code**: AI help with code changes (VS Code panel)
- **Node.js**: runs the two checks in `tools/`
- **Chrome/Firefox**: testing the tool locally

---

## Every time you sit down to work

1. Open VS Code → *File → Open Folder* → select `raiz-dst/`.
2. Pull the latest changes: Source Control (`Ctrl+Shift+G`) → `...` menu → *Pull*.
3. Open the Claude Code panel, with `app/raiz_dst.html` open alongside.

---

## Making a change

1. Open `app/raiz_dst.html`. Always edit `app/`, never the frozen snapshots in
   `versions/`.
2. Find the right block with `Ctrl+F` on its `<script id="...">` label. Never
   navigate by line number, because line numbers shift with every edit.

   | Block | Contains |
   |---|---|
   | `js-state` | shared data (globals), autosave, `migrateProjects` |
   | `js-nav` | navigation between tabs |
   | `js-sessions` | save/load sessions |
   | `js-projects` | project management |
   | `js-calendar` | period definitions |
   | `js-units` | units (labels only, never converted) |
   | `js-crop-products` | product parameters |
   | `js-member-types` | household member types |
   | `js-cropping-systems` | cropping system definitions |
   | `js-livestock-systems` | livestock system definitions |
   | `js-farms` | farm profile management |
   | `js-entry` | data entry form logic |
   | `js-engine` | `calcFarm`, the model |
   | `js-results` | results rendering and charts |
   | `js-scenarios` | scenario simulation |
   | `js-export` | CSV/research exports |
   | `js-xlsx-io` | Excel import/export |
   | `js-utils` | helpers (`_esc`, `_download`) |
   | `js-init` | start-up |

   `vendor-chartjs` and `vendor-xlsx` are embedded libraries. Never edit them by
   hand, and never run a find/replace across the whole file. A second
   `</body>` sits inside SheetJS, and a blind replace corrupts the app.
3. Describe the change to Claude Code, e.g. *"In js-engine, weight the food
   purchase distribution by period length instead of splitting it equally."*
   Claude edits the file, runs the checks, and ends with a wrap-up (see below).
4. Review the diff in VS Code.
5. **Model or data-structure changes:** Claude must ask before touching them.
   The order is: `docs/model_equations.md` first → the matching step in
   `calcFarm` → hand-computed expectations in `tools/engine_test.js` → the
   in-app 📖 Guide.
6. Test: open `app/raiz_dst.html` in Chrome (drag the file in) and check the
   change works.
7. If it works, commit (next section). If not, describe the problem to Claude
   in the same panel.

---

## Before every commit: checklist

Run from the repository root:

```
node tools/check_syntax.js
node tools/engine_test.js
```

Both must pass (exit code 0). Claude runs them after each change and reports
the results, but run them yourself if you edited anything by hand.

Then check:
- [ ] Both checks pass.
- [ ] Manual smoke test in Chrome done for what changed.
- [ ] User-visible changes are listed in `CHANGELOG.md` under `## [Unreleased]`.
- [ ] The relevant doc is in sync: `model_equations.md` (maths),
      `developer_guide.md` (code), in-app Guide (users), this file (routine).
- [ ] Nothing in `versions/` was modified (unless this is a release).

---

## Committing and pushing

1. Source Control (`Ctrl+Shift+G`): changed files are listed.
2. Stage the files with `+`. If Claude's changes cover unrelated things, stage
   and commit them in separate groups, one message per group.
3. Write the commit message. Claude's wrap-up suggests one; adjust it if needed.

   Format: `prefix: short description`, lowercase, no final full stop.

   | Prefix | Use for | Example |
   |---|---|---|
   | `fix:` | bug fix, no new feature | `fix: land bar not updating when farm area changes` |
   | `feat:` | new feature or UI addition | `feat: add livestock section to data entry` |
   | `model:` | change to the calculation engine or equations | `model: update labour supply proration formula` |
   | `docs:` | guide or documentation files only | `docs: add consumption note to user guide` |
   | `style:` | visual or layout change only | `style: improve mobile layout for data entry tab` |
   | `release:` | new version snapshot | `release: v2.2` |

4. Click *Commit* (✓).
5. Click *Sync Changes* (or *Push*).
6. The live URL updates within ~2 minutes:
   <https://guillaume-bruelle.github.io/raiz-dst/>. Installed Android apps pick
   up the update on their next online launch.

---

## What Claude Code reports at the end of every task

Every task ends with a short wrap-up:

- **To do / update**: what you still have to do (files to review, manual smoke
  tests in Chrome, docs or Guide sections to update, test values to check,
  anything unfinished).
- **Suggested commit**: one message in the format above, or one per group of
  files if the changes are unrelated.

---

## Releasing a new version

Version numbers:

| Bump | When | Example | Snapshot file |
|---|---|---|---|
| Patch | bug fix, model unchanged | v2.1.1 | `versions/v2.1.1_raiz_dst.html` |
| Minor | new feature, same model and schema | v2.2 | `versions/v2.2_raiz_dst.html` |
| Major | model equations or data structure changed | v3.0 | `versions/v3.0_raiz_dst.html` |

Ask Claude *"prepare release vX.Y"*. **Claude prepares the files only:**

1. Bumps `<title>` in `app/raiz_dst.html`:
   `<title>RAIZ — Farm Analysis DST vX.Y</title>`
2. Copies `app/raiz_dst.html` to `versions/vX.Y_raiz_dst.html`.
3. Moves the `[Unreleased]` items in `CHANGELOG.md` into a dated entry:

   ```
   ## [vX.Y] — YYYY-MM-DD
   ### Added
   - ...
   ```

   and leaves a fresh empty `## [Unreleased]` section at the top.
4. Bumps `CACHE` in `app/sw.js` (e.g. `raiz-dst-v1` → `raiz-dst-v2`) if the
   list of cached files (`CORE`) changes.
5. Runs both checks and suggests `release: vX.Y`.

**You then** review, commit `release: vX.Y` and push. Keep the `.nojekyll` file
at the root: GitHub Pages needs it.

---

## Sharing the tool with field agents

**Option A: live URL** (easiest, needs internet once)
- Share <https://guillaume-bruelle.github.io/raiz-dst/>
- Works in any browser, desktop or Android, and can be installed as an app.
- Always the latest version, and works offline once opened.

**Option B: offline file** (no internet needed after transfer)
1. Go to github.com/guillaume-bruelle/raiz-dst → `app/raiz_dst.html`.
2. Click *Download raw file*.
3. Send it by email, USB or WhatsApp; the agent opens it in Chrome.

**Sharing data between agents (sessions)**
- Agent A: *Sessions & Export* → *Download .json*
- Send the `.json` (email, WhatsApp, USB)
- Agent B: *Sessions & Export* → *Load from file* → select the `.json`

---

## Saving and backing up field data

The tool autosaves to browser localStorage (timestamp in the top-right header).
localStorage is **not** a permanent backup. Always:

**At the end of each field day**
- *Sessions & Export* tab → name the session, e.g. `Mutoko_2025-11-21`
- *Save to Browser* (a checkpoint in this browser)
- *Download .json* (a real file on the device)
- Store the `.json` somewhere safe (cloud drive, USB)

**For the research team**
- *Sessions & Export* → *Export Farm Data for Research*
- Check the status panel: every farm should show ✓
- *Download CSV* and send it to the research team

---

## Useful links

- Live tool: <https://guillaume-bruelle.github.io/raiz-dst/>
- Repository: <https://github.com/guillaume-bruelle/raiz-dst>
- Claude Code: <https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code>
- VS Code: <https://code.visualstudio.com>

---

## File structure

```
raiz-dst/
├── app/
│   ├── raiz_dst.html          ← the working tool (always edit this one)
│   ├── sw.js                  ← service worker (offline cache; bump CACHE on release if needed)
│   ├── manifest.json          ← PWA install settings
│   └── icon-192.png, icon-512.png
├── versions/
│   └── vX.Y_raiz_dst.html     ← frozen snapshots (never edit these)
├── docs/
│   ├── model_equations.md     ← the model contract (update first for model changes)
│   ├── developer_guide.md     ← code architecture and practices
│   └── template-zim/          ← example Excel parameter workbooks
├── tools/
│   ├── check_syntax.js        ← syntax check of every script block
│   └── engine_test.js         ← hand-computed regression test of calcFarm
├── index.html                 ← redirects the live URL to app/raiz_dst.html
├── .nojekyll                  ← required by GitHub Pages (keep)
├── README.md                  ← public-facing project description
├── CHANGELOG.md               ← version history in plain language
├── LICENSE                    ← CeCILL-B licence
└── WORKFLOW.md                ← this file
```

---

Bruelle, G. — RAIZ Project — <https://orcid.org/0000-0002-8390-419X>
