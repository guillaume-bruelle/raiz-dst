# RAIZ DST — Developer Guide

For the scientist-developer who needs to understand, modify or extend this tool,
and who is more at home in R or Python than in JavaScript. No web-development
background is assumed beyond "I have edited an HTML file before".

Companion documents: [`model_equations.md`](model_equations.md) owns the maths;
[`../WORKFLOW.txt`](../WORKFLOW.txt) owns the git/release routine; the in-app
📖 Guide tab owns user-facing documentation. This file owns the code.

---

## 1. What kind of program is this?

One HTML file — [`app/raiz_dst.html`](../app/raiz_dst.html) — is the entire
application. There is no server, no database, no framework, no build step, no
package installation. The web browser is the runtime, the way R is the runtime
for an `.R` script. You edit the file, save, press F5 in the browser, and the
new version runs.

If you think in R/Python, these analogies carry most of the way:

| In this app | R / Python equivalent |
|---|---|
| A `<script id="js-...">` block | one sourced `.R` file / one module, loaded top-to-bottom |
| The `projects` global object | a big named `list` / `dict` holding all data |
| `calcFarm(project, farm)` | a pure function: takes lists in, returns a list of results, touches nothing else |
| `autosave()` → localStorage | `saveRDS()` after every change, automatic |
| Rendering functions (`renderCalendar()`…) | functions that `paste0()` an HTML string and display it |
| The browser console (F12) | the R console / Python REPL, attached to the live app |
| `JSON.parse(JSON.stringify(x))` | a deep copy, like `copy.deepcopy(x)` |

Two JavaScript habits that surprise R/Python people:

- **Indexing starts at 0.** `periods[0]` is the first period. Everywhere.
- **`const`/`let` declare variables**; `=>` is a lambda (`function(x) x+1` ≈ `x => x+1`);
  `` `text ${expr}` `` is an f-string. `Σ` loops are usually written
  `arr.reduce((s,v) => s+v, 0)` — read it as `sum(arr)` with an accumulator.

## 2. Your toolbox and first session

You need: **VS Code** (editing), **Chrome** (running + debugging), **Node.js**
(only for the test scripts in `tools/`).

The single most useful skill is driving the live app from the console — the
exact equivalent of poking at objects in the R console:

1. Open `app/raiz_dst.html` in Chrome (double-click the file). Create a throwaway
   project with a couple of periods and a farm.
2. Press **F12** → **Console** tab. The app's globals are all there:

```js
projects                 // everything, as one big object
activeProj()             // the active project (shortcut used all over the code)
activeProj().periods     // look at any piece of it
_farm()                  // the selected farm (when one is selected)
calcFarm(activeProj(), _farm())         // run the model by hand, inspect the result
JSON.stringify(activeProj(), null, 2)   // pretty-print a whole project
```

3. Edit the file in VS Code, save, press **F5** in Chrome. Your data survives the
   reload (localStorage). To start clean: F12 → Application tab → Local storage →
   right-click → Clear, or just work in a scratch browser profile.

`console.log(x)` anywhere in the code prints to that console — it is your
`print()` debugging. For breakpoints: F12 → Sources → find the file → click a
line number.

**Warning before you edit anything:** read §8 (gotchas). In particular, the file
contains two embedded minified libraries — your editor will happily open the
file, but *never* run a blind find-and-replace across the whole of it.

## 3. Anatomy of the file

The file reads top to bottom: header comment → `<head>` (PWA tags + two
`vendor-*` library blocks) → CSS (one `<style>` block) → HTML for every page →
then all the JavaScript, split into named blocks. Navigate by searching for the
block id (e.g. `"js-engine"`), never by line number.

