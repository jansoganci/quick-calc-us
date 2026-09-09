import { describe, expect, it } from 'vitest'
import { emptyLine, emptyPosition, emptyProduct, initialForm, syncIdCounter } from './formState.ts'

function suffixOf(id: string): number {
  return Number(id.slice(id.lastIndexOf('-') + 1))
}

/**
 * The id counter is module state that restarts at 0 on every page load, so a
 * restored draft is the one situation where it can hand out an id that is
 * already taken. These ids are React keys and the map key in
 * `hooks/useNewestRowOpen.ts`.
 */
describe('syncIdCounter', () => {
  it('never reissues an id the restored draft already holds', () => {
    const restored = initialForm()
    restored.products = [
      { ...emptyProduct(), id: 'product-1' },
      { ...emptyProduct(), id: 'product-2' },
    ]
    restored.positions = [{ ...emptyPosition(), id: 'position-3' }]
    restored.opexLines = [{ ...emptyLine('opex'), id: 'opex-9' }]
    restored.capexItems = [{ ...emptyLine('capex'), id: 'capex-4' }]

    syncIdCounter(restored)

    const taken = new Set([...restored.products, ...restored.positions, ...restored.opexLines, ...restored.capexItems].map((row) => row.id))
    const minted = [emptyProduct().id, emptyProduct().id, emptyPosition().id, emptyLine('opex').id, emptyLine('capex').id]

    for (const id of minted) expect(taken.has(id)).toBe(false)
    expect(new Set(minted).size).toBe(minted.length)
  })

  it('only ever moves the counter forward', () => {
    const before = suffixOf(emptyProduct().id)

    const stale = initialForm()
    stale.products = [{ ...emptyProduct(), id: 'product-1' }]
    syncIdCounter(stale)

    expect(suffixOf(emptyProduct().id)).toBeGreaterThan(before)
  })

  it('ignores ids that carry no numeric suffix', () => {
    const form = initialForm()
    form.products = [{ ...emptyProduct(), id: 'product-abc' }]
    form.opexLines = [{ ...emptyLine('opex'), id: 'legacy' }]

    expect(() => syncIdCounter(form)).not.toThrow()
    expect(emptyProduct().id).toMatch(/^product-\d+$/)
  })

  it('handles a form with no repeating rows at all', () => {
    const form = initialForm()
    form.products = []
    expect(() => syncIdCounter(form)).not.toThrow()
  })
})

describe('initialForm', () => {
  it('starts with one blank product row, since products are the only thing the model cannot proceed without', () => {
    const form = initialForm()
    expect(form.products).toHaveLength(1)
    expect(form.products[0]?.name).toBe('')
  })

  it('starts with no state selected — never an implicit sales-tax rate', () => {
    const form = initialForm()
    expect(form.usState).toBe('')
    expect(form.salesTaxRate).toBe('')
  })

  it('starts with every other repeating section empty', () => {
    const form = initialForm()
    expect(form.positions).toHaveLength(0)
    expect(form.opexLines).toHaveLength(0)
    expect(form.capexItems).toHaveLength(0)
  })
})
