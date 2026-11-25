# Known issues and development notes

Working list for the development of the RAIZ DST. Not for reports.
Found while writing section 5 of the O2.4 report (November 2026), checked
against app/raiz_dst.html, CHANGELOG.md, docs/model_equations.md and the
in-app Guide. Tick items off, or move them to CHANGELOG.md [Unreleased]
when fixed.

## Model scope

- [ ] **Food security uses the declared need, not the 160 kg threshold.**
  The tool tests whether production covers the need declared for each member
  type. It does not apply the 160 kg/person/year threshold of the household
  model. The Zimbabwe template sets about 200 kg maize per adult and 120 kg
  per child per year (demo household: 760 kg for 5, i.e. 152 kg/person).
  Decide: keep declared need, or add the threshold as an option.
- [ ] **No household expenses in the cash balance.** There is no input for
  non-food household expenses (school fees, etc.). End-of-year cash covers only
  farm costs and food purchases, so it is not the cash criterion
  co-constructed with farmers.

## Parameters (template data)

- [ ] Template values not checked; calibrate on reference-farm monitoring data.
- [ ] Labour demand of 95–105 days/ha in October–November drives most of the
  demo cash deficit: check these values first.
- [ ] Demo scenario (Maize int.): inputs rise from USD 130 to 445. Check that
  the input costs of the intensified maize system are realistic.

## Display (js-results, js-scenarios)

- [ ] **Economic-security badge threshold.** In the results panel the badge is
  Secure if econ_secure, Fragile if end_cash > −100, otherwise Vulnerable.
  The −100 is hard-coded, independent of currency, and undocumented. The
  badge can show Vulnerable while the overall class is Fragile (seen on the
  demo farm, Figure 1b of the report). Make it a parameter or align it with
  the classification.
- [ ] **Food-security badge is never red**: only Secure or Fragile.
- [ ] **Scenario Change column colour**: any increase is green, including a
  higher hired-labour cost (demo: +300 shown green). Colour by direction of
  improvement per indicator.

## Scenarios

- [ ] Only the crop plan can be changed; household, herd and non-farm income
  stay fixed.
- [ ] Scenarios are not saved with the farm.
- [ ] Scenario area is not checked against the farm area.

## In-app Guide

- [ ] "Navigation — 7 tabs" but eight tabs are listed.
- [ ] Definition of Secure does not say that only the household's own needs count.
- [ ] Non-farm income section says "Amounts in USD per period", although the
  currency can be set.
- [ ] §8 says the Change column is "green for improvements, red for
  deterioration": not what the code does (see Display).
- [ ] §8 says scenario food charts show baseline and scenario; they show the
  scenario only.

## Docs

- [ ] `wfp_threshold`: docs/model_equations.md (around line 190) and the
  CHANGELOG v2.0 entry call it an "economic security threshold", but the code
  only uses it to colour a KPI card and it is not part of the class (as
  model_equations.md line 239 and section 3 of the report say). Align wording.

- [ ] README citation says "(2025)" while LICENSE copyright says 2026.
- [ ] README "Repository structure" omits `tools/` (check_syntax.js,
  engine_test.js) and WORKFLOW.md.
- [ ] Fonts (DM Serif Display, DM Mono, Outfit) load from Google Fonts: the
  service worker caches them once seen, otherwise system fonts are used
  offline. Consider embedding them if the look matters offline.

## Template workbooks

- [x] docs/template-zim/02_member_types_data.xlsx, sheet `consumption`:
  "Adulte female" rows silently dropped by the import. Fixed: the sheet now
  reads "Adult female" (checked 2026-11-25). Consider making the import warn
  when a consumption row matches no member type instead of dropping it.
