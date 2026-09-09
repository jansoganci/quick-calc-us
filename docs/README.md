# Documentation

Active sources of truth live in this folder.

If two documents appear to disagree, use the authority order in [`CLAUDE.md`](../CLAUDE.md).

---

## Active sources of truth

| Document | Owns |
| --- | --- |
| [`US_PRODUCT_SCOPE.md`](./US_PRODUCT_SCOPE.md) | Quick Calculation financial spec — inputs, formulas, outputs, the 50-state + DC sales-tax table (v0.2, owner locks US-1…US-10) |
| [`US_DETAILED_FEASIBILITY_SCOPE.md`](./US_DETAILED_FEASIBILITY_SCOPE.md) | Detailed Feasibility scope and locked decisions (v0.1, owner locks UD-1…UD-4) |
| [`US_DETAILED_FINANCIAL_SPEC.md`](./US_DETAILED_FINANCIAL_SPEC.md) | Detailed Feasibility formula contract — inputs, defaults, limits, formulas, edge states, golden vector (v0.2, implemented in `core/detailed-us/`) |
| [`TECH_STACK_AND_CONSTRAINTS.md`](./TECH_STACK_AND_CONSTRAINTS.md) | Stack, runtime, deployment, persistence, technical exclusions |
| [`APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`](./APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md) | Folder structure, layer boundaries, dependency direction, reuse rules, naming |
| [`DESIGN_DIRECTION.md`](./DESIGN_DIRECTION.md) | Locked visual & UX direction, inherited from the TR sibling app |
| [`FRONTEND_IMPLEMENTATION_SPEC.md`](./FRONTEND_IMPLEMENTATION_SPEC.md) | UI measurements, tokens, field map — TR copy/currency examples; reuse the direction, not the Turkish wording or TRY formatting |

[`CLAUDE.md`](../CLAUDE.md) is operating guidance for coding models. It is not a specification.

---

## Not in this repo

This is a fresh, separate codebase for the US variant of the product (sibling
to the TR app maliyet.lol, not a fork or a locale switch). The TR product's
own financial specs (Quick and Detailed Feasibility scope, formulas, decision
logs) and its Detailed Feasibility engine do not apply here and are not
copied into this repo. `US_PRODUCT_SCOPE.md` is self-contained for the
financial behaviour this product needs.

`DESIGN_DIRECTION.md` and `FRONTEND_IMPLEMENTATION_SPEC.md` are kept because
the visual direction and UI structure are inherited as a starting point — see
the top-level task brief. Their Turkish copy, TRY formatting and two-mode
(Quick/Detailed) references do not apply to this repo; only the layout,
tokens and interaction rules do.
