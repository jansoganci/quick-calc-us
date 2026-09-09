import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import daisyui from 'daisyui'

/**
 * The approved Quick Calculation palette — the single source of truth for colour.
 *
 * Values come from `docs/DESIGN_DIRECTION.md` and
 * `docs/FRONTEND_IMPLEMENTATION_SPEC.md` §1, inherited from the TR sibling app.
 * Do not add a colour here that those documents do not approve, and do not
 * restate any of these values in a component.
 *
 * Every entry below is emitted as a `--qc-*` custom property on `:root` and exposed
 * as a Tailwind colour (`text-qc-ink`, `bg-qc-page`, `border-qc-rule`, …). A dark
 * theme is added later by redefining these custom properties in one place — no
 * component markup changes.
 */
const QC_COLORS = {
  // surfaces
  page: '#EDEEF0',
  surface: '#FFFFFF',
  'surface-result': '#FCFCFD',

  // ink
  ink: '#16181C',
  secondary: '#5B6169',
  muted: '#8A9199',
  subtle: '#A8AEB6',
  'on-accent': '#FFFFFF',

  // rules and borders
  rule: '#E3E5E8',
  'rule-mid': '#D6D9DD',
  'rule-strong': '#C3C8CE',
  'rule-row': '#EEF0F2',

  // accent
  accent: '#1D3A5F',
  'accent-hover': '#16304F',

  // validation
  error: '#A0503C',

  // disabled control
  disabled: '#F1F2F4',
  'disabled-border': '#DDE0E4',

  // average-sale breakdown ramp, in the locked §9.2 order
  'bar-vat': '#C3C8CE',
  'bar-variable': '#3F4650',
  'bar-payroll': '#545C68',
  'bar-rent': '#6B7280',
  'bar-other-opex': '#8A9199',
  'bar-pos': '#A8AEB6',
  'bar-investment-recovery': '#CFD3D8',
  'bar-remaining': '#1D3A5F',

  // Detailed's reconciliation bar needs nine stops where Quick's needs eight, so
  // two tones join the same monotone ramp — one quantity divided, not a hue
  // scale (docs/US_DETAILED_FEASIBILITY_PHASE5_PLAN.md §7.2).
  'bar-channel': '#4A515C',
  'bar-owner': '#7C838C',
} as const

/** Focus and error rings, per FRONTEND_IMPLEMENTATION_SPEC.md §1. */
const QC_RINGS = {
  'focus-ring': 'rgb(29 58 95 / 0.13)',
  'error-ring': 'rgb(160 80 60 / 0.13)',
} as const

const cssVariables = Object.fromEntries([
  ...Object.entries(QC_COLORS).map(([name, value]) => [`--qc-${name}`, value]),
  ...Object.entries(QC_RINGS).map(([name, value]) => [`--qc-${name}`, value]),
])

/** Tailwind colours read the custom properties, so the theme is swappable at runtime. */
const themeColors = Object.fromEntries(
  Object.keys(QC_COLORS).map((name) => [name, `var(--qc-${name})`]),
)

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { qc: themeColors },
      /**
       * `lg` also matches print, so the desktop-width layout serves as the
       * printed report layout with no per-component `print:` duplication
       * (docs/US_DETAILED_FEASIBILITY_PHASE5_PLAN.md §7.4). A `raw` screen
       * generates no `max-lg:` variant — nothing in this repo uses one;
       * `reportGuards.test.ts` holds the line.
       */
      screens: { lg: { raw: 'screen and (min-width: 1024px), print' } },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVariables })
    }),
    daisyui,
  ],
  daisyui: {
    // daisyUI resolves its theme at build time and cannot read the custom
    // properties, so it is fed from the same QC_COLORS object above.
    themes: [
      {
        qc: {
          primary: QC_COLORS.accent,
          'primary-content': QC_COLORS['on-accent'],
          'base-100': QC_COLORS.surface,
          'base-200': QC_COLORS['surface-result'],
          'base-300': QC_COLORS.page,
          'base-content': QC_COLORS.ink,
          error: QC_COLORS.error,
          'error-content': QC_COLORS['on-accent'],
        },
      },
    ],
  },
} satisfies Config
