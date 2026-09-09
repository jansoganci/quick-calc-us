# Detailed Feasibility — Phase 5 Implementation Plan (Persistence, Charts, PDF Report)

**Status: Proposed. Not started — no code has been written from this plan.**

**Owns:** how the US Detailed Feasibility screen gets to the same experience the TR sibling app (maliyet.lol) already ships — autosaved drafts, three charts, a downloadable PDF report — plus the summary-pane/mobile-bar/result-table structure that experience depends on. Mechanism choices, file layout, task order, verification.

**Does not own:** any financial formula (`docs/US_DETAILED_FINANCIAL_SPEC.md` — untouched by this plan, `core/detailed-us/**` is not modified by any task here), the input scope or locked decisions (`docs/US_DETAILED_FEASIBILITY_SCOPE.md`), persistence/stack rules (`docs/TECH_STACK_AND_CONSTRAINTS.md` — this plan implements §4.2, it does not change it), layer boundaries (`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`), or the locked visual direction (`docs/DESIGN_DIRECTION.md`).

**Companion documents:**

| Document | Owns | Relationship to this plan |
| --- | --- | --- |
| `docs/US_DETAILED_FINANCIAL_SPEC.md` | Formulas, defaults, output contract, engine version | Source of every figure this plan presents. No new figure, no new formula. |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2 | Detailed Feasibility persistence: `localStorage`, JSON export/import approved-not-built, no cloud sync | Already authorizes the autosave work in §3 below. This plan does not re-litigate the decision, only implements it. |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` §2–§6 | Folder structure, dependency direction, reuse rules | Governs where every new file in §6 goes. |
| `docs/DESIGN_DIRECTION.md` | Locked visual direction (tokens, spacing, control anatomy) | Its V-numbers are structural and reusable; its Turkish-specific clauses (V4's diacritic note, V11's language lock) do not apply here — this product is English/USD, already the case since Phase 1. |
| **TR sibling app (`maliyet.lol`), commit history on `main`** | The reference implementation for everything in this plan | Every mechanism below (print CSS, custom SVG charts, the autosave codec, the summary pane) is **already built, shipped and verified there**. This plan ports it, it does not invent it. Cited inline as `TR: <path>`. |

---

## 1. Why this plan exists

Phase 4 shipped a working Detailed Feasibility UI, but a **leaner one** than the TR sibling app's: a two-column form/result layout with no autosave, no charts, no PDF, and no summary pane. That was a deliberate scope call made without your sign-off. You've now confirmed the target is the **full TR experience**, ported to US data (USD, English, US tax/labor fields), not a reduced version. This plan is the roadmap for that port.

**Nothing here is a redesign.** Every visual decision below is copied from a component that already exists and is already screenshotted-and-shipped on the TR side. Where a genuinely new design decision would be needed, it is called out explicitly in §11 as a question for you, per your instruction not to design unilaterally.

---

## 2. Current state (verified against this repo and TR's `main`)

| Area | This repo (US, Phase 4) | TR (`main`) |
| --- | --- | --- |
| Engine | `core/detailed-us/` — complete. `ScenarioResult.projection: MonthResult[]` already holds the full month-by-month series per scenario | Same shape, `core/detailed/` |
| Layout | Two-column: `DetailedForm` (accordion, left) + `DetailedResults` (sticky, right). No summary pane, no mobile bar | `DetailedForm` (left) + `SummaryPane` (sticky right, condensed) + full-width `DetailedResults` below + `MobileSummaryBar` (fixed footer) |
| Result content | `byChannel` / `byProduct` tables only, as plain grids | Reconciliation bar (`ResultBar`), scenario table, channel table, product table, month-by-month table, assumptions list — six blocks |
| Charts | None | `ProjectionChart`, `PaybackChart` — custom inline SVG, no library |
| Persistence | None — a reload loses everything | `localStorage` autosave, debounced, restored on load |
| PDF / report | None | Browser print CSS → "Save as PDF", no library, no backend |
| `tailwind.config.ts` | Default `lg` breakpoint (1024px only) | `lg` redefined as `{ raw: 'screen and (min-width: 1024px), print' }` — the mechanism that makes one desktop-width layout serve as both the screen and the print layout |
| `index.css` print rules | None | `@page`, `@media print`, `.qc-print-only` / `.qc-screen-only`, break-control rules |
| `.qc-dialog` CSS | **Already present**, unused | Same styling, used by `ReportNameDialog` |
| Dependencies | React, Vite, TS, Tailwind, daisyUI — nothing else | Same. No chart, PDF, date or dialog library anywhere |

**The one-line summary: nothing here requires a new dependency or an engine change.** Every mechanism is either already in this repo (the dialog CSS, the full monthly projection array) or is plain browser/React capability (print, SVG, `localStorage`).

---

## 3. Decisions carried in from TR, unchanged

These are not proposals — they are already-locked, already-verified choices from the shipped TR product and from `docs/TECH_STACK_AND_CONSTRAINTS.md`. Re-litigating them would be redoing settled work for no reason.

- **No backend, no new dependency, no new Cloudflare product** for any of the three features (`TECH_STACK_AND_CONSTRAINTS.md` §2.2, §5 — LOCKED).
- **PDF mechanism: browser print CSS → "Save as PDF".** Not jsPDF/pdf-lib, not rasterization (html2canvas), not a backend renderer. TR's own re-validation (see its archived `docs/archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md` §10) found no requirement a library would satisfy that print CSS does not — selectable/searchable text, vector charts, one shared formatting system, zero payload cost. That analysis is currency-and-language-independent; it applies here unchanged.
- **Persistence mechanism: `localStorage`, single autosaved draft**, per `TECH_STACK_AND_CONSTRAINTS.md` §4.2. JSON export/import is approved by that section but **not built** in TR either — deferred, per §9 below.
- **Charts: hand-drawn inline SVG**, no charting library. The geometry module (`chartGeometry.ts`) is pure pixel arithmetic — it computes no financial figure.
- **The report never recomputes and never reformats.** It presents the same `DetailedView` the screen renders, through the same `lib/money.ts` / `lib/number.ts` / `lib/percent.ts` formatters. `core/detailed-us/**` is untouched by this plan.
- **Business name is report metadata, not a form field.** It lives in report-scope React state, is asked for in a modal at report time, and never reaches `toInput.ts` or the engine. (TR's plan tried an in-form field first and walked it back for exactly the reason CLAUDE.md §3/§6 would reject it here too — see TR plan §3.3.)
- **The native `<dialog>` element** is the report name dialog's implementation — focus trap, `Esc`, backdrop, all from the platform. This repo already carries the CSS for it (`.qc-dialog` in `index.css`), unused since Phase 0.
- **`tailwind.config.ts`'s `lg` breakpoint becomes a `raw` screen matching print too.** This is the single change that makes the existing desktop-width layout serve as the print layout, with no per-component `print:` class duplication.

---

## 4. Decisions that need to be made for the US version specifically

TR's plan made several calls that were about **Turkish** content; those need US-equivalent answers, not the same answer:

| TR decision | US equivalent |
| --- | --- |
| Report/UI copy in Turkish | English, matching the register already used in `features/detailed/labels.ts` and `features/quick-calc/labels.ts` |
| `tr-TR` number/currency formatting | Already `en-US`/USD via `lib/money.ts`, `lib/number.ts`, `lib/percent.ts` — no new formatter, same as TR's "free under print CSS" finding |
| Disclaimer text (six Turkish paragraphs, Turkish legal register: "muhasebe, vergi, yatırım veya hukuk danışmanlığı yerine geçmez") | English disclaimer covering the same six points (not accounting/tax/investment/legal advice, projections are estimates, provider accepts no liability for decisions made from it) — **drafted in §8.4 below, marked as copy for your review, not legal advice**, same caveat TR attached to its own draft |
| Appendix groups: products, channels, payments, **delivery**, positions, **owner**, occupancy, opex, capex | Same nine groups, US field names: no `mealCard`/VAT/rent-withholding rows (US-2, UD-2, UD-3 already exclude these from the engine); owner section shows `monthlyDraw` + `benefitsAllowance` instead of `bağkur`; positions show one `monthlyCostPerPerson` line instead of TR's four-part breakdown (UD-2) |
| `Fizibilite Raporu — {ad} — {tarih}` filename | `Feasibility Report — {business name} — {YYYY-MM-DD}` |
| Report cover figures: verdict sentence, monthly result, break-even, payback, initial investment, guardrails | Identical structure — this repo's `resultView.ts`/`viewModel.ts` (Phase 4) already computes a `headline`-equivalent sentence and all four figures; §7 below shows exactly what needs restructuring into the TR-shaped `DetailedView` |
| TR's `mealCardCommissionRate`, `rentWithholdingRate`, `vatRate` rows in the assumptions block | Dropped. US assumptions block shows: `salesTaxRate`, `operatingDaysPerMonth`, `projectionHorizonMonths`, `rampUpPreset`, `scenarioVolumeDeltas`, delivery mode + `platformFeeRate` (delivery-share-gated, same as TR), `posCommissionRate`, the three annual escalation rates, engine version |

No other product decision is open. Everything else in this document is mechanical porting.

---

## 5. What this plan does **not** propose designing

Per your instruction: this plan reuses TR's already-shipped visual design — colors, spacing, type ramp, control anatomy, dialog anatomy, chart geometry, table treatment — exactly as recorded in TR's own design-pass notes (`docs/archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md` §7, ported here in §8). It changes only: language (English), currency/number formatting (already done, USD/`en-US`), and field content (US inputs). If, once this is built, you want the US Detailed screen to look **different** from TR's — not just "translated" — that is a new design decision and goes through a Claude Design pass first, same as TR's own report work did (its canvas is linked in its plan §7). Nothing in this plan starts that pass; flag it explicitly if you want it.

---

## 6. Architecture and file plan

No new layer, no new dependency-direction change. This is additive within `src/features/detailed/`, plus the two project-wide files every `print:`/`lg:` rule depends on.

```
formState ──toInput──▶ DetailedInput ──validate──▶ DetailedResolvedInput
                                                        │
                                             calculateDetailed   (UNCHANGED — core/detailed-us/** untouched)
                                                        │
                                                  DetailedResult
                                                        │
                                     buildDetailedView(result)  ← already exists (Phase 4), gains report/chart fields
                                                        │
                                                  DetailedView
                        ┌───────────────┬───────────────┼───────────────┬────────────────┐
                        │               │               │               │                │
                SummaryPane    DetailedResults    charts (2 new)   reportInputs (new) businessName
                (NEW)          (restructured)     ProjectionChart/                   (report-scope state,
                                                   PaybackChart                       NEVER in DetailedFormState)
                                                                         │                  │
                                                                 ReportAppendix        ReportCover
                                                                 (print-only, NEW)     (print-only, NEW)
                                                                                            │
                                                                                     useReportPrint ──▶ document.title
                                                                                            │           ──▶ PDF filename
                                                                                     window.print()

form (autosaved) ──▶ storage.ts (codec, pure) ──▶ hooks/draftStorage.ts (localStorage) ──▶ hooks/draftAutosave.ts (debounce)
```

### 6.1 New files

```
src/features/detailed/
  storage.ts                     NEW   draft codec: DetailedFormState <-> JSON, no DOM              §9
  storage.test.ts                NEW   codec round-trip, corrupt/foreign-shape rejection             §9
  reportView.ts                  NEW   DetailedResolvedInput -> appendix groups, pure, no DOM         §8.2
  reportView.test.ts             NEW   coverage, totals-equal-engine-field, English/USD conformance   §8.2, §10
  reportGuards.test.ts           NEW   "report formats nothing itself", "report calls no engine fn"   §10
  hooks/
    draftStorage.ts              NEW   the only place touching window.localStorage                   §9
    draftAutosave.ts             NEW   debounce queue + pagehide/visibilitychange flush               §9
    useReportPrint.ts            NEW   title swap, DOM-settle, window.print()                         §8.3
  components/
    ProjectionChart.tsx          NEW   ported from TR, palette/geometry unchanged                     §8.1
    PaybackChart.tsx             NEW   ported from TR                                                 §8.1
    SankeyBreakdown.tsx          NEW   ported from TR (supplementary breakdown visual)                §8.1
    chartGeometry.ts             NEW   ported from TR verbatim (visual-only pixel arithmetic)         §8.1
    ResultBar.tsx                NEW   reconciliation bar — ported from TR, one new US breakdown key  §7.2
    ScenarioTable.tsx            NEW   ported from TR                                                 §7.3
    ChannelTable.tsx             NEW   ported from TR, using existing byChannel data                  §7.3
    ProductContributionTable.tsx NEW   ported from TR, using existing byProduct data                  §7.3
    MonthTable.tsx               NEW   real <table>, always mounted (print needs it in the DOM)       §7.3
    AssumptionsList.tsx          NEW   ported from TR, collapsed below `lg`                            §7.3
    SummaryPane.tsx              NEW   ported from TR — the persistent decision summary                §7.1
    MobileSummaryBar.tsx         NEW   ported from TR — fixed footer, mobile only                      §7.1
    DraftNotice.tsx              NEW   "saved on this device" + reset control                          §9
    ReportCover.tsx              NEW   print-only page 1                                               §8.3
    ReportAppendix.tsx           NEW   print-only inputs appendix + disclaimer                         §8.2, §8.4
    ReportActionButton.tsx       NEW   the trigger, two call sites (pane + results)                    §8.3
    ReportNameDialog.tsx         NEW   native <dialog>, reuses existing .qc-dialog CSS                 §8.3
src/app/
  index.css                     ±     @page, @media print, .qc-print-only/.qc-screen-only,            §7.4, §9
                                       break-control rules, print color-adjust on ResultBar
  AppShell.tsx                  ±     print:hidden on masthead/mode-row/footer                        §7.4
tailwind.config.ts               ±     lg screen raw definition (print + min-width:1024px)             §7.4
```

### 6.2 Revised files

```
src/features/detailed/
  formState.ts                  ±   nothing structural — storage.ts's codec validates this exact shape
  labels.ts                     ±   + REPORT_COPY, GUARDRAIL/VERDICT-equivalent copy, draft copy,
                                     BREAKDOWN_LABELS, SECTION_ECHO_LABELS, disclaimer text (§4, §8.4)
  resultView.ts                 ±   + buildBreakdown (reconciliation bar), buildProjection,
                                     buildPaybackChart, buildMonthRows, buildAssumptionRows —
                                     all read-only shaping of MonthResult/DetailedResult already
                                     in hand; no new engine call
  viewModel.ts                  ±   DetailedView gains: breakdown, scenarios (row form), projection,
                                     paybackChart, monthRows, assumptions, reportInputs, engineVersion,
                                     hasDelivery — additive fields, existing fields unchanged
  hooks/useDetailedCalc.ts      ±   + businessName state, + draft load/save wiring, + showMonthTable
                                     toggle (report ignores the toggle, always renders the table)
  components/DetailedForm.tsx   ±   unchanged section content; add DraftNotice at the foot,
                                     SampleFillControl optional (§9 note)
  components/DetailedResults.tsx ±  becomes the ordered assembly of: ResultBar, ScenarioTable,
                                     ProjectionChart + MonthTable, PaybackChart, ChannelTable,
                                     ProductContributionTable, AssumptionsList — replaces the
                                     current ad hoc byChannel/byProduct-only rendering
  DetailedFeasibilityPage.tsx    ±  restructured to TR's shape: ReportCover (print-only, above
                                     <main>) → <main className="qc-screen-only"> holding
                                     DetailedForm + SummaryPane → results region (full width,
                                     screen + print) → ReportAppendix (print-only) →
                                     ReportNameDialog → MobileSummaryBar
src/core/detailed-us/index.ts   —   NOT touched by this plan
```

**Nothing under `core/detailed-us/**` is on this list.** Every task in this plan is `features/`, `app/`, or config.

---

## 7. Restructuring the result screen (prerequisite for both charts and the report)

The charts and the report render sections that don't exist yet in this repo's result screen (a reconciliation bar, a scenario table, a month-by-month table, an assumptions block). This has to land before §8 and before the two charts, or there is nothing for them to sit inside.

### 7.1 Summary pane + mobile bar

Port `SummaryPane.tsx` and `MobileSummaryBar.tsx` from TR verbatim in structure (`TR: src/features/detailed/components/SummaryPane.tsx`, `MobileSummaryBar.tsx`), substituting:
- Turkish labels → this repo's existing `COPY` keys where they already match (`COPY.calculate`, `COPY.copySummary`, `COPY.breakEven`, `COPY.payback`, `COPY.totalInitialInvestment`), new keys where TR has no US equivalent yet (`COPY.baseScenario`, `COPY.preparation`, `COPY.allResults`, `COPY.backToInputs`, `COPY.results`, `COPY.optionalSectionsNote`, `COPY.scenariosMonthlyResult`, `COPY.warningsTitle`, `COPY.warningCount`, `COPY.goToSection`).
- TR's `sectionSummary.ts` (the "girildi" / "%100" / "—" stand-ins a section header shows before Calculate) ports as `sectionSummary.ts` in this repo, keyed to this repo's own `SectionId` union (`jurisdiction`, `products`, `channels`, `payments`, `delivery`, `positions`, `owner`, `occupancy`, `opex`, `capex`, `assumptions`) instead of TR's ten.

This becomes the page's persistent right-hand column, replacing Phase 4's `DetailedResults`-in-the-sticky-column approach. `DetailedResults` moves to a full-width region below `<main>`, exactly as TR does it — this is what lets the seven-column `ChannelTable` and the month table breathe at `lg` width instead of being squeezed into a 372px sidebar.

### 7.2 Reconciliation bar

Port `ResultBar.tsx` (`TR: components/ResultBar.tsx`) with one change to the breakdown key set. TR's nine categories are `vat, productCogs, channelVariableCost, paymentPlatformFee, payroll, owner, occupancy, opex, operatingResult`. This repo's engine has no VAT (US-1: sales tax is added on top, not netted from a VAT-inclusive price) — the equivalent gross-to-result reconciliation here is:

```
salesTax, productCogs, channelVariableCost, paymentPlatformFee, payroll, owner, occupancy, opex, operatingResult
```

reading off `MonthResult.salesTaxAmount` in place of TR's `vatAmount` — same identity (`grossCustomerSales = salesTaxAmount + productCogs + channelVariableCost + paymentPlatformFee + payroll + owner + occupancy + opex + operatingResult`), already true by construction in `calculate.ts`. `tailwind.config.ts`'s bar-color tokens (`bar-vat`, `bar-variable`, `bar-payroll`, `bar-rent`, `bar-other-opex`, `bar-pos`, `bar-investment-recovery`, `bar-remaining`) already exist in this repo from Phase 0 — reuse them; only the key→token mapping in `resultView.ts` needs writing (TR: `BREAKDOWN_COLORS` / `BREAKDOWN_FILL_VARS` in `resultView.ts`).

The print color-adjust fix (TR's `.qc-print-ink` — `print-color-adjust: exact` scoped to the bar segments only) is a one-class CSS addition, not new logic.

### 7.3 Tables

`ScenarioTable`, `ChannelTable`, `ProductContributionTable`, `MonthTable`, `AssumptionsList` port from TR near-verbatim — all five consume data this repo's engine already produces (`byChannel`, `byProduct`, `ScenarioResult.projection`, `ResultAssumptions`). One difference from TR's own history: TR built these as CSS grids first and only later converted `MonthTable` to a real `<table>` for print (its own T-06). This repo should **build `MonthTable` as a real `<table>` from the start** — there is no reason to repeat TR's rework, and print's header-repeat (`thead { display: table-header-group }`) needs it regardless.

### 7.4 The print breakpoint and print reset

Two small, foundational changes, done first because everything else in §8 renders through them:

```ts
// tailwind.config.ts
screens: { lg: { raw: 'screen and (min-width: 1024px), print' } }
```

```css
/* src/app/index.css */
@page { size: A4 portrait; margin: 14mm 12mm; }

