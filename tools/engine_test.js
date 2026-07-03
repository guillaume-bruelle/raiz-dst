// Regression test for the calculation engine (calcFarm) in app/raiz_dst.html.
// Loads the js-engine block straight from the app file — no build step — and
// runs it against a small farm whose results were computed by hand.
// Every expected value below was derived on paper from docs/model_equations.md.
//
// Usage:  node tools/engine_test.js
// Exit code 0 = all assertions pass; 1 = at least one failure.
//
// If you change the model on purpose, recompute the affected expectations by
// hand and update them here — never by copying the code's own output.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'raiz_dst.html'), 'utf8');
const m = html.match(/<script id="js-engine">([\s\S]*?)<\/script>/);
if (!m) { console.error('js-engine block not found'); process.exit(1); }
eval(m[1]); // defines calcFarm

// ── Test fixture ─────────────────────────────────────────────────────────
// 4 periods (92+91+91+91 = 365 days). Flat prices so hand calculation stays easy.
const flat = v => [v, v, v, v];
const proj = {
  hired_labour_price: 5, wfp_threshold: 3,
  units: { currency: 'USD', area: 'ha', quantity_units: ['kg', 'litre'] },
  periods: [
    { id: 'p1', name: 'P1', days: 92 }, { id: 'p2', name: 'P2', days: 91 },
    { id: 'p3', name: 'P3', days: 91 }, { id: 'p4', name: 'P4', days: 91 }],
  crop_products: [
    { id: 'maize',  name: 'Maize',  unit: 'kg',    sell_price: flat(0.2),  buy_price: flat(0.3) },
    { id: 'forage', name: 'Forage', unit: 'kg',    sell_price: flat(0.05), buy_price: flat(0.10) },
    { id: 'milk',   name: 'Milk',   unit: 'litre', sell_price: flat(0.5),  buy_price: flat(0.6) }],
  member_types: [
    // 2 adults, available every day, each eating 200 kg maize/year (200/365 kg/day)
    { id: 'adult', name: 'Adult', avail_pct: flat(100),
      consumption: [{ cp_id: 'maize', qty_day: 200 / 365 }] }],
  cropping_systems: [
    // 1000 kg/ha maize harvested in P3; 30 labour days/ha; seed 50 $/ha at 50% subsidy
    { id: 'cs_maize', name: 'Maize ext',
      outputs: [{ cp_id: 'maize', yield_ha: [0, 0, 1000, 0] }],
      tasks:   [{ name: 'all', labour_ha: [10, 10, 10, 0] }],
      inputs:  [{ name: 'seed', cost_ha: [50, 0, 0, 0], subsidy: 0.5 }] },
    // pasture: 500 kg forage/ha/period, no labour, no cost
    { id: 'cs_past', name: 'Pasture',
      outputs: [{ cp_id: 'forage', yield_ha: flat(500) }], tasks: [], inputs: [] }],
  livestock_systems: [
    // per-head goats: 10 L milk & 100 kg forage & 1 labour day per head per period; 2 $ vet in P1
    { id: 'ls_goat', name: 'Goat', basis: 'head',
      outputs: [{ cp_id: 'milk', yield_head: flat(10) }],
      tasks:   [{ name: 'herding', labour_head: flat(1) }],
      inputs:  [{ name: 'vet', cost_head: [2, 0, 0, 0], subsidy: 0 }],
      feeds:   [{ cp_id: 'forage', kg_head: flat(100) }] },
    { id: 'ls_flock', name: 'Chicken flock', basis: 'herd',
      outputs: [], tasks: [], inputs: [], feeds: [] }],
};
const farm = {
  composition: { adult: 2 }, area: 3,
  nfi: [{ name: 'wages', amount: [100, 0, 0, 0] }],
  crop_plan: [{ cs_id: 'cs_maize', area_ha: 1 }, { cs_id: 'cs_past', area_ha: 1 }],
  livestock_plan: [{ ls_id: 'ls_goat', heads: 5 }, { ls_id: 'ls_flock', heads: 1 }],
};

// ── Assertion helpers ────────────────────────────────────────────────────
let fails = 0;
function eq(label, got, want, tol = 0.01) {
  const ok = typeof got === 'number' && Math.abs(got - want) <= tol;
  if (!ok) { fails++; console.log('FAIL', label, '— got', got, 'want', want); }
  else console.log('ok  ', label, '=', got);
}
function is(label, cond) {
  if (!cond) { fails++; console.log('FAIL', label); }
  else console.log('ok  ', label);
}

// ── Baseline run ─────────────────────────────────────────────────────────
const r = calcFarm(proj, farm);
const A = id => r.activities.find(a => a.id === id);

// labour: supply = 2 persons × days × 100 % ; demand = maize 10/period ×1 ha + goats 1×5
eq('supply P1 (2×92)', r.hh_supply[0], 184);
eq('demand P1 (10+5)', r.labour_demand[0], 15);
eq('demand P4 (0+5)', r.labour_demand[3], 5);
eq('hired total (supply ample)', r.hired_days.reduce((s, v) => s + v, 0), 0);