| Block id | Owns | Key functions |
|---|---|---|
| `vendor-chartjs`, `vendor-xlsx` | embedded Chart.js & SheetJS — **never edit by hand** (see recipe 6.8) | — |
| `js-state` | globals, autosave/load, schema migration, unit helpers | `autosave`, `loadAutosave`, `migrateProjects`, `_cur`, `_areaU` |
| `js-nav` | page/panel switching | `showPage`, `showPanel` |
| `js-sessions` | named snapshots, .json download/upload | `saveSession`, `loadFromFile` |
| `js-projects` | project CRUD, empty-project template | `_emptyProject`, `createProject` |
| `js-calendar` | periods panel | `renderCalendar`, `removePeriod` |
| `js-units` | units & currency panel | `renderUnits`, `addQtyUnit` |
| `js-crop-products` | products panel | `renderCropProducts`, `removeCropProduct` |
| `js-member-types` | member types panel | `renderMemberTypes` |
| `js-cropping-systems` | cropping systems panel, accordions | `renderCroppingSystems`, `toggleAcc` |
| `js-livestock-systems` | livestock systems panel | `renderLivestockSystems` |
| `js-farms` | farm profiles list | `createFarm`, `selectFarm` |
| `js-entry` | data entry page, validation | `loadEntryForm`, `renderCropPlan`, `renderHerdPlan`, `validateEntry` |
| `js-engine` | **the model** — pure calculation, no DOM | `calcFarm` |
| `js-results` | results page: KPIs, tables, charts | `runAnalysis`, `_renderResults`, `_foodSection`, `_chart` |
| `js-scenarios` | scenario plan + comparison | `runScenario`, `_renderScComparison` |
| `js-export` | research CSV/JSON export | `doExportCSV`, `doExportJSON` |
| `js-utils` | HTML escaping, file download | `_esc`, `_download` |
| `js-xlsx-io` | Excel templates, import/export | `exportCroppingSystemsXLSX`, `importLivestockSystemsXLSX`, … |
| `js-init` | startup sequence + service-worker registration | (top-level calls) |

Three rules explain how everything fits together:

1. **One direction of data flow.** UI event → handler mutates the data object →
   `autosave()` → a `render*()` function rebuilds that panel's HTML from the
   data. Nothing caches UI state elsewhere; re-rendering from data is always safe.
2. **The engine is pure.** `calcFarm` reads its two arguments and returns a
   results object. It never touches the page, storage or globals — which is why
   the test in `tools/engine_test.js` can run it in Node, outside any browser.
3. **UI is template strings.** Panels are built as f-string-style HTML with
   inline `oninput="..."` handlers that write straight back into the data
   (e.g. `oninput="activeProj().periods[3].days = parseInt(this.value)||0; autosave()"`).
   Any *user-entered* text placed into HTML goes through `_esc(...)` — always.

## 4. The data model

Everything lives in `projects`, an object keyed by project id. One project,
abbreviated (`[...]` = one number per calendar period, in order):

```js
{
  id: "PROJ_1_...", name: "...", description: "...",
  hired_labour_price: 5,          // currency per day
  wfp_threshold: 3,               // currency per family-labour day
  units: { currency: "USD", area: "ha", quantity_units: ["kg","litre","egg"] },
  periods: [ { id, name: "P1", days: 92, description } /* ×N, days sum to 365 */ ],
  crop_products: [                // "products": crop, animal AND forage products
    { id, name: "Maize", unit: "kg", sell_price: [...], buy_price: [...] } ],
  member_types: [
    { id, name: "Adult", description,
      avail_pct: [...],           // % of each period's days available for work
      consumption: [ { cp_id, qty_day } ] } ],   // product units per person per DAY
  cropping_systems: [             // one system = one crop × technical itinerary, per ha
    { id, name, description,
      outputs: [ { cp_id, yield_ha: [...] } ],
      tasks:   [ { name, description, labour_ha: [...] } ],
      inputs:  [ { name, description, cost_ha: [...], subsidy: 0.5 } ] } ], // subsidy 0–1
  livestock_systems: [            // strict mirror of a cropping system
    { id, name, description,
      basis: "head",              // "head" or "herd" — what one unit of scale means
      outputs: [ { cp_id, yield_head: [...] } ],
      tasks:   [ { name, description, labour_head: [...] } ],
      inputs:  [ { name, description, cost_head: [...], subsidy: 0 } ],
      feeds:   [ { cp_id, kg_head: [...] } ] } ],
  farms: {
    F1: { id: "F1", name, village, area: 3,
          composition: { <member_type_id>: 2 },
          nfi: [ { name, amount: [...] } ],
          crop_plan:      [ { cs_id, area_ha } ],
          livestock_plan: [ { ls_id, heads } ],   // heads OR herd count, per basis
          results: null /* last calcFarm output, filled by runAnalysis */ } }
}
```

Invariants to respect:

- Every quantity that varies over the year is an **array of length N periods**,
  same order as `periods`. Read with `(arr[pi] || 0)` — entries can be missing.
- **Ids are permanent.** Cross-references (`cp_id`, `cs_id`, `ls_id`, member ids)
  point at ids, never names. New ids come from `uid(prefix)`.
- **Units are labels.** The engine never converts kg↔tonnes or currencies; it
  multiplies quantities by prices and trusts the user's declared units.
- **Schema changes go through `migrateProjects()`** (block `js-state`) — see
  recipe 6.6. Old saved sessions must always load.

## 5. The calculation engine

