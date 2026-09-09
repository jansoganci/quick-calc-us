# Quick + Detailed — Phase 6: TR Parity Fixes

**Status: Implemented.** All five real gaps (G1, G3, G4, G5, G6 — G2 needed no work) are closed. Verified with `typecheck`, `lint`, `test:run` (256 tests, +38 from this phase), `build`, and a Playwright pass covering Quick's Sankey, Detailed's mobile row collapse/auto-focus, the assumptions disclosure, and the print preview. T-5's tests caught a real pre-existing bug in Quick's `viewModel.ts`: `toRawInput` divided every secondary field by 100, including `operatingDaysPerMonth` and `capexRecoveryPeriodMonths` (not percentages) — so typing the engine's own default of `60` into "Capex recovery period" failed validation. Fixed alongside the new tests.

**Owns:** six concrete gaps found when auditing the US app against the TR sibling app (`main`) after Phase 5. Each gap is either a missing feature TR has and US doesn't, or a UI/UX behavior that diverged from TR without an explicit decision to diverge. This plan closes them.

**Does not own:** any financial formula (`core/quick-us/**` and `core/detailed-us/**` are untouched by every task here), the Phase 5 mechanism choices (print CSS, no chart library, `localStorage` autosave — those stand, see `docs/US_DETAILED_FEASIBILITY_PHASE5_PLAN.md`).

---

## 1. The six gaps

| # | Gap | Where | Fix |
| --- | --- | --- | --- |
| G1 | Quick Calculation has no Sankey chart. TR's Quick (Lite) shows one right after the stacked bar; US's only has the bar. | `features/quick-calc/` | Port `SankeyBreakdown.tsx` from TR, reusing the existing `BarSegment[]` (`view.bar`) — no new data. |
| G2 | Detailed's Sankey already renders on screen **and** in the printed PDF (verified in the Phase 5 Playwright pass) — this one is closed already; kept in the table so the audit trail is complete. | `features/detailed/components/SankeyBreakdown.tsx` | No action — confirmed working. |
| G3 | Print CSS is missing three rules TR's `index.css` has: `.qc-sheet { max-width:none; border:0 }` (resets the 1152px app frame on paper), `.qc-report-cover/appendix/body { padding-left/right:0 }`, `.qc-report-flow { break-inside:auto }`. | `src/app/index.css` | Add the three rules; tag `DetailedResults`' and `ReportAppendix`'s outer wrapper `qc-report-body` / `qc-report-flow` where TR does. |
| G4 | Detailed's array-row sections (`ProductRows`, `PositionRows`) don't collapse to a one-line summary on mobile, and adding a row doesn't scroll-into-view + focus it. TR's `useNewestRowOpen.ts` drives exactly this, on all three row types (`LineRows` gets the scroll/focus only, no visual collapse — confirmed from TR's own source). | `features/detailed/` | Port `hooks/useNewestRowOpen.ts` verbatim; add the mobile toggle + summary line to `ProductRows`/`PositionRows`; wire the scroll/focus ref into `LineRows` without adding a collapse toggle there (matches TR). |
| G5 | Detailed's assumptions section is a flat list. TR splits it into always-visible basics (sales tax rate equivalent, operating days, projection horizon, ramp-up, scenario deltas) plus a collapsible `<details>` "Advanced assumptions — annual increases" holding the three annual rate fields, with a summary line showing the three current values. | `features/detailed/components/DetailedForm.tsx` | Wrap the three annual-increase fields in a native `<details>`, same anatomy as TR — no new CSS needed (`.qc-assumptions` in `index.css` belongs to Quick's `AssumptionsStrip`, not this). |
| G6 | Feature-layer test coverage is asymmetric. `core/quick-us/**` and `core/detailed-us/**` both have full golden-vector test suites; `features/quick-calc/` and `features/detailed/` (the view-model/form-state layer TR tests directly — `viewModel.test.ts`, `formState.test.ts`) have none in US except the three Phase 5 report/storage files. | `features/quick-calc/`, `features/detailed/` | Add `features/quick-calc/viewModel.test.ts` and `features/detailed/viewModel.test.ts` (evaluate-the-form-not-just-the-engine tests) and `features/detailed/formState.test.ts` (`syncIdCounter`, ported from TR almost verbatim — the id-collision logic is identical). |

