# RAIZ DST — Model Equations

Reference documentation for the calculation engine (`js-engine` block in `app/raiz_dst.html`).

## Notation

| Symbol | Meaning |
|--------|---------|
| i | Period index (0 to N−1) |
| N | Number of periods in the calendar |
| cs | Cropping system |
| cp | Crop product |
| mt | Household member type |
| row | One line of the crop plan (cs × area_ha) |

## 1. Labour Supply

HH_supply[i] = Σ_mt ( count[mt] × labour_days[mt] × (days[i] / 365) )

## 2. Labour Demand & Hired Labour

labour_demand[i] = Σ_row Σ_task ( labour_ha[task,i] × area_ha[row] )
hired_days[i]    = max( 0, labour_demand[i] − HH_supply[i] )
hired_cost[i]    = hired_days[i] × hired_labour_price

## 3. Input Costs

input_cost[i] = Σ_row Σ_inp ( cost_ha[inp,i] × area_ha[row] )

## 4. Production

prod[cp,i]   = Σ_row ( yield_ha[cs(row),cp,i] × area_ha[row] )
tot_prod[cp] = Σ_i prod[cp,i]

## 5. Household Food Need

hh_need[cp] = Σ_mt ( count[mt] × kg_year[mt,cp] )

## 6. Food Balance & Trade

balance[cp] = tot_prod[cp] − hh_need[cp]

If balance >= 0 (surplus):
  sold_kg[cp]    = balance[cp]
  sell_rev[cp,i] = (prod[cp,i] / tot_prod[cp]) × sold_kg[cp] × sell_price[cp,i]

If balance < 0 (deficit):
  purchase_kg[cp] = −balance[cp]
  buy_cost[cp,i]  = (purchase_kg[cp] / N) × buy_price[cp,i]

## 7. Cash Flow

cash_in[i]  = Σ_cp sell_rev[cp,i]  +  nfi[i]
cash_out[i] = input_cost[i]  +  hired_cost[i]  +  Σ_cp buy_cost[cp,i]
cash_net[i] = cash_in[i] − cash_out[i]
cash_cum[i] = Σ_{j≤i} cash_net[j]
end_cash    = cash_cum[N−1]

## 8. Gross Farm Margin

GFM = Σ_i sell_rev[i]  −  Σ_i input_cost[i]  −  Σ_i hired_cost[i]

## 9. Household Income Aggregates

GM     = GFM  +  Σ_i nfi[i]
HHS    = Σ_mt count[mt]
inc_pc = GM / HHS

## 10. Resilience Classification

food_secure = all cp with hh_need[cp] > 0 have balance[cp] >= 0
econ_secure = end_cash >= 0

Secure     : food_secure AND econ_secure
Fragile    : food_secure XOR econ_secure
Vulnerable : NOT food_secure AND NOT econ_secure