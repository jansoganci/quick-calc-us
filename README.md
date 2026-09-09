# Quick Calc (US)

A financial feasibility calculator for US food & beverage businesses. The
initial preset is **Coffee Shop / Cafe**.

This is the US sibling of an existing Turkish cafe/F&B feasibility calculator
(maliyet.lol) — a fresh, separate codebase, not a fork or a locale switch
inside the TR app. Same product shape (eight money/volume inputs, eight-row
cost breakdown, earnings/margins/payback/volume simulation), US financial
rules: pre-tax ticket with sales tax added on top, a required US state (or
DC) selection driving a planning sales-tax rate, no rent withholding, English
UI, USD, `en-US` number formatting.

---

## Current status

| Area | Status |
| --- | --- |
| Financial scope | Locked (v0.2) — `docs/US_PRODUCT_SCOPE.md` |
| Tech stack | Approved — `docs/TECH_STACK_AND_CONSTRAINTS.md` |
| Architecture and project structure | Approved — `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` |
| Scaffold (Phase 0) | Done — Vite/React/TS/Tailwind/daisyUI, Cloudflare Workers + Static Assets, app shell |
| Quick Calculation engine (Phase 1) | Done — `core/quick-us/`, `data/us/salesTaxRates.ts`, golden vector + edge cases in tests |
| Quick Calculation UI (Phase 2) | Done — `features/quick-calc/` |
| Detailed Feasibility engine (Phase 3) | Done — `core/detailed-us/`, golden vector + edge cases in tests |
| Detailed Feasibility UI (Phase 4) | Done — `features/detailed/` |
| Persistence, charts, PDF report (Phase 5) | Done — `docs/US_DETAILED_FEASIBILITY_PHASE5_PLAN.md`: autosaved drafts, 3 charts, downloadable PDF report |

Documentation index: [`docs/README.md`](docs/README.md).

---

## Stack

- **React** + **Vite** + **TypeScript**
- **Tailwind CSS** + **daisyUI**
- **Cloudflare** (Workers + Static Assets) for hosting
- **No database**, **no authentication**
- **Financial calculations run client-side**

Full detail and the reasoning behind each choice: `docs/TECH_STACK_AND_CONSTRAINTS.md`.

---

## Architecture overview

```
src/
  core/quick-us/     Quick Calculation engine — pure TypeScript, no React
  core/detailed-us/  Detailed Feasibility engine — same rule, no UI yet
  features/quick-calc/  Quick Calculation screen, form state, view model
  components/        reusable, domain-neutral UI primitives
  lib/               generic helpers (formatting, predicates)
  data/us/           salesTaxRates.ts — the 50-state + DC table, single source
```

The one boundary that matters: **financial logic lives in `core/`, never in React components.**

Full rules, dependency direction and naming conventions: `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`.

---

## Documentation

| Document | Owns |
| --- | --- |
| [`docs/README.md`](docs/README.md) | Index of active documentation |
| [`docs/US_PRODUCT_SCOPE.md`](docs/US_PRODUCT_SCOPE.md) | THE financial spec — inputs, formulas, outputs, the 50-state + DC sales-tax table |
| [`docs/TECH_STACK_AND_CONSTRAINTS.md`](docs/TECH_STACK_AND_CONSTRAINTS.md) | Stack, runtime, persistence, technical exclusions |
| [`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`](docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md) | Folder structure, layer boundaries, reuse rules, naming |
| [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) | Locked visual & UX direction, inherited from the TR sibling app |
| [`docs/FRONTEND_IMPLEMENTATION_SPEC.md`](docs/FRONTEND_IMPLEMENTATION_SPEC.md) | UI measurements, tokens, field map (reuse the structure; not the Turkish copy or TRY formatting) |
| [`CLAUDE.md`](CLAUDE.md) | Operating guidance for AI coding models |
| [`AGENTS.md`](AGENTS.md) | Operating guidance for other coding agents |

---

## Development

```bash
npm install
npm run dev          # Vite dev server
npm run test:run     # Vitest once
npm run typecheck
npm run lint
npm run build
```

`wrangler.jsonc` has no `routes` yet — no domain is confirmed. `npm run deploy` is not usable until one is wired in.

---

## Principles

- Simple architecture.
- No unnecessary backend.
- One source of truth for every financial formula.
- Calculation logic separated from UI.
- Build the current requirement, not a hypothetical future one.