G2 needed no work; the other five are real. G1, G3, G5 are small and mechanical. G4 is the largest (new hook + two component rewrites). G6 is new test-writing, not a UI change.

---

## 2. Task list

### T-1 — Print CSS completion (G3)

Add to `@media print` in `src/app/index.css`:

```css
.qc-sheet { max-width: none !important; border: 0 !important; }
.qc-report-cover, .qc-report-appendix, .qc-report-body { padding-left: 0 !important; padding-right: 0 !important; }
.qc-report-flow { break-inside: auto; }
```

Tag `AppShell.tsx`'s root `div` (already `qc-sheet`, just needs the rule), `DetailedResults.tsx`'s outer wrapper with `qc-report-body`, and `ReportAppendix`'s appendix-groups container with `qc-report-flow` (the appendix is the one section allowed to break across pages; per-group `qc-report-section` still gets `break-inside: avoid`).

### T-2 — Assumptions: basic + collapsible advanced (G5)

In `DetailedForm.tsx`'s `AssumptionsSection`: keep horizon/ramp-up/scenario-delta controls as they are; move the three annual-increase `NumberField`s into a `<details>` with a `<summary>` showing `%{sales} · %{cogs} · %{fixed}`. New copy: `advancedAssumptions`, `advancedAssumptionsNote` (labels.ts).

### T-3 — Quick Sankey (G1)

New `features/quick-calc/components/SankeyBreakdown.tsx`, ported from TR with `formatUsd`/USD labels. Insert into `QuickCalcResults.tsx` right after `BreakdownTable`, exactly TR's placement.

### T-4 — Row-level mobile parity (G4)

New `features/detailed/hooks/useNewestRowOpen.ts` (verbatim port — generic over an id list, no product-specific logic). Changed:
- `ProductRows.tsx` — mobile toggle button per row (name + compact summary + chevron), full field grid becomes `hidden lg:grid` unless open.
- `PositionRows.tsx` — same pattern, summary shows headcount.
- `LineRows.tsx` — no visual toggle (matches TR); wires `rows.rowRef(id)` so a newly added line scrolls into view and focuses its name field.

### T-5 — Feature-layer tests (G6)

- `features/quick-calc/viewModel.test.ts` — `evaluateForm`/`buildQuickView` against a golden form (not the engine's own golden vector — a form-shaped one, exercising string parsing, the bar's 100% closure, headline segment tones, error messages).
- `features/detailed/viewModel.test.ts` — `evaluateDetailed` against a viable form (products required, percentage-string-to-fraction conversion, the reconciliation bar closing to 100% and its deficit-caption path, guardrails).
- `features/detailed/formState.test.ts` — `syncIdCounter`, ported near-verbatim from TR (the logic is generic id-suffix arithmetic, not TR-specific).

---

## 3. Order

1. T-1 (print CSS) — isolated, zero risk.
2. T-2 (assumptions split) — isolated to one section.
3. T-3 (Quick Sankey) — additive, no existing behavior changes.
4. T-4 (row mobile parity) — the largest change; touches three existing components.
5. T-5 (tests) — written against the finished T-1…T-4 behavior.

Each step ends green (`typecheck`, `lint`, `test:run`, `build`).

## 4. Definition of done

- Quick and Detailed both show a Sankey chart after Calculate, on screen; Detailed's already prints, Quick's has no print surface (Quick has no PDF report, unchanged from TR).
- Chrome print preview of a Detailed report shows no residual app-frame border/padding on paper.
- On a phone, adding a product or position scrolls to it and focuses its name field; existing rows collapse to a one-line summary.
- Assumptions section shows the three annual rates behind a closed-by-default disclosure with a value summary.
- `npm run typecheck / lint / test:run / build` clean; the new feature-layer tests pass alongside the existing 218.
