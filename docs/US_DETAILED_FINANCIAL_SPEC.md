# US Detailed Feasibility — Financial Specification

**Version:** v0.2
**Status:** Formula contract — inputs, defaults, formulas, outputs, edge states, golden vector. The engine (`core/detailed-us/`) implements this document exactly. No Detailed UI may be built from it until explicitly requested.
**Companion documents:** `US_DETAILED_FEASIBILITY_SCOPE.md` (scope, owner locks UD-1…UD-4 — this document does not re-litigate them), `US_PRODUCT_SCOPE.md` (Quick — shares `data/us/salesTaxRates.ts` and the pre-tax revenue principle with Detailed, nothing else).
**Currency:** USD · **Country:** United States · **Preset:** Coffee Shop / Cafe

This is a **structural port** of the TR sibling app's Detailed Financial Specification. Every formula, default and edge state below was checked line-by-line against that source and changed only where US-1 (pre-tax pricing), UD-1 (delivery has no merchant sales tax), UD-2 (one fully-loaded cost per position), UD-3 (two-field owner section) or UD-4 (0% platform fee default) requires it. Where TR and this document would otherwise agree, this document says so explicitly rather than re-deriving it.

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| The formula contract an engine must implement exactly | Permission to start building |
| The source of truth for defaults, limits, edge states and the golden vector | A product-scope decision log (`US_DETAILED_FEASIBILITY_SCOPE.md` owns that) |

---

## 1. Scope boundaries (unchanged from TR)

- No self-employment/payroll-tax calculator, no company/income tax engine, no accounting depreciation.
- No full sales-tax accounting (input/output/payable/carry-forward/filing) — this is planning-level tax, same as Quick.
- No per-item tax rates, no category grouping, no seasonality, no financing/working-capital timing, no waste modeling.
- Quick and Detailed remain separate engines. Neither imports the other's business logic. They share `data/us/salesTaxRates.ts` as data only.

---

## 2. Terminology

### 2.1 Banned in identifiers, types, comments and strings

`depreciation` · `amortization` · `netProfit` · `customerCount` (for break-even) · `ticket` (Detailed has no average ticket) · `VAT` (this product has no VAT — use `salesTax`)

### 2.2 Locked identifiers

| Concept | Identifier |
| --- | --- |
| Monthly bottom line | `monthlyOperatingResult` |
| Direct product cost per unit | `unitProductCost` |
| Packaging + own-courier per order | `channelVariableCost` |
| POS and platform deductions | `paymentPlatformFee` |
| Revenue as entered, pre-tax | `netRevenue` |
| Customer-facing total including sales tax | `grossCustomerSales` |
| Sales tax added on top of `netRevenue` | `salesTaxAmount` |
| Sum of CAPEX items | `totalInitialInvestment` |
| Contribution per unit, mix-weighted | `weightedContributionPerUnit` |

### 2.3 Enumerations

```
Channel        = 'dineIn' | 'takeaway' | 'delivery'
PaymentMethod  = 'cash' | 'card'
DeliveryMode   = 'platformOnly' | 'platformCourier'
RampUpPreset   = 'slow' | 'normal' | 'fast'
ScenarioKey    = 'bad' | 'base' | 'good'
```

No `mealCard` payment method (dropped — `US_DETAILED_FEASIBILITY_SCOPE.md` §3), no `RentInputBasis` (no rent withholding to choose a basis for — US-2). `platformOnly` = the merchant runs its own courier; the platform is used only to take/list the order. `platformCourier` = the platform's own rider delivers (e.g., DoorDash/Uber Eats marketplace fulfillment). Exactly one mode is active.

---

## 3. Input contract

`DetailedInput` is the raw shape from the UI, every field `unknown`. `DetailedResolvedInput` is what validation produces: every field a finite number or valid enum, every default applied. **The engine only ever consumes `DetailedResolvedInput`.**

### 3.1 Products

| Field | Unit | Required |
| --- | --- | --- |
| `id` | string | yes |
| `name` | string | yes |
| `normalPrice` | USD, **pre-tax** (dine-in & takeaway) | yes |
| `onlinePrice` | USD, **pre-tax** (delivery) | yes |
| `dailyQuantity` | units/day, stabilized | yes |
| `unitProductCost` | USD/unit | yes |

At least one product is required. No category field.

### 3.2 Mixes

| Field | Unit |
| --- | --- |
| `channelMix.dineIn` / `.takeaway` / `.delivery` | fraction, must sum to 1 |
| `paymentMix.cash` / `.card` | fraction, must sum to 1 |

One business-level channel mix applied to every product. The payment mix applies to **dine-in and takeaway only** — delivery is platform-collected, not part of the merchant's own payment mix.

### 3.3 Payment, delivery, packaging

| Field | Unit |
| --- | --- |
| `posCommissionRate` | fraction |
| `delivery.mode` | `DeliveryMode` |
| `delivery.platformFeeRate` | fraction, 0 allowed |
| `delivery.ownCourierCostPerDeliveryOrder` | USD/order, **`platformOnly` only** |
| `packaging.takeawayPerOrder` | USD/order |
| `packaging.deliveryPerOrder` | USD/order |

Packaging is **business-level**, not per product — same reasoning as Quick and TR: it's one number the owner already knows, not a per-item attribute worth a field on every row.

### 3.4 Jurisdiction, occupancy, personnel, owner

