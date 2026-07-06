# RAIZ DST — Model Equations (v2 specification)

Canonical specification for the calculation engine (`js-engine` block in `app/raiz_dst.html`).

Sources: `main-equations-model.docx` (equations 1–9), `quels-indicateurs.txt`
(indicator rationale). Equation numbers from the source doc are cited as *(doc eq. N)*.

**Implementation status:** fully implemented in the v2.0 engine
(`js-engine` block), including the livestock module and the income cascade.

---

## Design decisions

1. **One cropping system = one crop × technical itinerary.** The ITK dimension of the
   source doc (ext / semi-int / int / agroeco / mix) is not a separate index. Each
   crop×ITK combination is entered as its own cropping system; the name carries the
   itinerary and the parameters (yields, labour, inputs) embody it. Comparing ITKs
   for a crop = comparing cropping systems.
2. **Self-consumption (QC) is derived, not entered.** `QC[cp] = min(production, need)`.
   The v1 surplus/deficit balance logic is kept as the allocation rule.
3. **Livestock mirrors crops.** A livestock system (ls) is parameterised **per head**
   (or per whole herd, see `basis`) exactly as a cropping system (cs) is per hectare:
   labour tasks, input costs, outputs — plus product inputs. A farm holds a herd plan
   (heads per ls) like a crop plan (ha per cs).
4. **Biomass flows are products.** Any activity can *produce* any product (grain,
   straw, milk, manure, forage) and any activity can *consume* any product through
   its **product inputs** (feed for livestock; mulch, fertiliser, seed for crops).
   All on-farm uses enter the same balance logic as household food: on-farm
   production covers need first, deficits are bought, surpluses sold. Pasture is
   simply a cropping system producing a forage product; no special case in the
   engine, and no circularity — quantities are fixed coefficients per unit of
   scale, so one pass computes everything.
5. **Internal transfers are valued at consumer price (PropC = buy price).**
   Self-consumed food and self-produced product inputs are valued at PropC in
   GMA-type indicators. Because the producing activity is credited and the
   consuming activity debited at the same price, internal transfers cancel at farm
   level — FAI has no double counting. Products with no real market (e.g. manure)
   can be given zero prices — their flows are then tracked physically but are
   economically neutral — or a **shadow price**, which makes biomass recycling
   visible in the margins. This is a per-product data choice, not a model change.
6. **Food security is household-priority.** The family is assumed to eat first
   from its own production: a product is food-secure when production covers the
   *household* need, even if farm uses push the total balance negative (the
   resulting purchases still appear in cash flow and GMM).

---

## Notation

| Symbol | Meaning |
|--------|---------|
| i | Period index (0 to N−1); N = number of periods |
| cs | Cropping system (= one crop × ITK) |
| ls | Livestock system (= one species × feeding itinerary) |
| a | Activity: one cs of the crop plan or one ls of the herd plan |
| S_a | Scale of activity a: area (crops) or heads / herds (livestock) |
| cp | Product (crop product, animal product, or forage), each with its own unit |
| mt | Household member type |
| ProP[cp,i] | Producer price = `sell_price` (currency / product unit) |
| PropC[cp,i] | Consumer price = `buy_price` (currency / product unit) |
| w | Hired labour price (currency / day) |

Units (currency, area unit, product quantity units) are project-level **labels**:
the model computes in whatever units are declared and never converts between them.

---

## 1. Labour Supply

