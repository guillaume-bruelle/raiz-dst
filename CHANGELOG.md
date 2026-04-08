# Changelog

All notable changes to the RAIZ DST are documented here.
Format: [version] — date — description

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