| Field | Unit |
| --- | --- |
| `usState` | USPS code or `DC` — **required**, same field and table as Quick (`US_PRODUCT_SCOPE.md` §3.2, §5) |
| `salesTaxRate` | fraction, resolved from `usState`, editable — resets to the table value when `usState` changes |
| `occupancy.monthlyRent` | USD/month |
| `occupancy.monthlyCAM` | USD/month, may be 0 |
| `positions[]` | `{ id, name, headcount, monthlyCostPerPerson }` |
| `owner.monthlyDraw` | USD/month |
| `owner.benefitsAllowance` | USD/month |

No `rentInputBasis` field — US-2 removed rent withholding entirely, not just its default. `positions` may be empty. CAM is entered here only, never again under OPEX. The owner is never also a position — a UI guardrail, not engine logic.

`monthlyCostPerPerson` is the exact same definition as Quick's `averageEmployeeMonthlyCost` (`US_PRODUCT_SCOPE.md` §3.1): fully loaded employer cost — wages, employer payroll taxes (including on reported tips), workers' comp, benefits.

### 3.5 OPEX and CAPEX

| Field | Unit |
| --- | --- |
| `opexLines[]` | `{ id, name, monthlyAmount }` |
| `capexItems[]` | `{ id, name, amount }` |

Both may be empty. Standard starter line names and CAPEX starter items are a UI concern, not engine defaults. All OPEX is a monthly average.

### 3.6 Required and optional fields

| Field | Requirement |
| --- | --- |
| `products`, and every field of each product | **Required.** An empty or absent list is `empty_products` |
| `usState` | **Required.** No implicit rate — same rule as Quick |
| `occupancy.monthlyRent`, `occupancy.monthlyCAM`, `owner.monthlyDraw`, `owner.benefitsAllowance`, `packaging.*`, `delivery.ownCourierCostPerDeliveryOrder`, `positions[].monthlyCostPerPerson` | Optional, default **`0`** |
| `positions`, `opexLines`, `capexItems` | Optional, default **empty array** |
| `positions[].id/.name/.headcount`, `opexLines[].id/.name/.monthlyAmount`, `capexItems[].id/.name/.amount` | **Required when that array entry exists** |
| Every assumption, both mixes, `posCommissionRate`, `delivery.platformFeeRate` | Optional, default per §4 |
| `delivery.mode` | **Required when `channelMix.delivery > 0`.** Inert and defaulted otherwise |

Products and `usState` are the only things a feasibility model cannot proceed without. Zero-defaulting the rest avoids fabricating requirements — a business with no CAM, no staff or no CAPEX must be modellable.

**One zero-default is approved product behavior, not implementation convenience:** an empty `positions[].monthlyCostPerPerson` resolves to `0` and never blocks the calculation, but the later UI must warn prominently when `headcount > 0` and `monthlyCostPerPerson === 0` — payroll is usually the largest fixed cost, so this silently removing it deserves a warning, not a validation error. A position with `headcount === 0` is a deliberate not-yet-hiring entry and must not warn.

### 3.7 Assumptions

| Field | Unit |
| --- | --- |
| `operatingDaysPerMonth` | days |
| `projectionHorizonMonths` | 12 \| 24 \| 36 only |
| `rampUpPreset` | `RampUpPreset` |
| `scenarioVolumeDeltas.bad` / `.base` / `.good` | fraction delta, e.g. `-0.25` |
| `salesPriceAnnualIncrease` | fraction |
| `productCogsAnnualIncrease` | fraction |
| `fixedCostAnnualIncrease` | fraction |

No `rentWithholdingRate` — there is nothing to hold back.

---

## 4. Defaults

One table, one home: `core/detailed-us/defaults.ts`. The form imports these; it never restates them.

| Key | Default | Editable | Note |
| --- | --- | --- | --- |
| `usState` | none — required | — | Same field/table as Quick |
| `salesTaxRate` | from the state table | yes | Resets on state change, same rule as Quick §3.2 |
| `operatingDaysPerMonth` | `30` | yes | |
| `posCommissionRate` | `0.035` | yes | Same default as Quick — one POS number across both modes, not TR's two slightly different ones |
| `platformFeeRate` | `0` | yes | UD-4 — no invented DoorDash/Uber Eats/Grubhub market rate. One default for both delivery modes |
| `channelMix` | `dineIn 0.50 · takeaway 0.20 · delivery 0.30` | yes | Illustrative starting split, carried over from TR unchanged — not US-specific research, just a reasonable default the user overwrites |
| `paymentMix` | `cash 0.15 · card 0.85` | yes | US cafes are card-dominant; this is a planning default, not a researched market figure — same status as Quick's POS default |
| `projectionHorizonMonths` | `24` | preset only | |
| `rampUpPreset` | `'normal'` | yes | |
| `scenarioVolumeDeltas` | `bad −0.25 · base 0 · good +0.25` | yes | Country-neutral, unchanged from TR |
| `salesPriceAnnualIncrease` | `0` | yes | Never invent a default rate — same rationale as TR |
| `productCogsAnnualIncrease` | `0` | yes | |
| `fixedCostAnnualIncrease` | `0` | yes | |
| `currency` | `'USD'` | no | |
| `detailedEngineVersion` | — | no | Assigned when the engine ships (Phase 1-equivalent) |

### 4.1 Ramp-up preset table (unchanged from TR — country-neutral)

Percentage of the **scenario-adjusted** stabilized quantity, by projection month.

| Month | slow | normal | fast |
| --- | --- | --- | --- |
| 1 | 0.40 | 0.60 | 0.80 |
| 2 | 0.55 | 0.75 | 0.90 |
| 3 | 0.70 | 0.85 | 1.00 |
| 4 | 0.80 | 0.95 | 1.00 |
| 5 | 0.90 | 1.00 | 1.00 |
| 6+ | 1.00 | 1.00 | 1.00 |