// needs & balance: maize need 400 (hh), forage 2000 (herd), milk 0
eq('maize hh_need', r.food.maize.hh_need, 400);
eq('maize QC = min(1000,400)', r.food.maize.qc, 400);
eq('maize sold', r.food.maize.sold_kg, 600);
eq('maize per-period need P1 (2×200/365×92)', r.food.maize.need_by_period[0], 2 * (200 / 365) * 92);
eq('forage herd_need (5×100×4)', r.food.forage.herd_need, 2000);
eq('forage purchase (covered on-farm)', r.food.forage.purchase_kg, 0);
eq('milk sold (no hh need)', r.food.milk.sold_kg, 200);

// income cascade — hand-computed:
// maize/ha: VQP 1000×0.2=200; sold 600×0.2=120; QC 400×0.3=120; InpC 50×0.5=25; LabC 0; FamD 30
eq('maize GM $/ha  (200−25)', A('cs_maize').GM_unit, 175);
eq('maize GMA (120+120−25)', A('cs_maize').GMA, 215);
eq('maize GMM (120−25)', A('cs_maize').GMM, 95);
eq('maize WFP (215/30)', A('cs_maize').WFP, 215 / 30);
// pasture: all forage self-fed → GMA = 2000×0.10 = 200 ; GMM 0 ; no labour → WFP null
eq('pasture GMA', A('cs_past').GMA, 200);
eq('pasture GMM', A('cs_past').GMM, 0);
is('pasture WFP null (no family labour)', A('cs_past').WFP === null);
// goats: milk 200×0.5=100 sold; vet 10; feed 2000×0.10=200 (all self-grown → GMM feed cost 0)
eq('goat GM $/head ((100−10−200)/5)', A('ls_goat').GM_unit, -22);
eq('goat GMA (100−10−200)', A('ls_goat').GMA, -110);
eq('goat GMM (100−10−0)', A('ls_goat').GMM, 90);

// farm aggregates & consistency identities
eq('FAI = ΣGMA (215+200−110)', r.FAI, 305);
eq('MAI = ΣGMM (95+0+90)', r.MAI, 185);
eq('MAI = GFM when nothing is bought', r.MAI, r.GFM);
eq('FAI − MAI = value of hh self-consumption (400×0.3)', r.FAI - r.MAI, 120);
eq('HH income (305+100 nfi)', r.HH_income, 405);
eq('income per capita (405/2)', r.inc_pc, 203);
eq('farm WFP (305/50 family days)', r.wfp_farm, 6.1);
eq('end cash (sales 220 + nfi 100 − inputs 35)', r.end_cash, 285);
is('resilience secure', r.resilience === 'secure' && r.food_secure && r.econ_secure);

// per-period series exposed for the results charts
eq('input_cost P1 (25 maize + 10 vet)', r.input_cost[0], 35);
eq('buy_cost all periods 0', r.buy_cost.reduce((s, v) => s + v, 0), 0);
is('activities expose per-period demand', r.activities.every(a => Array.isArray(a.demand)));
is('basis labels: goat=head, flock=herd', A('ls_goat').unit === 'head' && A('ls_flock').unit === 'herd');

// ── Scenario override: new crop plan, herd unchanged ─────────────────────
const r2 = calcFarm(proj, farm, [{ cs_id: 'cs_past', area_ha: 2 }]);
eq('scenario keeps herd (milk still produced)', r2.food.milk.tot_prod, 200);
eq('scenario forage production (2 ha × 2000)', r2.food.forage.tot_prod, 4000);
eq('scenario maize deficit bought (400)', r2.food.maize.purchase_kg, 400);

// ── Livestock-only farm: feed fully bought ───────────────────────────────
const farm2 = { composition: { adult: 1 }, area: 1, nfi: [], crop_plan: [],
  livestock_plan: [{ ls_id: 'ls_goat', heads: 2 }] };
const r3 = calcFarm(proj, farm2);
eq('feed all bought (2×100×4)', r3.food.forage.purchase_kg, 800);
eq('goat-only GMM (milk 40 − vet 4 − feed 80)', r3.activities[0].GMM, -44);
eq('goat-only GMA equals GMM (feed fully monetary)', r3.activities[0].GMA, -44);

// ── Legacy-schema fallback (pre-v2 fields still accepted) ────────────────
const projL = JSON.parse(JSON.stringify(proj));
projL.member_types = [{ id: 'adult', name: 'Adult', labour_days: 365,
  consumption: [{ cp_id: 'maize', kg_year: 200 }] }];
const r4 = calcFarm(projL, farm);
eq('legacy labour_days 365 → 100 % availability', r4.hh_supply[0], 184);
eq('legacy kg_year read as annual need', r4.food.maize.hh_need, 400);

console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL ENGINE CHECKS PASSED');
process.exit(fails ? 1 : 0);