`calcFarm(proj, farm, plan_override?, lplan_override?)` — the two optional
arguments substitute the crop plan / herd (that is how scenarios run: same farm,
different plan). The function body is numbered `// 1.` … `// 10.` and follows
[`model_equations.md`](model_equations.md) section for section:

| Spec § | Code step | What it does |
|---|---|---|
| §1 | 1 | labour supply from `avail_pct` |
| §2 | 2 | pooled labour demand, hired/family split, hired fraction `hf[i]` |
| §3 | 3 | input costs net of subsidy |
| §4 | 4 | production per product per period |
| §5 | 5 | needs: household (qty/day × days) + herd feed |
| §6 | 6 | derived self-consumption `QC = min(prod, need)`, sell/buy split |
| §7 | 7 | non-farm income, cash flow |
| §8 | 8 | per-activity cascade GM / GMA / GMM / WFP |
| §9 | 9 | farm aggregates FAI / MAI / HH income / farm WFP |
| §10 | 10 | resilience classification |

An "activity" is one cropping system used in the plan (scale = total ha) or one
livestock system in the herd (scale = total heads/herds). Crops and livestock go
through **identical** code paths; only the property names differ
(`yield_ha`/`yield_head` etc.), which the code bridges with
`o.yield_ha || o.yield_head`.

Two conventions worth internalising before touching §8 (both are stated in the
spec, both are asserted in the tests):

- Self-consumption is allocated to activities **pro rata their share of each
  product's production**, valued at buy price in GMA.
- Feed is valued at **buy price in GM/GMA** whether bought or self-grown (so the
  forage crop's credit and the herd's debit cancel farm-wide: `FAI = Σ GMA` has
  no double counting). In GMM only the actually-purchased fraction of feed costs money.

The return object feeds everything downstream: KPI cards, the activities table,
all charts, the CSV export, and `farm.results`. Add new outputs there rather
than recomputing anything in the UI layer.

## 6. Recipes

### 6.1 Change an equation
1. Update [`model_equations.md`](model_equations.md) first — it is the contract.
2. Edit the corresponding numbered step in `calcFarm`.
3. Recompute the affected expected values in `tools/engine_test.js` **by hand**
   and update them; run `node tools/engine_test.js` until green.
4. Update the in-app Guide (§6 of the docs page) if the formula is shown there.

### 6.2 Add a project-level parameter (like `wfp_threshold`)
1. Add a default in `_emptyProject` (`js-projects`) **and** a backfill line in
   `migrateProjects` (`js-state`) so old sessions get the default.
2. Add an input to the right parameters panel (copy the `wfp-threshold` input in
   `panel-labour` and its loading line in `showPanel`).
3. Use it in `calcFarm` as `p.your_param`.

### 6.3 Add a farm-level input
Follow an existing example end to end: `nfi` (simple list) or `livestock_plan`
(reference + number). You will touch: `createFarm` defaults + `migrateProjects`
(`js-state`), a card in the `page-entry` HTML, a `render*` + `add*`/`remove*`
trio in `js-entry`, `loadEntryForm`, possibly `validateEntry`.

### 6.4 Add an output indicator
1. Compute it inside `calcFarm` and add it to the returned object.
2. Show it: KPI card (the `_kpis` array in `_renderResults`), and/or a column in
   the activities table.
3. If researchers need it: add a column to `doExportCSV` (header array **and**
   row array — same position in both).
4. If scenarios should compare it: add a row in `_renderScComparison`.
5. Assert it in `tools/engine_test.js` with a hand-computed value.

### 6.5 Add a chart
1. Add `<div class="chart-wrap"><canvas id="ch-yourid"></canvas></div>` inside a
   card on the results page HTML.
2. Call `_chart('ch-yourid', 'bar'|'line', {labels, datasets}, options)` from
   `_renderResults` — copy the labour chart as a template. `_chart` handles
   destroying the previous instance on re-run.
3. Constraints used throughout: one y-axis per chart (never dual axes); fixed
   colors per *entity* reused across charts (sales green `#2E7D4F`, non-farm blue
   `#1273B4`, inputs amber `#D97706`, hired labour rust `#B4552D`, purchases plum
   `#8E4585`, cumulative/reference ink `#2C1810`); legends at the bottom.

### 6.6 Change the data schema
1. Write the new shape wherever objects are *created* (`_emptyProject`,
   `createFarm`, `add*` functions).
2. Add a migration in `migrateProjects` that fills the new field on old data
   (and converts old fields if renaming — see `labour_days → avail_pct` there
   for the pattern). **Never delete the old field**; readers keep a fallback
   (`c.qty_day !== undefined ? ... : c.kg_year/365`) so pre-migration data and
   old exports still work.
3. If the field is user-entered: extend the Excel template/import in `js-xlsx-io`
   (accept files without the new column).