@media print {
  html, body { background: #fff; }
  .qc-enter, .qc-live { animation: none !important; }
  [class*="sticky"], [class*="fixed"] { position: static !important; }
  a[href]::after { content: none; }
  h1, h2, h3 { break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
}
```

plus `.qc-print-only` / `.qc-screen-only` (TR's exact pair — see TR `index.css` around its print block) so an element can be pinned to exactly one medium without depending on which of two Tailwind media blocks wins. `AppShell.tsx`'s masthead, the `ModeRow` switcher, and the footer get `qc-screen-only`; `<main>` (form + summary pane) gets it too, so the two-column grid disappears from print in one rule rather than needing every child fixed individually.

**Risk carried in from TR verbatim:** a `raw` screen generates no `max-lg:` variant. Nothing in this repo uses `max-lg:` today (same as TR found for its own tree) — `reportGuards.test.ts` asserts this stays true, same as TR's own guard.

---

## 8. The three requested features

### 8.1 Charts

Port `chartGeometry.ts`, `ProjectionChart.tsx`, `PaybackChart.tsx` from TR **verbatim** — the geometry is currency-and-language-neutral pixel arithmetic; only the money labels it draws change from `formatTry` to `formatUsd` (this repo's existing `lib/money.ts` export). `SankeyBreakdown.tsx` (the supplementary single-source fan-out of the same reconciliation categories) ports the same way, reading `fillVar` tokens from the same `--qc-bar-*` custom properties §7.2 wires up.

Three charts, matching your ask exactly:
1. **`ProjectionChart`** — monthly operating result across the projection horizon, three scenario lines (bad/base/good), base emphasized.
2. **`PaybackChart`** — cumulative base-scenario operating result against the total-initial-investment line, with a marker at the payback month.
3. **`SankeyBreakdown`** — the same nine reconciliation categories as the bar (§7.2), as a single-source-to-nine-targets flow diagram; supplementary to the bar, never a replacement for it (same rule TR states in its own component comment).

No chart is print-only or screen-only by default; TR's `print`/`printPayback` chart frames (larger label size for the ~704px page area) are ported into `CHART_FRAMES` alongside `sm`/`lg` — this is a data addition to an already-parameterized module, not new geometry logic.

### 8.2 Report view model (the appendix data)

Port `reportView.ts`'s shape (`ReportInputRow`, `ReportInputTable`, `ReportInputGroup`, `buildReportInputGroups`) with the nine US-shaped groups from §4's table above (no VAT/meal-card/rent-withholding rows; positions show one cost line; owner shows `monthlyDraw` + `benefitsAllowance`). Wired into `viewModel.ts`'s existing `buildDetailedView(result)` exactly the way TR wires it into its `buildView(result, input)` — this repo's `buildDetailedView` needs the same second argument (`DetailedResolvedInput`) it does not currently take, since the appendix needs resolved input values the `DetailedResult` alone doesn't carry (product names, position names, line names — none of these are result output).

**Hard rule carried in from TR (§4.6 in its frontend spec, same principle applies here even without a numbered rule):** the appendix restates inputs and engine-published totals; it never derives a figure. No per-row computation, no group total not already published by the engine (`monthlyPayroll`, `monthlyOwnerCost`, `monthlyOccupancyCost`, `monthlyOpex`, `result.totalInitialInvestment` — all already on `MonthResult`/`DetailedResult`).

### 8.3 PDF report — mechanism and flow

Exactly TR's L3-locked flow, unchanged in shape:

1. Once `calc.view !== null` (after Calculate), a `ReportActionButton` appears — foot of `SummaryPane` on desktop, end of the results region on mobile. Outlined, never the filled accent (accent stays reserved for Calculate and the headline figure, per `DESIGN_DIRECTION` V2).
2. Clicking it opens `ReportNameDialog` — a native `<dialog>` using this repo's **already-existing** `.qc-dialog` CSS. One field: business name. The download/generate button stays disabled until `name.trim().length > 0` — no error state is needed, because a disabled button cannot be submitted invalid.
3. Submitting closes the dialog, then — in a `useEffect`, **after** the DOM has committed the dialog's removal (TR's F14 finding: `window.print()` is synchronous and would otherwise print the dialog on top of the report) — sets `document.title` to `Feasibility Report — {name} — {YYYY-MM-DD}` and calls `window.print()`. The title is restored on `afterprint` and in a `finally`, so a cancelled dialog never leaves the tab renamed.
4. `ReportCover.tsx` renders print-only, above `<main>`, so it becomes page 1: business name, date, the verdict sentence, one headline figure (monthly operating result), three secondary figures (break-even, payback, total initial investment) in a hairline-divided row, guardrails if any, a short disclaimer, a colophon line.
5. `ReportAppendix.tsx` renders print-only, `break-before: page`, after the on-screen results: the nine input groups from §8.2, then the full six-point disclaimer (§8.4) with an engine-version/date/currency meta line.

### 8.4 Disclaimer copy (draft — for your review, not legal advice, exactly as TR flagged its own draft)

**Short form — cover foot:**

> This report is a preliminary feasibility estimate based on the data entered and the assumptions listed in this report. Projections are estimates and carry no guarantee of realization; this report is not accounting, tax, investment, or legal advice. See **Appendix B — Scope and limitations** for the full statement.

**Full form — Appendix B (six paragraphs, matching TR's six points):**

1. This document is a preliminary feasibility estimate; it is not an audited financial statement, a valuation report, or an independent audit report.
2. Every calculation is based on the data the user entered and the assumptions listed in this report's "Assumptions" section. Results change when the inputs change.
3. Projections, scenarios, and charts are estimates; they carry no commitment of realization.
4. Actual commercial, tax, operational, and financial outcomes may differ from those shown here, depending on demand, cost, regulatory, and market conditions.
5. This report is not accounting, tax, investment, legal, or financial advisory services and does not substitute for them. Consulting the relevant professionals before a decision is recommended.
6. [Product name] cannot be held responsible for the outcomes of decisions made based solely on this report.

Followed by a mono meta line: `Calculation engine {version} · Report date {date} · USD · United States`.

### 8.5 Persistence (autosave)

Port `storage.ts` (pure codec, no DOM — this repo's `tsconfig.json` already excludes `features/**/hooks/**` from the no-DOM build the same way TR's does, confirmed in §2), `hooks/draftStorage.ts` (the only file touching `window.localStorage`), `hooks/draftAutosave.ts` (500ms debounce queue + `pagehide`/`visibilitychange` flush for mobile reliability), and `DraftNotice.tsx` (the "saved on this device" line + a two-step inline reset — no `window.confirm()`, matching this repo's already-established no-native-dialog-for-confirmation pattern from `QuickCalcForm`... actually this repo has no such precedent yet; it is TR's `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A8 rule, carried in here as the same rule).

**Storage key:** `quickcalc.detailed.draft.v1` (this repo's own namespace — not TR's `maliyet.detailed.draft.v1`; the two products must never collide even if ever served from a shared domain, which they are not, but the naming convention is free and there is no reason to reuse TR's literal key).

**What's stored:** the form (`DetailedFormState`, this repo's own field shapes — `usState`, `salesTaxRate`, `products`, `channelMix{dineIn,takeaway,delivery}`, `paymentMix{cash,card}`, `posCommissionRate`, `delivery{mode,platformFeeRate,ownCourierCostPerDeliveryOrder}`, `packaging`, `positions{id,name,headcount,monthlyCostPerPerson}`, `owner{monthlyDraw,benefitsAllowance}`, `occupancy{monthlyRent,monthlyCAM}`, `opexLines`, `capexItems`, `assumptions{...}`) plus `businessName`, beside it, never inside it — same separation TR keeps, for the same reason (the name is report metadata, and letting it into `DetailedFormState` would put document metadata on the calculation path).

**What's never stored:** the calculated result. `DESIGN_DIRECTION` V6 (locked, already enforced in this repo's Phase 2 and Phase 4 work) says no result appears before Calculate — a returning visitor has not pressed it yet, so `hasCalculated` and `view` stay at their fresh-load defaults regardless of a restored draft.

**Corrupt-draft handling:** whole-payload validation, same as TR — anything not matching the exact expected shape (wrong version, missing field, wrong type) rejects the entire draft rather than attempting a partial repair. A discarded draft costs a blank form; a partially-repaired one risks a figure the user never actually entered.

---

## 9. Explicitly deferred (same reasoning TR recorded for its own v1)

| Item | Why deferred |
| --- | --- |
| JSON export / import | Approved by `TECH_STACK_AND_CONSTRAINTS.md` §4.2 but not built on the TR side either — a save-file is only useful to someone who already has a scenario manager to load it into |
| Named multi-scenario storage | Same section approves it; no confirmed need yet |
| `SampleFillControl` ("fill with example") | TR onboarding nicety, not one of the three things you asked for. Trivial to add later if wanted — flagging rather than including by default |
| CSS page numbers / running footer | No Chromium/WebKit support exists for this; the only alternative is the rejected PDF-library route |
| A4 landscape | Portrait fits the content at the forced `lg` width; landscape buys nothing and risks orientation-support inconsistency |
| Emailing/sharing the report from the app | Requires a backend — excluded by `TECH_STACK_AND_CONSTRAINTS.md` §5 |
| Editable report sections, custom notes, executive summary | New inputs with no confirmed reader; not asked for |
| A report for Quick Calculation | Out of scope; `Copy summary` remains its answer |

---

## 10. Test / verification plan

Extends the existing suite; no new test dependency, same `node` Vitest environment for everything DOM-free.

| Test | Asserts |
| --- | --- |
| `storage.test.ts` | Encode/decode round-trip; a corrupt, foreign-version, or wrong-shape payload decodes to `null`, never throws, never partially repairs |
| `reportView.test.ts` — coverage | Every field of `DetailedResolvedInput` is rendered in a group or named in an explicit omission list |
| `reportView.test.ts` — totals | Each group total equals the engine field it cites; none is summed in the builder |
| `reportView.test.ts` — conditionals | Delivery group absent when `channelMix.delivery === 0`; empty collections drop their group |
| `reportView.test.ts` — formatting | `en-US`/USD formatting via the existing formatters — no report-specific number formatting |
| `reportGuards.test.ts` | No `Intl.NumberFormat`/`toFixed`/`toLocaleString` in report modules; report modules import no `calculateDetailed`/`validateDetailedInput`; no `max-lg:` utility anywhere in `src/` |
| Existing suites | `calculate.test.ts` and the golden vector unchanged — no task in this plan touches `core/detailed-us/**` |
| Commands | `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build` clean at every step |

**Manual matrix** (mirrors TR's, same platforms): Chrome/Safari/Firefox desktop print-to-PDF, iOS Safari and Android Chrome print flow, dialog focus/`Esc`/backdrop behavior, dialog absent from the printed output, filename correctness, chart legibility and no page-split, month table header repeats on a 36-month horizon, no orphaned headings, draft survives a reload and a browser restart, draft survives clearing everything except storage (private-browsing/quota-exhausted `localStorage` throws are caught — the calculator keeps working with no persistence rather than crashing).

---

## 11. Open questions for you

Two, both flagged rather than decided silently — same discipline TR's own plan used.

1. **Does the US disclaimer wording in §8.4 read right to you**, or does it need a pass by someone who'd actually show this to a bank/lender? It covers the same six points TR's does, in the same professional-not-defensive register, but it is a translation-and-adaptation draft, not reviewed legal copy.
2. **`SampleFillControl`** (§9): include it in this phase, or leave it deferred? It's small (TR's version is ~50 lines) but it's not one of the three things you named, so it's left out of the default scope pending your call.

Nothing else blocks starting work.

---

## 12. Implementation order

Ordered so no task rebuilds another's output — ports the logic of TR's own sequencing (its plan §15), reordered where this repo's starting point differs (no existing grid-based tables to convert; they're built as real tables from day one, so there's no separate "convert to table" step).

| Step | Task | Why here |
| --- | --- | --- |
| 1 | `tailwind.config.ts` `lg` raw screen + `index.css` print reset (§7.4) | Everything downstream renders through this |
| 2 | `resultView.ts` additions: `buildBreakdown`, `buildProjection`, `buildPaybackChart`, `buildMonthRows`, `buildAssumptionRows` (§7.2, §7.3, §8.1) | Pure, test-first, no UI dependency |
| 3 | `ResultBar`, `ScenarioTable`, `ChannelTable`, `ProductContributionTable`, `MonthTable`, `AssumptionsList` (§7.2, §7.3) | Consumes step 2; makes the result screen content-complete on-screen, independent of print or charts |
| 4 | `SummaryPane`, `MobileSummaryBar`, `sectionSummary.ts`, page restructure (§7.1) | The layout charts and the report both render inside |
| 5 | `chartGeometry.ts`, `ProjectionChart`, `PaybackChart`, `SankeyBreakdown` (§8.1) | Additive to the now-complete result screen |
| 6 | `storage.ts`, `hooks/draftStorage.ts`, `hooks/draftAutosave.ts`, `DraftNotice.tsx` (§8.5) | Independent of the report; can land any time after step 4 wires `useDetailedCalc` |
| 7 | `reportView.ts` + its tests (§8.2) | Pure, no UI dependency |
| 8 | `ReportCover`, `ReportAppendix`, disclaimer copy (§8.3, §8.4) | Consumes step 7 |
| 9 | `ReportActionButton`, `ReportNameDialog`, `useReportPrint`, page wiring (§8.3) | First point the feature is usable end to end |
| 10 | `reportGuards.test.ts`, page-break tuning across every section | After all content exists — tuning against changing content is guaranteed rework otherwise |
| 11 | Manual verification matrix (§10) | Last |

Each step ends green (`typecheck`, `lint`, `test:run`, `build`) before the next starts, same discipline as every phase so far.

---

## 13. Definition of Done

1. A user on desktop or mobile can: fill the Detailed form, see it survive a reload (autosave), see three charts alongside the existing tables, and produce an English-language, USD-formatted A4 PDF via their browser's print dialog — with no backend, no new Cloudflare product, and no new dependency.
2. The report flow is exactly §8.3: action → dialog → required business name → enabled download; the name reaches the cover and the filename and never the engine.
3. The PDF contains, in order: cover, the result sections (reconciliation, scenarios, projection + month table, payback, channel and product economics, assumptions), Appendix A — inputs, Appendix B — scope and limitations.
4. Every figure in the report and the charts is traceable to `DetailedView`; `core/detailed-us/**` is unmodified and the golden vector is untouched.
5. `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build` are clean, and the §10 manual matrix has been walked in at least Chrome desktop + one mobile browser.
6. Screen behavior for the existing Phase 1–4 work (Quick Calculation, the mode switcher, Detailed's existing form sections) is unchanged except the intended additions named here.