---

## 5. Limits and validation

`core/detailed-us/limits.ts`. Non-currency fields (unit counts, fractions, day counts) are identical to TR — they don't depend on currency. Currency-denominated ceilings are rescaled for USD and are a **first pass**, not researched market caps (US-7 in `US_PRODUCT_SCOPE.md` §9 already flags this as open and non-blocking).

| Field | Min | Max |
| --- | --- | --- |
| `normalPrice`, `onlinePrice` | 0 (exclusive) | 1,000 |
| `dailyQuantity` | 0 | 100,000 |
| `unitProductCost` | 0 | 1,000 |
| `packaging.*`, `ownCourierCostPerDeliveryOrder` | 0 | 1,000 |
| `posCommissionRate` | 0 | 0.10 |
| `platformFeeRate` | 0 | 0.60 |
| `salesTaxRate` | 0 | 0.50 | — same range as Quick (`US_PRODUCT_SCOPE.md` §5.1), not restated as a second number |
| `operatingDaysPerMonth` | 1 | 31 |
| `monthlyRent`, `monthlyCAM`, `opexLines[].monthlyAmount` | 0 | 500,000 |
| `positions[].headcount` | 0 | 500 |
| `positions[].monthlyCostPerPerson` | 0 | 50,000 |
| `owner.monthlyDraw`, `owner.benefitsAllowance` | 0 | 50,000 |
| `capexItems[].amount` | 0 | 5,000,000 |
| `scenarioVolumeDeltas.*` | −0.90 | 5 |
| `salesPriceAnnualIncrease`, `productCogsAnnualIncrease`, `fixedCostAnnualIncrease` | −0.50 | 2 |
| `channelMix.*`, `paymentMix.*` | 0 | 1 |

An upper bound is a validity ceiling, not a suggestion — it marks where an entry stops being a plausible commercial figure for a cafe, nothing more.

### 5.1 Validation contract (unchanged from TR)

- Validation **returns** errors, never throws. All errors accumulate; validation does not stop at the first one.
- Absent optional fields resolve to the §4 default. Absent required fields produce `required`.
- Result shape: `{ ok: true, input: DetailedResolvedInput } | { ok: false, errors: ValidationError[] }`.

```
ValidationError = { path: (string | number)[], code: ValidationErrorCode, limit?: number }
ValidationErrorCode = 'required' | 'not_a_number' | 'below_min' | 'above_max'
                    | 'invalid_value' | 'mix_not_100' | 'empty_products'
```

`channelMix` and `paymentMix` must each sum to `1` within a tolerance of `1e-6`, or error `mix_not_100`. The engine **never silently normalizes a mix**. An empty `products` array is `empty_products` — no engine path handles zero products, validation rejects that input first. One or more products with `dailyQuantity = 0` is a different, valid case (§9).

`delivery.mode` is required whenever `channelMix.delivery > 0` — never silently defaulted, because it selects the platform fee context and whether `ownCourierCostPerDeliveryOrder` applies at all. When `delivery.mode` is `platformCourier`, `ownCourierCostPerDeliveryOrder` is forced to `0` during resolution — supplying it is not an error, it's discarded.

---

## 6. Revenue model

### 6.1 Quantity basis

Entered quantity is **daily stabilized**. For a product `p`, channel `c`, and multipliers `s` (scenario) and `r` (ramp-up):

```
effectiveDailyQuantity(p)   = p.dailyQuantity × s × r
monthlyQuantity(p)          = effectiveDailyQuantity(p) × operatingDaysPerMonth
channelQuantity(p, c)       = monthlyQuantity(p) × channelMix[c]
```

Quantity is not part of unit economics — §7 defines every cost strictly **per unit**; §8 multiplies by `channelQuantity`.

### 6.2 Channel price

```
channelPrice(p, 'dineIn')   = p.normalPrice × priceFactor
channelPrice(p, 'takeaway') = p.normalPrice × priceFactor
channelPrice(p, 'delivery') = p.onlinePrice × priceFactor
```

`priceFactor` is the escalation factor (§9.3); it is `1` in the stabilized month and in projection month 1.

### 6.3 Pre-tax revenue and sales tax (US-1, UD-1) — replaces TR's VAT netting

