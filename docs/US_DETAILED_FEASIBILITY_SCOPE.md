# US Detailed Feasibility — Scope & Locked Decisions

**Version:** v0.1
**Status:** Decision log and scope for the US Detailed Feasibility product. This is **not** the financial specification (formulas, defaults, golden vector) and **not** an implementation order. No US Detailed engine or UI may be coded until explicitly requested — same rule as `US_PRODUCT_SCOPE.md` §0.
**Country:** United States · **Currency:** USD · **Preset:** Coffee Shop / Cafe
**Language:** English only, `en-US` number formatting — same as Quick, no exceptions for Detailed.
**Locked:** 2026-09-08 (product owner)

| If you need… | Read |
| --- | --- |
| Quick Calculation US formulas | `US_PRODUCT_SCOPE.md` |
| Detailed Feasibility US formulas/decisions | **this document** |
| Turkey Detailed decisions (for context only — does not apply here) | `git show main:docs/DETAILED_FEASIBILITY_DECISIONS.md` (not in this repo) |

---

## 0. Relationship to Quick

Detailed is **not a new financial model**. It is the same eight cost
categories Quick already locks — revenue/ticket, sales tax, product cost,
payroll, rent, other opex, POS/platform fees, CAPEX recovery — modeled at
finer granularity: per-product instead of one average ticket, per-channel
(dine-in / takeout / delivery) instead of one blended sales volume, per-position
instead of one headcount × cost line, plus a monthly projection with
scenarios and ramp-up.

Quick and Detailed stay **separate engines** (`core/quick-us/`,
`core/detailed-us/` when either is authorised). Neither imports the other's
business logic (architecture R5). They share the *principle* that tax is
added to a pre-tax price, and they share `data/us/salesTaxRates.ts` as data —
not formulas.

**US state selection is required in both modes.** Sales tax is a per-sale
add-on to revenue in either model; Detailed without a state would silently
under-report cost the same way Quick would.

---

## 1. Owner locks (2026-09-08) **[LOCKED]**

| ID | Decision | Lock |
| --- | --- | --- |
| **UD-1** | Delivery-channel sales tax | **Not added by the merchant.** Most US states require delivery marketplaces (DoorDash, Uber Eats, Grubhub) to collect and remit sales tax themselves under marketplace-facilitator laws. Dine-in and takeout channels still add `salesTaxRate` normally; delivery-channel revenue does not. v1 treats this uniformly across all states — no per-state override table yet (see §11). |
| **UD-2** | Personnel input shape | **One fully-loaded monthly cost per position**, not TR's four-field breakdown (employer cost + meal + transport + bonus). `positionMonthlyCost = headcount × monthlyCostPerPerson`, where `monthlyCostPerPerson` is wages + employer payroll taxes (including on reported tips) + workers' comp + benefits — the exact same definition as Quick's `averageEmployeeMonthlyCost` (`US_PRODUCT_SCOPE.md` §3.1). No meal/transport stipend fields; not standard US benefits structure. |
| **UD-3** | Owner section | **Two fields:** `ownerMonthlyDraw` (an economic allowance, not payroll, not necessarily deductible) and `ownerBenefitsAllowance` (a self-funded benefits/SE-tax provision the user enters themselves). Neither is a computed self-employment tax. Both are operating costs for feasibility purposes, same status as TR's owner section. |
| **UD-4** | Delivery platform fee default | **0%, strongly editable.** No built-in guess at DoorDash/Uber Eats/Grubhub commission rates. Same pattern as Quick's 0% sales-tax states: a real number the user must supply, never presented as a market rate. Resolves US-6 (`US_PRODUCT_SCOPE.md` §9) for v1. |

---

## 2. Inherited from Quick, unchanged **[LOCKED]**

These are already locked in `US_PRODUCT_SCOPE.md` and are **not** reopened
for Detailed — restated here so a Detailed spec doesn't silently reinvent
them:

1. **Pre-tax prices.** Every per-product price is pre-tax (US-1), not
   tax-inclusive like TR. Sales tax is computed and added, never netted out.
2. **No rent withholding.** `monthlyRentCost = monthlyRent` (US-2). No
   net/gross control, no stopaj-equivalent.
3. **No SE-tax / FICA calculator.** No LLC vs S-corp, no payroll-tax engine.
4. **State + DC sales tax table** (`US_PRODUCT_SCOPE.md` §5) is the single
   source; Detailed imports it, never restates it.
5. **POS default 3.5%**, one shared default across Quick and Detailed — not
   TR's two slightly different defaults (3.56% vs 3.59%) for the same fee.
6. **No double-counting POS on platform-collected revenue.** POS commission
   applies only to dine-in/takeout card payments the merchant itself
   processes. Delivery revenue uses `platformFeeRate` only — the platform's
   fee is the effective total deduction, not an addition to POS cost.
7. **No company/income tax engine, no depreciation, no full sales-tax
   filing/remittance engine.**
8. Forbidden names still apply: `depreciation`, `netProfit`.

---

## 3. Sales model