Each member type declares an availability percentage per period (share of the
period's days available for farm work):

    HH_supply[i] = Σ_mt ( count[mt] × days[i] × avail_pct[mt,i] / 100 )

## 2. Labour Demand, Hired & Family Labour

Demand pools crop and livestock work:

    labour_demand[i] = Σ_cs Σ_task ( labour_ha[task,i] × area_ha[cs] )
                     + Σ_ls Σ_task ( labour_head[task,i] × heads[ls] )

    hired_days[i] = max( 0, labour_demand[i] − HH_supply[i] )
    hired_cost[i] = hired_days[i] × w                                (doc eq. 4)
    fam_days[i]   = min( labour_demand[i], HH_supply[i] )
    hf[i]         = hired_days[i] / labour_demand[i]     (hired fraction; 0 if demand = 0)

Only hired labour is a cost; family labour is not costed but is remunerated through
WFP (§8). The hired fraction hf[i] allocates hired labour to activities pro rata
their demand in each period (farm-level pooling — the model does not track which
worker does which task).

## 3. Input Costs (with subsidies)

Each input line carries an optional subsidy rate `subv ∈ [0,1]`
(partial subsidy: 0 < subv < 1; free provision, e.g. Pfumvudza: subv = 1).

    input_cost[i] = Σ_cs Σ_inp ( cost_ha[inp,i]   × (1 − subv[inp]) × area_ha[cs] )
                  + Σ_ls Σ_inp ( cost_head[inp,i] × (1 − subv[inp]) × heads[ls] )
                                                                     (doc eq. 3)

## 4. Production

    prod[cp,i]   = Σ_cs ( yield_ha[cs,cp,i]   × area_ha[cs] )
                 + Σ_ls ( yield_head[ls,cp,i] × heads[ls] )          (doc eq. 1)
    tot_prod[cp] = Σ_i prod[cp,i]

Livestock outputs (eggs, milk, meat/offtake in kg) are products like any other.

## 5. Needs: Household + On-Farm Use

Household consumption is declared per person per day (in the product's unit).
On-farm use covers livestock feed AND crop product inputs (mulch, fertiliser,
seed…), both expressed per unit of scale per period:

    hh_need[cp]   = Σ_mt ( count[mt] × qty_day[mt,cp] × 365 )
    herd_need[cp] = Σ_ls Σ_i ( feed_head[ls,cp,i]  × heads[ls] )     (livestock feed)
    crop_need[cp] = Σ_cs Σ_i ( use_ha[cs,cp,i]     × area_ha[cs] )   (crop product inputs)
    need[cp]      = hh_need[cp] + herd_need[cp] + crop_need[cp]

    need_pp[cp,i] = Σ_mt ( count[mt] × qty_day[mt,cp] × days[i] ) + on-farm use of period i
                    (per-period need, used for the food balance charts)

Note the balance is annual: production of any period can cover use in any period
of the same year (a deliberate simplification, identical to the food logic).

## 6. Self-Consumption, Balance & Trade

    QC[cp]          = min( tot_prod[cp], need[cp] )      (derived self-consumption)
    sold_kg[cp]     = tot_prod[cp] − QC[cp]
    purchase_kg[cp] = need[cp] − QC[cp]

    sell_rev[cp,i] = (prod[cp,i] / tot_prod[cp]) × sold_kg[cp] × ProP[cp,i]
    buy_cost[cp,i] = (purchase_kg[cp] / N) × PropC[cp,i]

Sales are distributed pro rata production per period; purchases are spread uniformly
(simplification, unchanged from v1). `balance[cp] = tot_prod − need` keeps its v1
meaning: surplus (≥ 0) or deficit (< 0).

## 7. Non-Farm Income & Cash Flow

    cash_in[i]  = Σ_cp sell_rev[cp,i] + nfi[i]
    cash_out[i] = input_cost[i] + hired_cost[i] + Σ_cp buy_cost[cp,i]
    cash_net[i] = cash_in[i] − cash_out[i]
    cash_cum[i] = Σ_{j≤i} cash_net[j]
    end_cash    = cash_cum[N−1]

Only real monetary flows appear here (self-consumption and self-grown feed do not).

---

## 8. Activity-Level Economics (income cascade)

For every activity a (a cropping system in the plan, or a livestock system in the
herd), with scale S_a:

Building blocks:

    QP_a[cp,i]  = yield[a,cp,i] × S_a                    (production of a)
    QC_a[cp,i]  = QC[cp] × QP_a[cp,i] / tot_prod[cp]     (self-consumption allocated
                                                          pro rata production)
    VQP_a       = Σ_i Σ_cp QP_a[cp,i] × ProP[cp,i]                   (doc eq. 2)
    InpC_a      = Σ_i Σ_inp cost[inp,i] × (1 − subv[inp]) × S_a
    MatC_a      = Σ_i Σ_cp use[a,cp,i] × S_a × PropC[cp,i]
                  (material/product inputs — livestock feed or crop mulch, seed,
                  fertiliser — all valued at consumer price, own-produced or bought)
    demand_a[i] = Σ_task labour[task,i] × S_a
    LabC_a      = Σ_i demand_a[i] × hf[i] × w            (hired share of a's labour)
    FamD_a      = Σ_i demand_a[i] × (1 − hf[i])          (family labour days on a)

### GM — Gross margin *(doc eq. 5)*

Classic economist margin: all production valued at producer price, regardless of
destination. For international / inter-crop comparison and expert validation.
Reported **per unit of scale** ($/ha or $/head).

    GM_a = ( VQP_a − InpC_a − MatC_a − LabC_a ) / S_a

### GMA — Return including self-consumption *(doc eq. 6)*

Self-consumed quantities valued at consumer price (what the household would have
paid), sold quantities at producer price. Total per activity ($).

    GMA_a = Σ_i Σ_cp [ (QP_a − QC_a)[cp,i] × ProP[cp,i] + QC_a[cp,i] × PropC[cp,i] ]
            − InpC_a − MatC_a − LabC_a

### WFP — Family work productivity *(doc eq. 7)*

Remuneration of one family labour day on activity a. Compare with the hired wage w
and the economic security threshold `wfp_threshold` (project parameter, $/day,
set according to food self-sufficiency and dependents per worker).

    WFP_a = GMA_a / FamD_a          (undefined when FamD_a = 0)

### GMM — Monetary margin *(doc eq. 8)*

Only monetary flows: self-consumption not valued, and only the **purchased** share
of product inputs is a cost. Matches household objectives and eases dialogue with
farmers (pair it with in-kind gains: "x kg fed the family").

    pf[cp]     = purchase_kg[cp] / need[cp]              (purchased fraction; 0 if need = 0)
    MatCm_a    = Σ_i Σ_cp use[a,cp,i] × S_a × pf[cp] × PropC[cp,i]

    GMM_a = Σ_i Σ_cp (QP_a − QC_a)[cp,i] × ProP[cp,i] − InpC_a − MatCm_a − LabC_a

---

## 9. Farm Aggregates

    FAI  = Σ_a GMA_a                 Farm agricultural income        (doc eq. 9)
    MAI  = Σ_a GMM_a                 Monetary agricultural income
    HH_income = FAI + Σ_i nfi[i]     Total household income
    inc_pc    = HH_income / HHS      with HHS = Σ_mt count[mt]

    WFP_farm  = FAI / Σ_a FamD_a     Farm-level family work productivity

Consistency property: internal product-input transfers cancel in FAI (the
producing activity credited, the consuming activity debited at the same PropC), so

    FAI = MAI + Σ_cp (household + own-herd self-consumption valued at PropC)

with no double counting. v1's GFM/GM aggregates are superseded by MAI/HH_income.
Note: household food purchases (deficits) are consumption expenses — they appear
in cash flow (§7) but not in FAI/MAI.

## 10. Resilience Classification

Food security is **household-priority** (see design decision 6): production must
cover the household's own need; deficits caused by on-farm use don't threaten it
(they are visible in cash flow and GMM instead).

    food_secure = all cp with hh_need[cp] > 0 have tot_prod[cp] ≥ hh_need[cp]
    econ_secure = end_cash ≥ 0

    Secure     : food_secure AND econ_secure
    Fragile    : food_secure XOR econ_secure
    Vulnerable : NOT food_secure AND NOT econ_secure

Displayed alongside (not part of the classification): WFP_farm vs. `wfp_threshold`
and vs. the hired wage w; forage balance (herd feed self-sufficiency).

---

## Appendix — Data-model changes v1 → v2

| Object | Change |
|--------|--------|
| `project.units` (new) | `{ currency, area, quantity_units[] }` — display labels only, never converted. |
| `crop_products` | Generalised to **products** (crop, animal, forage): `{ id, name, unit, sell_price[i], buy_price[i] }`. |
| `cropping_systems.inputs[]` | Add optional `subsidy` (0–1, default 0). |
| `cropping_systems.mat_inputs[]` (new, v2.1) | `{ cp_id, qty_ha[i] }` — product inputs consumed per ha per period (mulch, fertiliser, seed…). Mirror of livestock `feeds`. |
| `livestock_systems[]` (new) | `{ id, name, basis:'head'\|'herd', tasks:[{ labour_head[i] }], inputs:[{ cost_head[i], subsidy }], feeds:[{ cp_id, kg_head[i] }], outputs:[{ cp_id, yield_head[i] }] }` — strict mirror of a cropping system. `basis` says whether quantities are per animal or per whole herd; the engine only multiplies by the plan's count. |
| `farm.livestock_plan[]` (new) | `{ ls_id, heads }` — number of heads (basis 'head') or herds (basis 'herd'). |
| `member_types` | `labour_days` (days/year) replaced by `avail_pct[i]` (% of each period's days). |
| `member_types.consumption[]` | `kg_year` replaced by `qty_day` (product units per person per day); may reference animal products (eggs, milk). |
| project | Add `wfp_threshold` (currency/day). |
| Pasture | No schema: a cropping system producing the forage product at zero/low cost, area = pasture area. |

Legacy fields (`labour_days`, `kg_year`, missing units/basis) are migrated
automatically on load.

Schema/export version must be bumped; JSON/CSV/Excel import-export extended
accordingly.