**This is the single biggest formula difference from TR.** TR starts from a tax-inclusive price and nets tax out by dividing. This product starts from a **pre-tax** price (as entered — same principle as Quick's US-1) and adds tax on top, and only on the channels where the merchant actually collects it:

```
netPerUnit(p, c)      = channelPrice(p, c)                          // pre-tax, as entered

salesTaxPerUnit(p, c) = netPerUnit(p, c) × salesTaxRate    if c ∈ { dineIn, takeaway }
                      = 0                                    if c = delivery            // UD-1

grossPerUnit(p, c)    = netPerUnit(p, c) + salesTaxPerUnit(p, c)
```

**Never** `netPerUnit / (1 + salesTaxRate)` — that is TR's tax-inclusive math and does not apply here. **Never** add `salesTaxRate` to delivery — most US states require the marketplace (DoorDash/Uber Eats/Grubhub) to collect and remit sales tax on delivery orders itself; adding it again on the merchant's side would double-count tax the merchant never touches (UD-1).

Expanded to monthly totals by §8:

```
channelGross(p, c)   = channelQuantity(p, c) × grossPerUnit(p, c)
channelNet(p, c)      = channelQuantity(p, c) × netPerUnit(p, c)
channelTax(p, c)       = channelQuantity(p, c) × salesTaxPerUnit(p, c)

grossCustomerSales   = Σ over all p, c of channelGross(p, c)
netRevenue           = Σ over all p, c of channelNet(p, c)
salesTaxAmount       = Σ over all p, c of channelTax(p, c)
```

`netRevenue` is the operating revenue used by the monthly operating result and break-even.

### 6.4 Order counts (unchanged)

```
takeawayOrderCount = takeaway unit count
deliveryOrderCount = delivery unit count
```

An intentional v1 simplification, same as TR — no basket size, no customer count.

---

## 7. Variable cost model

Three concepts, kept separate: Product COGS, Channel Variable Costs, and Payment/Platform Fees. **Everything here is per unit and volume-free** — the formulas `unitEconomics.ts` owns. Quantity enters only in §8.

### 7.1 Product COGS

```
unitProductCost(p) = p.unitProductCost × cogsFactor
```

Unit cost is constant with respect to volume; the monthly total follows units sold. Excludes packaging, own-courier payment and every commission.

### 7.2 Channel Variable Costs

```
unitChannelVariableCost('dineIn')   = 0
unitChannelVariableCost('takeaway') = packaging.takeawayPerOrder × cogsFactor
unitChannelVariableCost('delivery') = (packaging.deliveryPerOrder + ownCourierPerOrder) × cogsFactor

ownCourierPerOrder = delivery.ownCourierCostPerDeliveryOrder  when mode = 'platformOnly'
                   = 0                                        when mode = 'platformCourier'
```

`cogsFactor` is the Product COGS escalation factor — these costs escalate with that group while remaining a separate cost line.

### 7.3 Payment / Platform Fees (UD-1)

Direct store sales are dine-in + takeaway. The payment mix applies to them **only**:

```
directFeeRate = paymentMix.card × posCommissionRate     // cash contributes 0; no meal-card term

unitPaymentPlatformFee(p, 'dineIn')   = grossPerUnit(p, 'dineIn')   × directFeeRate
unitPaymentPlatformFee(p, 'takeaway') = grossPerUnit(p, 'takeaway') × directFeeRate
unitPaymentPlatformFee(p, 'delivery') = grossPerUnit(p, 'delivery') × delivery.platformFeeRate
```

Card fees on dine-in/takeaway are computed on `grossPerUnit` (price + sales tax) — the full amount actually charged to the card, same principle as Quick's `posCostPerSale`. For delivery, `grossPerUnit === netPerUnit` always (no tax layer exists there per §6.3), so the platform fee is simply `onlinePrice × platformFeeRate` — no VAT-inclusive/exclusive ambiguity to resolve, because there is no tax in that figure at all.

Three rules that must never be relaxed:

1. Delivery gross receives the platform fee **and nothing else** — no POS fee (there is no meal-card fee in this product at all).
2. Dine-in/takeaway fee bases are the sales-tax-inclusive gross, **never** the pre-tax net — using net would silently understate every card fee by the tax factor.
3. `platformFeeRate` may be `0` — the supported way to model own-phone/website delivery with no marketplace commission.

### 7.4 Contribution

```
unitContribution(p, c) = netPerUnit(p, c) − unitProductCost(p)
                         − unitChannelVariableCost(c) − unitPaymentPlatformFee(p, c)
```

May legitimately be negative for a channel (e.g., a low-priced item delivered by an expensive own courier). The engine reports it; it does not suppress it.

---

## 8. Monthly operating result

This is the **only** monthly aggregation in the engine. Every other output derives from it or feeds into it.

### 8.1 Quantity expansion

```
channelGross(p, c)         = channelQuantity(p, c) × grossPerUnit(p, c)
netRevenue(p, c)           = channelQuantity(p, c) × netPerUnit(p, c)
productCogs(p, c)          = channelQuantity(p, c) × unitProductCost(p)
channelVariableCost(p, c)  = channelQuantity(p, c) × unitChannelVariableCost(c)
paymentPlatformFee(p, c)   = channelQuantity(p, c) × unitPaymentPlatformFee(p, c)
contribution(p, c)         = channelQuantity(p, c) × unitContribution(p, c)
```

Each monthly total is the sum of its channel lines; every line is linear in quantity.

### 8.2 The result

```
monthlyOperatingResult = netRevenue
                       − ( productCogs + channelVariableCost + paymentPlatformFee )
                       − monthlyFixedCost
```

Equivalently (invariant I4):

```
monthlyOperatingResult = totalContribution − monthlyFixedCost
```

Scenarios, ramp-up and escalation are only ways of supplying the four multipliers (`quantityFactor`, `priceFactor`, `cogsFactor`, `fixedFactor`) this function accepts. Detailed publishes no margin ratios.

---

## 9. Fixed monthly cost model

All values below are multiplied by `fixedFactor` (§9.3). None depends on sales volume.

### 9.1 Payroll (UD-2)

```
positionMonthlyCost(i) = i.headcount × i.monthlyCostPerPerson
monthlyPayroll = Σ positionMonthlyCost(i)
```

One fully-loaded field per position — not TR's employer/meal/transport/bonus breakdown. The user enters the fully loaded cost directly; there is no gross-to-net payroll engine.

### 9.2 Owner / operator (UD-3)

```
monthlyOwnerCost = owner.monthlyDraw + owner.benefitsAllowance
```

Both are ordinary monthly operating costs, not payroll and not a computed self-employment tax.

### 9.3 Occupancy (US-2 — simpler than TR, no withholding at all)

```
rentCost = occupancy.monthlyRent
monthlyOccupancyCost = rentCost + occupancy.monthlyCAM
```

When `monthlyRent` is 0, `rentCost` is 0. There is no `rentInputBasis`, no withholding tax, no gross-up — those fields don't exist in this input contract at all (US-2), rather than existing and resolving to zero.

### 9.4 OPEX

```
monthlyOpex = Σ opexLines[i].monthlyAmount
```

Monthly average amounts only. No frequency, driver or recurrence logic.

### 9.5 Escalation factors

```
escalationFactor(annualRate, m) = (1 + annualRate) ^ ((m − 1) / 12)
```

| Factor | Rate | Applies to |
| --- | --- | --- |
| `priceFactor` | `salesPriceAnnualIncrease` | `normalPrice`, `onlinePrice` — and therefore every percentage fee computed on gross |
| `cogsFactor` | `productCogsAnnualIncrease` | `unitProductCost`, packaging, own-courier per order |
| `fixedFactor` | `fixedCostAnnualIncrease` | payroll, owner, occupancy, OPEX |
| — | — | CAPEX **never escalates** |

Month 1 exponent is 0, so projection month 1 always uses exactly the entered values.

### 9.6 Total

```
monthlyFixedCost = ( monthlyPayroll + monthlyOwnerCost
                   + monthlyOccupancyCost + monthlyOpex ) × fixedFactor
```

CAPEX is **not** part of fixed cost. No depreciation, no monthly recovery allocation.

---

## 10. CAPEX / initial investment

```
totalInitialInvestment = Σ capexItems[i].amount
```

Includes build-out, equipment, furniture, signage, opening stock, setup and custom items.

Three rules, unchanged from TR:

1. CAPEX **never** appears in a monthly projection row.
2. CAPEX **never** escalates.
3. CAPEX is excluded from operating break-even and is the target of payback — those are different questions, never mixed.

---

## 11. Scenarios and ramp-up

```
quantityFactor = scenarioMultiplier × rampUpMultiplier
scenarioMultiplier(k) = 1 + scenarioVolumeDeltas[k]
rampUpMultiplier(preset, m) = table lookup from §4.1
```

Ramp-up is always relative to the **scenario-adjusted** stabilized level; at 100% ramp-up the Bad scenario remains at 75% of the original stabilized quantity, never rebounding to 100%. Scenarios and ramp-up change **sales volume only** — prices, mixes, unit costs, commission rates, payroll, owner cost, rent, CAM, OPEX and CAPEX are identical across all three scenarios.

The **stabilized month** uses `rampUpMultiplier = 1` and all escalation factors `= 1` — the steady-state "what does this business earn per month" answer. **Projection month 1** carries the ramp-up multiplier (0.60 under `normal`) but no escalation. The two are different by design.

---

## 12. Projection, payback and break-even

### 12.1 Projection

For each scenario `k`, for `m = 1 … projectionHorizonMonths`:

```
row(m) = monthly result computed with
         quantityFactor = scenarioMultiplier(k) × rampUpMultiplier(preset, m)
         priceFactor    = escalationFactor(salesPriceAnnualIncrease, m)
         cogsFactor     = escalationFactor(productCogsAnnualIncrease, m)
         fixedFactor    = escalationFactor(fixedCostAnnualIncrease, m)
```

The horizon is 12, 24 or 36 — never a free number. No working-capital, settlement or daily-cash logic in a row.

### 12.2 Payback

```
cumulative(m) = Σ over 1…m of row(m).monthlyOperatingResult
paybackMonth  = first m where cumulative(m) ≥ totalInitialInvestment
```

Resolution order:

1. `totalInitialInvestment = 0` → `{ month: 0 }`.
2. Some `m` satisfies the condition → `{ month: m, cumulativeAtPayback }`.
3. No `m` satisfies it and the **stabilized** month's operating result is ≤ 0 → `unavailable`, reason `non_positive_operating_result`.
4. Otherwise → `unavailable`, reason `not_reached_within_horizon`.

### 12.3 Break-even

CAPEX is excluded — break-even answers the operating question only.

```
weightedContributionPerUnit = totalContribution / totalUnits     // from the base stabilized month, quantityFactor = 1, all escalation = 1

breakEvenUnitsPerMonth = monthlyFixedCost / weightedContributionPerUnit
breakEvenUnitsPerDay   = breakEvenUnitsPerMonth / operatingDaysPerMonth
```

Because scenarios scale every product's quantity proportionally and the channel mix is business-level, the mix is scenario-invariant — `weightedContributionPerUnit` and both break-even figures are **identical across all three scenarios** (invariant I7), not separately computed per scenario.

**Unavailable when:** `totalUnits = 0` → `no_sales_volume`; `weightedContributionPerUnit ≤ 0` → `non_positive_contribution`.

Break-even is expressed in **product units**, never customers or tickets.

---

## 13. Edge states

The engine never throws, never returns `NaN`, never returns `Infinity`.

| Condition | Behavior |
| --- | --- |
| All products' `dailyQuantity = 0` | Revenue and variable costs are 0; `monthlyOperatingResult = −monthlyFixedCost`; break-even `unavailable / no_sales_volume`. An **empty** product list never reaches here — rejected by validation |
| `weightedContributionPerUnit ≤ 0` | Break-even `unavailable / non_positive_contribution` |
| `totalInitialInvestment = 0` | Payback `{ month: 0 }` |
| Cumulative never reaches investment, stabilized result ≤ 0 | Payback `unavailable / non_positive_operating_result` |
| Cumulative never reaches investment, stabilized result > 0 | Payback `unavailable / not_reached_within_horizon` |
| `platformFeeRate = 0` | Platform fee is exactly 0; delivery still incurs COGS and channel variable costs |
| Mode `platformCourier` | `ownCourierPerOrder` is exactly 0; every other line unchanged |
| `monthlyRent = 0` | `rentCost` is 0 |
| A channel mix component is 0 | That channel contributes 0 everywhere; no division by it occurs |
| `channelMix.delivery = 0` | `delivery.mode` and `platformFeeRate` reach no figure: every delivery line is `0 × value = 0`. The mode is still reported in `meta.assumptions` |
| Any division with a 0 denominator | Guarded; the dependent output is `null` or `unavailable`, never `NaN` |

---

## 14. Output contract

`DetailedResult` carries exactly what this document defines — nothing more.

### 14.1 Top level

```
DetailedResult = {
  totalInitialInvestment: number
  breakEven: BreakEvenResult
  scenarios: { bad: ScenarioResult, base: ScenarioResult, good: ScenarioResult }
  meta: ResultMeta
}
```

### 14.2 Per scenario

```
ScenarioResult = {
  scenarioMultiplier: number
  stabilizedMonth: MonthResult
  projection: MonthResult[]          // length = projectionHorizonMonths
  payback: PaybackResult
}
```

### 14.3 Month result

```
MonthResult = {
  month: number | null               // null for the stabilized month
  quantityFactor, priceFactor, cogsFactor, fixedFactor: number
  totalUnits: number
  grossCustomerSales, salesTaxAmount, netRevenue: number
  productCogs, channelVariableCost, paymentPlatformFee: number
  totalVariableCost, totalContribution: number
  monthlyPayroll, monthlyOwnerCost, rentCost, monthlyOccupancyCost, monthlyOpex: number
  monthlyFixedCost: number
  monthlyOperatingResult: number
  byChannel: { dineIn: ChannelLine, takeaway: ChannelLine, delivery: ChannelLine }
  byProduct: ProductLine[]            // ordered as input.products — see §9
}

ChannelLine = { units, grossCustomerSales, netRevenue,
                productCogs, channelVariableCost, paymentPlatformFee, contribution }

ProductLine = { productId, name, units, grossCustomerSales, netRevenue,
                productCogs, channelVariableCost, paymentPlatformFee, contribution }
```

**Corrected.** This previously omitted `byProduct`/`ProductLine`, even though §9 already committed to per-product contribution as part of what Detailed provides. The engine implements it (same six figures as `ChannelLine`, summed across channels instead of across products, ordered as `input.products`) — this section now matches that rather than silently diverging from it.

No `rentPaidToLandlord` / `rentWithholdingTax` fields — they don't exist in this product.

### 14.4 Meta — mandatory assumption transparency

```
ResultMeta = {
  detailedEngineVersion: string
  currency: 'USD'
  revenueBasis: 'net'
  assumptions: {
    usState: string
    salesTaxRate, operatingDaysPerMonth: number
    projectionHorizonMonths: 12 | 24 | 36
    rampUpPreset: RampUpPreset
    scenarioVolumeDeltas: { bad, base, good }
    deliveryMode: DeliveryMode
    platformFeeRate, posCommissionRate: number
    salesPriceAnnualIncrease, productCogsAnnualIncrease, fixedCostAnnualIncrease: number
  }
}
```

The later UI must display the three annual escalation rates even when they are 0, same rule as TR — a 0% default is only acceptable while it is visible.

### 14.5 Result unions

```
BreakEvenResult = { available: true, weightedContributionPerUnit, unitsPerMonth, unitsPerDay }
                | { available: false, reason: 'no_sales_volume' | 'non_positive_contribution' }

PaybackResult   = { available: true, month: number, cumulativeAtPayback: number }
                | { available: false, reason: 'not_reached_within_horizon'
                                            | 'non_positive_operating_result' }
```

### 14.6 Rounding

**The engine performs no rounding anywhere.** Raw values are returned; all rounding happens in `lib/money.ts` and `lib/percent.ts`, `en-US` formatted. Quick's `simulateQuick` rounds its daily volumes; Detailed deliberately does not.

---

## 15. Calculation pipeline

### 15.1 Order

```
raw DetailedInput
  → validateDetailedInput            defaults applied · limits checked · mixes = 1 · errors returned
  → DetailedResolvedInput
  → buildUnitEconomics(input, priceFactor, cogsFactor)     per product × channel, per unit; volume-free (§7)
  → buildMonthlyFixedCosts(input, fixedFactor)             volume-independent; + totalInitialInvestment
  → calculateMonth(input, factors)                         channelQuantity × per-unit economics (§8);
                                                           THE single monthly aggregation
  → for each scenario:
        stabilizedMonth = calculateMonth(q = scenarioMultiplier, price/cogs/fixed = 1)
        projection[m]   = calculateMonth(q = scenarioMultiplier × rampUp(m), escalation factors at m)
        payback         = scan of cumulative monthlyOperatingResult vs totalInitialInvestment
  → breakEven = weighted contribution from the base stabilized month ÷ into monthlyFixedCost
  → DetailedResult
```

### 15.2 One home per formula

| Formula | Home |
| --- | --- |
| Channel price, per-unit gross/net/tax, unit COGS, unit channel variable cost, unit fee, unit contribution — **all volume-free** | `unitEconomics.ts` |
| Channel quantity expansion, monthly aggregation, projection loop, scenario assembly | `calculate.ts` |
| Payroll, owner, occupancy, OPEX, total CAPEX | `monthlyCosts.ts` |
| Ramp-up lookup, escalation factor, payback scan | `projection.ts` |
| Weighted contribution, break-even units | `breakEven.ts` |

Same acyclic import direction as TR: `calculate.ts → projection.ts`, never the reverse.

---

## 16. Invariants, golden example and test contract

### 16.1 Invariants

| # | Invariant |
| --- | --- |
| I1 | `grossCustomerSales = netRevenue + salesTaxAmount` |
| I2 | Σ `byChannel[*].grossCustomerSales` = `grossCustomerSales`; same for units, net revenue and each cost line |
| I3 | `monthlyOperatingResult = netRevenue − totalVariableCost − monthlyFixedCost` |
| I4 | `monthlyOperatingResult = totalContribution − monthlyFixedCost` |
| I5 | `totalUnits = Σ dailyQuantity × quantityFactor × operatingDaysPerMonth` |
| I6 | Running `calculateMonth` at exactly `breakEvenUnitsPerDay` yields `monthlyOperatingResult ≈ 0` |
| I7 | `breakEven` is identical across `bad`, `base` and `good` |
| I8 | Projection month 1 uses the exact entered prices and unit costs (escalation exponent 0) |
| I9 | No `NaN` and no `Infinity` anywhere in `DetailedResult` |
| I10 | No CAPEX amount appears in any `MonthResult` |
| I11 | `channelMix` and `paymentMix` each sum to 1 in every resolved input |
| I12 | For every product and channel, `line total = channelQuantity × corresponding per-unit value`, for gross, net, tax, each cost line and contribution |

(TR's I12, rent withholding, has no US equivalent — US-2 removed the concept entirely rather than giving it an identity to assert.)

### 16.2 Golden example

Computed and verified with a throwaway calculation script implementing exactly the formulas above — not hand-derived — to keep this table free of arithmetic error.

**Inputs** — California (`salesTaxRate` 0.0899, same rate as Quick's own worked example), operating days 30, escalation all 0%, horizon 24, ramp-up `normal`, delivery mode `platformOnly`:

| Group | Values |
| --- | --- |
| Products | Latte: normal $5.50, online $6.50, 220/day, cost $1.10 · Breakfast Sandwich: normal $8.50, online $10.00, 110/day, cost $2.80 |
| Channel mix | dineIn 0.50 · takeaway 0.20 · delivery 0.30 |
| Payment mix | cash 0.15 · card 0.85 |
| Rates | POS 3.5% · platform (platformOnly) 15% |
| Channel variable | takeaway packaging $0.30 · delivery packaging $0.60 · own courier $1.50 |
| Occupancy | rent $6,500 · CAM $450 |
| Positions | Barista × 3 — $3,800/month each, fully loaded |
| Owner | draw $4,000 + benefits allowance $600 |
| OPEX | $600 + $150 + $300 + $250 + $350 |
| CAPEX | $80,000 + $45,000 + $10,000 + $4,000 + $6,000 + $5,000 |

`directFeeRate = 0.85 × 0.035 = 0.02975`

**Base stabilized month, per channel line** (monthly):

| Product | Channel | Units | Gross | Net | Tax | COGS | Channel var. | Fee | Contribution |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Latte | dineIn | 3 300 | 19 781.685 | 18 150 | 1 631.685 | 3 630 | 0 | 588.505129 | 13 931.494871 |
| Latte | takeaway | 1 320 | 7 912.674 | 7 260 | 652.674 | 1 452 | 396 | 235.402052 | 5 176.597949 |
| Latte | delivery | 1 980 | 12 870 | 12 870 | 0 | 2 178 | 4 158 | 1 930.5 | 4 603.5 |
| Breakfast Sandwich | dineIn | 1 650 | 15 285.8475 | 14 025 | 1 260.8475 | 4 620 | 0 | 454.753963 | 8 950.246037 |
| Breakfast Sandwich | takeaway | 660 | 6 114.339 | 5 610 | 504.339 | 1 848 | 198 | 181.901585 | 3 382.098415 |
| Breakfast Sandwich | delivery | 990 | 9 900 | 9 900 | 0 | 2 772 | 2 079 | 1 485 | 3 564 |
| **Total** | | **9 900** | **71 864.5455** | **67 815** | **4 049.5455** | **16 500** | **6 831** | **4 876.062729** | **39 607.937271** |

Note: delivery lines always show `tax = 0` and `gross = net` — that's UD-1, not a rounding artifact.

**Base stabilized month, monthly:**

| Figure | Value |
| --- | --- |
| `totalUnits` | 9 900 |
| `grossCustomerSales` | 71 864.5455 |
| `salesTaxAmount` | 4 049.5455 |
| `netRevenue` | 67 815 |
| `productCogs` | 16 500 |
| `channelVariableCost` | 6 831 |
| `paymentPlatformFee` | 4 876.062729 |
| `totalVariableCost` | 28 207.062729 |
| `totalContribution` | 39 607.937271 |
| `monthlyPayroll` | 11 400 |
| `monthlyOwnerCost` | 4 600 |
| `rentCost` | 6 500 |
| `monthlyOccupancyCost` | 6 950 |
| `monthlyOpex` | 1 650 |
| `monthlyFixedCost` | 24 600 |
| **`monthlyOperatingResult`** | **15 007.937271** |

**Base stabilized month, `byProduct`** (summed across channels — §9, DF-84):

| Product | Units | Gross | Net | COGS | Channel var. | Fee | Contribution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latte | 6 600 | 40 564.359 | 38 280 | 7 260 | 4 554 | 2 754.407181 | 23 711.59282 |
| Breakfast Sandwich | 3 300 | 31 300.1865 | 29 535 | 9 240 | 2 277 | 2 121.655548 | 15 896.344452 |

**Break-even** (scenario-invariant):

```
weightedContributionPerUnit = 39 607.937271 / 9 900 = 4.000802
breakEvenUnitsPerMonth      = 24 600 / 4.000802       = 6 148.767565
breakEvenUnitsPerDay        = 204.958919
```

Round-trip check (I6): running the model at exactly 204.958919 units/day yields `monthlyOperatingResult = 0` exactly, confirming the formula chain is self-consistent.

**Payback**, `totalInitialInvestment = 150,000`:

| Scenario | Stabilized result | Payback month |
| --- | --- | --- |
| Bad (−25%) | 5 105.952954 | not reached within horizon — month 24 cumulative is 97 292.810874, short of $150,000 (`non_positive_operating_result` does **not** apply here — stabilized result is positive; this is the other branch, `not_reached_within_horizon`) |
| Base | 15 007.937271 | 13 (cumulative at payback 161 436.437847) |
| Good (+25%) | 24 909.921589 | 8 (cumulative at payback 157 195.939363) |

Base projection (ramp-up `normal`, no escalation): m1 −835.237637 (cum −835.237637) · m2 5 105.952954 (cum 4 270.715316) · m3 9 066.746681 (cum 13 337.461997) · m4 13 027.540408 (cum 26 365.002405) · m5 15 007.937271 (cum 41 372.939676) · **m13 cumulative 161 436.437847 ≥ 150 000**.

**Mode 2 sub-case** — switching `delivery.mode` to `platformCourier` (rate 30%, own courier forced to 0) changes **only** the two delivery lines:

| Product | Channel var. | Fee | Contribution |
| --- | --- | --- | --- |
| Latte delivery | 1 188 | 3 861.00 | 5 643.00 |
| Breakfast Sandwich delivery | 594 | 2 970.00 | 3 564.00 |

giving `monthlyOperatingResult = 16 047.437271` and `breakEvenUnitsPerDay = 199.717388`. Dine-in and takeaway lines are byte-identical to the Mode 1 table.

### 16.3 Test contract

Tier 1 must pass before any Detailed US UI work begins.

| Tier | # | Test | Asserts |
| --- | --- | --- | --- |
| 1 | T1 | Golden worked example | Every figure in §16.2, end to end |
| 1 | T2 | Break-even round-trip | I6 — feeding break-even units back yields ≈ 0 |
| 1 | T3 | Pre-tax revenue direction | `net = channelPrice` as entered; `net / (1 + rate)` never used; I1 |
| 1 | T4 | Delivery has no sales tax | UD-1 — `salesTaxPerUnit(p, 'delivery') = 0` and `grossPerUnit = netPerUnit` for every delivery line, regardless of `salesTaxRate` |
| 1 | T5 | Fee bases | POS fee on dine-in/takeaway computed on tax-inclusive gross, never on net; delivery platform fee computed on `onlinePrice` (no tax layer to strip) |
| 1 | T6 | No delivery double fee | Delivery gross receives zero POS fee |
| 1 | T7 | Own-courier conditional | Included in `platformOnly`, exactly 0 in `platformCourier`, no other line changed |
| 2 | T8 | Scenario × ramp-up order | 100 × 0.75 × 0.60 = 45; Bad at month 6 stays at 75% |
| 2 | T9 | Escalation month-1 identity | I8; month 13 = base × (1+r); channel variable costs follow the COGS rate; I10 |
| 2 | T10 | Payback | All four resolution branches of §12.2 |
| 3 | T11 | Zero and invalid edge cases | Every row of §13. An empty product list is rejected by validation; all-zero `dailyQuantity` is a valid input exercising the zero-sales edge behavior — two distinct tests |
| 3 | T12 | Non-finite sweep | I9 across the whole result tree on every edge input |
| 3 | T13 | Percentage mixes | I11; `mix_not_100` raised with the correct path; never normalized |
| 1 | T14 | Delivery mode requirement | Required at `channelMix.delivery > 0`; not required and inert at a 0 share; every figure identical across both modes at a 0 share |
| 2 | T15 | Approved zero defaults | Empty packaging resolves to 0; empty `monthlyCostPerPerson` resolves to 0, does not block, and contributes no payroll; the warn condition selects `headcount > 0` positions only |
| 3 | T16 | Structural guards | I2, I3, I4, I5, I7, I12; banned terminology absent from `core/detailed-us/`; result carries nothing beyond §14 |
| 1 | T17 | Per-product contribution | `byProduct` matches §16.2's table, ordered as `input.products`, summed across channels with the same six figures as `ChannelLine` |

Tests are colocated as `*.test.ts` under `src/core/detailed-us/`. No UI test suite.

---

## 17. Changelog

| Version | Change |
| --- | --- |
| v0.2 | Engine implemented in `core/detailed-us/` (194 tests passing). Corrected §14.3: `MonthResult` was missing `byProduct`/`ProductLine` even though §9 already committed to per-product contribution — the engine implements it (DF-84 pattern) and this section now matches. Golden vector's `byProduct` totals added to §16.2, verified against the same script as the rest of the table. |
| v0.1 | Initial specification — structural port of the TR Detailed Financial Specification with US-1 (pre-tax revenue direction reversed), UD-1 (delivery has no merchant sales tax), UD-2 (one fully-loaded cost per position), UD-3 (two-field owner section), UD-4 (0% platform fee default) applied. Rent withholding, meal-card payment method, and TR's dual POS default removed rather than zeroed. Currency-denominated limits rescaled for USD as a first pass (US-7, not yet researched). Golden vector computed and verified with a throwaway script, not by hand. |