4. Test by loading an old session .json from `versions/`-era data.

### 6.7 Add an Excel column
In `js-xlsx-io`, each parameter type has an `export...XLSX(asTemplate)` and an
`import...XLSX(input)`. Add the header + value in the export's `aoa_to_sheet`
call, and read it in the import with a default for old files
(`parseFloat(row.your_col) || 0`). Period-dependent columns are named
`prefix_{periodName}` and validated by `_xlsxPeriodCheck`.

### 6.8 Upgrade an embedded library
Never hand-edit the `vendor-*` blocks. Download the new minified build (cdnjs),
check it contains **no** `</script`, `<script` or stray `<!--` sequence, then
replace the entire content between `<script id="vendor-...">` and its
`</script>` with a script — not with editor find/replace. Run both `tools/`
checks, then load the app and open every chart and one Excel export.

### 6.9 Release a version
Follow [`WORKFLOW.txt`](../WORKFLOW.txt): bump the `<title>` version, copy the
file to `versions/vX.Y_raiz_dst.html`, add the CHANGELOG entry, commit
`release: vX.Y`, push. Pushing `main` publishes automatically to GitHub Pages
(the `.nojekyll` file at the repo root must stay). Installed Android apps pick
the update up on their next online launch — nothing to redeploy.

## 7. Testing your changes

Two scripts, run from the repo root, need only Node.js:

```
node tools/check_syntax.js   # every js-* block parses (catches typos instantly)
node tools/engine_test.js    # ~40 hand-computed assertions against calcFarm
```

Run both before every commit. The engine test loads `calcFarm` straight out of
the HTML file, so it always tests exactly what ships. Its fixture is a small
farm (maize + pasture + goats) whose every expected number was computed on
paper from the spec — including the consistency identities
(`FAI − MAI = value of self-consumption`, internal feed transfers cancel,
scenario keeps the herd, legacy fields still read). When you add model
behaviour, add an assertion; when a test fails after your change, believe the
test first.

Manual smoke test after UI work: create project → calendar → units → products →
member types → one cropping + one livestock system → farm → entry → Run
Analysis → open every chart → run a scenario → export CSV → save + reload a
session .json.

Dev tip while testing the hosted version: the service worker serves cached
files. In Chrome DevTools → Application → Service workers, tick **"Update on
reload"** (or use a hard reload) so you always see your latest push.

## 8. Gotchas — read before your first edit

- **The file contains two `</body>` sequences.** One is real; one sits inside
  SheetJS's minified code as a string. Any script or editor macro that
  find/replaces on tags across the whole file **will corrupt the app**. Target
  your edits precisely; treat the `vendor-*` blocks as opaque.
- **Search by block id / function name, never by line number** — the vendored
  libraries make line numbers meaningless and unstable.
- **VS Code shows a phantom `'}' expected` error near the end of the file.**
  Its language service cannot fully parse the embedded minified SheetJS. It is a
  false positive — `node tools/check_syntax.js` is the authority on syntax.
- **Every user string that enters HTML goes through `_esc()`.** A farm named
  `<img onerror=...>` must render as text, not execute.
- **Quoting in inline handlers is fragile.** The pattern
  `oninput="...[${i}].field=this.value; autosave()"` mixes JS template quotes
  and HTML attribute quotes — copy an existing handler and modify it rather
  than writing one from scratch.
- **Per-period arrays may be shorter than N** (periods added after the data was
  created). Always read defensively: `(arr[pi] || 0)`.
- **`runAnalysis` recomputes; `farm.results` is a snapshot** kept for the CSV
  export status. Don't read stale `results` in new UI code — call `calcFarm`.
- **Rounding lives at the edges.** The engine returns rounded aggregates
  (`Math.round`) but raw per-period arrays; format in the UI, don't re-round in
  the engine.
- **localStorage is per-origin.** The hosted app, a local file, and localhost
  each have separate storage. Session .json files are the bridge between them.
- **Service-worker updates take effect one launch late** for `sw.js` itself;
  content changes to the HTML apply on the next online launch. If field devices
  seem stale, they simply haven't been online since your push.

## 9. Documentation map

| Document | Owns | Update when |
|---|---|---|
| `docs/model_equations.md` | the mathematical model | any equation/schema change (first!) |
| `docs/developer_guide.md` | this — code architecture & practices | patterns, blocks or tooling change |
| In-app 📖 Guide | user-facing manual incl. simplified equations | any user-visible change |
| `WORKFLOW.txt` | git & release routine for non-developers | process changes |
| `CHANGELOG.md` | version history | every release |
| `tools/` | executable checks | with every model change |
