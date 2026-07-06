# Changelog

All notable changes to the RAIZ DST are documented here.
Format: [version] — date — description

---

## [Unreleased]
- On narrow screens (≤768px) the main menu and the Parameters sub-menu become
  native drop-down lists instead of horizontally scrolling button rows

## [v2.0] — 2026-07-03

### Changed — model v2 (see docs/model_equations.md)
- Calculation engine rewritten around the income cascade of the reference model
  (main-equations-model.docx, eq. 1–9):
  - GM — gross margin per unit ($/ha or $/head), all production valued at selling price
  - GMA — return including self-consumption, valued at buying price (consumer price)
  - GMM — monetary income only (self-consumption not valued)
  - WFP — family work productivity (GMA per family labour day), with a project-level
    WFP threshold ($/day) for economic security assessment
  - FAI (Σ GMA), MAI (Σ GMM), Total HH Income (FAI + non-farm) at farm level
- Self-consumption (QC) is derived: `QC = min(production, need)`; the v1
  surplus/deficit balance logic is kept as the allocation rule
- Input costs support a subsidy % per input line (partial subsidy or 100% free
  provision, e.g. Pfumvudza)
- Results page: income cascade KPI cards, per-activity economics table,
  GMA-by-activity chart; scenario comparison updated to the new indicators
- Results charts reworked per period:
  - Cash flow now details income (product sales, non-farm) and expenses
    (input costs, hired labour, purchases) as stacked bars + cumulative line
  - Labour balance chart: household supply vs demand lines with hired days
    as bars (cost in tooltip and in the Labour Detail table)
  - New "Labour Demand by Activity" chart: stacked demand per crop/livestock
    activity against the supply line — shows which activity drives labour peaks
  - Food balance charts use the real per-period need (consumption × days +
    herd feed) instead of a flat annual split
  - Colorblind-safe chart palette, consistent entity colors across charts

### Added — livestock module
- Livestock systems (species × feeding practice), strict mirror of cropping
  systems per head per period: outputs (animal products), labour tasks,
  inputs (with subsidy), and feed requirements referencing a product
- Herd section in Data Entry (livestock system + head count, like the crop plan)
- Feed demand enters the same balance logic as household food: on-farm forage
  covers herd need first, deficits bought, surpluses sold; pasture is modelled
  as a cropping system producing a forage product
- Livestock labour pooled with crop labour in the household labour balance
- Excel import/export for livestock systems (5-sheet workbook: systems,
  outputs, tasks, inputs, feeds); `subsidy_pct` column on input sheets
- Research CSV: FAI, MAI, WFP, family labour days, livestock systems column,
  and per-product need split (household vs herd feed)

### Added — Android / offline field use
- Chart.js and SheetJS are now embedded in the HTML file (no CDN): charts and
  Excel import/export work with no internet connection
- Installable as an app (PWA): manifest, icons and a service worker
  (`app/manifest.json`, `app/sw.js`, `app/icon-*.png`). Hosted (e.g. GitHub
  Pages) and opened once in Chrome on Android → "Add to Home Screen" gives a
  fullscreen app that works fully offline and updates automatically when online
- Wide data tables scroll horizontally within their card on small screens
- Guide §11 rewritten: installed-app setup recommended on Android; local-file
  opening flagged as unreliable for auto-saved data on Android

### Added — units, currency & usability
- New Parameters tab "Units & Currency": project currency, area unit, and the
  list of quantity units for products — labels only, the model never converts
- "Crop Products" renamed to "Products"; each product has its own unit
  (kg, litre, egg...) used consistently for prices, yields, consumption and feed
- Livestock systems can be expressed per head (per-animal coefficients) or
  per herd (totals for a whole typical flock — easier for farmers); Data Entry
  then asks for the number of heads or of herds
- Member types redefined for field use: labour is an availability % of each
  period's days (seasonality expressible), consumption is quantity per person
  per day; food balance charts now show the true per-period need
- Excel formats updated accordingly (product `unit`, member `avail_pct_{period}`
  and `qty_day`, livestock `basis`); legacy columns are still accepted on import
- Older sessions/projects are migrated automatically on load (empty herd,
  zero subsidies, default units, labour days → availability %, kg/year → qty/day)

---

## [v1.1] — 2026-04-08

### Added
- Excel import/export for parameters (Crop Products, Member Types, Cropping Systems)
  - Download blank template with correct period headers
  - Export existing data as `.xlsx` (same format, re-importable by another user)
  - Import appends rows with validation: period count and names, duplicate names, unresolved product references
  - Cropping systems use a 4-sheet workbook (systems, outputs, tasks, inputs)
  - Member types use a 2-sheet workbook (member_types, consumption)
- Deletion protection for all parameter items
  - Periods, crop products, member types and cropping systems are blocked from deletion if referenced elsewhere
  - Error message explains exactly what references must be removed first
  - Sub-row deletions (consumption needs, CS outputs/tasks/inputs) require confirmation

### Changed
- License updated from MIT to CeCILL-B (French open source, governed by French law)
- Copyright updated to CIRAD, University of Zimbabwe, CIMMYT with EU funding notice
- Footer added to app with copyright, license link and EU grant acknowledgement

---

## [v1.0] — 2025-11-21

### Initial release

- Configurable Project/Environment architecture
- User-defined calendar (N periods summing to 365 days)
- Configurable crop products with sell/buy prices per period
- Configurable household member types with labour capacity and consumption needs
- Configurable cropping systems (outputs, labour tasks, inputs — all per period per ha)
- Farm profiles stored within projects
- Data entry: household composition, farm area, non-farm income, crop plan
- Calculation engine: labour balance, food balance, cash flow, GFM, resilience
- Scenario simulation with baseline vs scenario comparison
- Sessions & Export tab: named snapshots, download/upload .json, CSV export
- Responsive layout for tablet and smartphone (Android browser)
- Inline user guide and model equation reference
- Auto-save to localStorage with header timestamp