| Decision | Resolution |
| --- | --- |
| Sales unit | Product-based. User adds selling items: name, pre-tax price, expected daily quantity, unit product cost. No category grouping in v1. |
| Channels | **Dine-in, takeout, delivery** — direct map from TR's salon / al-götür / paket servis. One business-level channel mix, must total 100%. Not per-product. |
| Channel revenue | `qty × price` per channel, pre-tax. Sales tax added per UD-1 (dine-in/takeout only). |
| Payment methods (direct-store) | **Cash + card only.** No meal-card analogue (already dropped, `US_PRODUCT_SCOPE.md` §7). Applies to dine-in/takeout only — delivery is platform-collected, not part of the payment mix. |
| Delivery modes | Platform-only vs platform + own courier — same Mode 1 / Mode 2 split as TR. Own-courier variable payment per delivery order exists only in Mode 1. |
| Product COGS | Per-product unit cost × units sold. No COGS %, no waste/recipe costing (same as Quick's `variableCostPerSale`, §3.1 #8). |

---

## 4. Rent & occupancy

| Decision | Resolution |
| --- | --- |
| Rent | `monthlyRentCost = monthlyRent`, per §2. |
| CAM | Its own line item, entered once as an actual monthly charge — **not** invented as a percentage, **not** re-entered under generic OPEX. Direct port of TR's aidat treatment, US-labeled (`US_PRODUCT_SCOPE.md` §7 already calls this out). |

---

## 5. OPEX

Standard lines, ported from TR with English relabeling: utilities, security
(alarm/camera/surveillance), software (including POS software), bookkeeper /
accountant, cleaning, maintenance & repair, insurance, consumables, pest
control. Plus a custom "+ Add expense" line (name + average monthly amount)
for anything business-specific. Simple monthly amounts only — no
annual/quarterly/stepped recurrence logic.

---

## 6. CAPEX

Same categories as Quick's `initialCapex` definition, broken out: build-out,
equipment, furniture, signage, opening stock, setup/opening expenses, custom
items. Opening stock is explicitly included in the investment set, not
treated as a recurring cost.

---

## 7. Projection, scenario, ramp-up, escalation

Country-neutral mechanics, ported unchanged from TR:

- **Horizon:** presets only — 12 / 24 / 36 months, default 24. No free numeric input.
- **Ramp-up:** Slow / Normal / Fast presets, locked monthly % of scenario-adjusted stabilized quantity. Affects sales volume only, never prices or unit costs.
- **Scenarios:** Bad / Base / Good, editable defaults −25% / 0% / +25%, applied to sales volume before ramp-up. No per-input overrides.
- **Annual escalation:** three user-editable annual rates — sales price, product COGS (also covers channel variable costs, e.g. packaging), fixed opex. CAPEX does not escalate. Month 1 = entered values.

---

## 8. Break-even & payback

Ported unchanged from TR:

- **Break-even:** `fixed / weightedContributionPerSale`, reported in units/day and units/month. CAPEX excluded. Unreachable if contribution ≤ 0.
- **Payback:** cumulative projected operating profit vs. total CAPEX, first month the cumulative meets or exceeds the investment. Ramp-up affects it.

---

## 9. Product-level contribution

Derived report/UI output only, same as TR's DF-84: units, revenue, cost
lines, and contribution per product, summed across channels. No new
formula, no per-product channel mix, no category grouping.

---

## 10. Explicitly out of scope for v1 **[LOCKED]**

Direct port of Turkey Detailed's exclusions:

- Self-employment tax, FICA, or any payroll-tax calculator
- Company/income/franchise tax engine, profit-distribution withholding
- Full sales-tax accounting (input/output/payable/carry-forward/filing)
- Accounting depreciation or tax useful-life schedules
- Per-item or category-level tax/cost grouping
- Seasonality modeling
- Financing, working-capital, or supplier-credit timing
- Waste / spoilage / shrinkage modeling
- Per-state marketplace-facilitator override table (see §11)

---

## 11. Still open

| Topic | Notes |
| --- | --- |
| Per-state marketplace-facilitator nuance | UD-1 treats all states uniformly (delivery revenue never gets a merchant-added sales tax). If a state genuinely differs, or a threshold/exception matters, that is a future override table, same shape as `US_PRODUCT_SCOPE.md`'s NH/DC rows — not built now. |
| US Detailed golden vector | Computed once the financial spec (formulas, defaults, edge states) is written and the engine is authorised — same sequencing as Quick (`US_PRODUCT_SCOPE.md` §9, US-11). |
| Financial spec document | This document locks scope and shape. A `US_DETAILED_FINANCIAL_SPEC.md` (formulas, defaults, edge states, golden vector) is the next document once this scope is confirmed — not written yet. |

---

## 12. Changelog

| Version | What changed |
| --- | --- |
| v0.1 | Initial scope: owner locks UD-1…UD-4 (delivery sales tax, personnel field shape, owner section shape, platform fee default); inherited-from-Quick list; sales/rent/OPEX/CAPEX/projection/break-even sections ported from Turkey Detailed with US substitutions; exclusions restated; open items listed. |
