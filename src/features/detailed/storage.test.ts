import { describe, expect, it } from 'vitest'
import { initialForm } from './formState.ts'
import { decodeDraft, encodeDraft, type Draft } from './storage.ts'

function sampleDraft(): Draft {
  const form = initialForm()
  form.usState = 'CA'
  form.salesTaxRate = '8.99'
  form.products = [{ id: 'product-1', name: 'Latte', normalPrice: '5.50', onlinePrice: '6.15', dailyQuantity: '220', unitProductCost: '1.10' }]
  return { form, businessName: 'Riverside Coffee Co.' }
}

describe('storage codec', () => {
  it('round-trips a valid draft', () => {
    const draft = sampleDraft()
    const decoded = decodeDraft(encodeDraft(draft))
    expect(decoded).toEqual(draft)
  })

  it('decodes a draft with no businessName (written before the report existed) with an empty name', () => {
    const draft = sampleDraft()
    const raw = JSON.stringify({ version: 1, form: draft.form })
    const decoded = decodeDraft(raw)
    expect(decoded).toEqual({ form: draft.form, businessName: '' })
  })

  it('rejects absent input', () => {
    expect(decodeDraft(null)).toBeNull()
  })

  it('rejects unparseable JSON', () => {
    expect(decodeDraft('{not json')).toBeNull()
  })

  it('rejects a non-object payload', () => {
    expect(decodeDraft(JSON.stringify('a string'))).toBeNull()
    expect(decodeDraft(JSON.stringify(42))).toBeNull()
    expect(decodeDraft(JSON.stringify([1, 2]))).toBeNull()
  })

  it('rejects a future or past version', () => {
    const draft = sampleDraft()
    expect(decodeDraft(JSON.stringify({ version: 2, form: draft.form, businessName: draft.businessName }))).toBeNull()
    expect(decodeDraft(JSON.stringify({ form: draft.form, businessName: draft.businessName }))).toBeNull()
  })

  it('rejects a form missing a required section, without attempting a partial repair', () => {
    const draft = sampleDraft()
    const formWithoutChannelMix: Record<string, unknown> = { ...draft.form }
    delete formWithoutChannelMix.channelMix
    const raw = JSON.stringify({ version: 1, form: formWithoutChannelMix, businessName: draft.businessName })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('rejects a product row with a non-string field', () => {
    const draft = sampleDraft()
    const corrupted = { ...draft.form, products: [{ ...draft.form.products[0], dailyQuantity: 220 }] }
    const raw = JSON.stringify({ version: 1, form: corrupted, businessName: draft.businessName })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('rejects an invalid delivery mode', () => {
    const draft = sampleDraft()
    const corrupted = { ...draft.form, delivery: { ...draft.form.delivery, mode: 'courier-drone' } }
    const raw = JSON.stringify({ version: 1, form: corrupted, businessName: draft.businessName })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('rejects an invalid projection horizon', () => {
    const draft = sampleDraft()
    const corrupted = { ...draft.form, assumptions: { ...draft.form.assumptions, projectionHorizonMonths: 18 } }
    const raw = JSON.stringify({ version: 1, form: corrupted, businessName: draft.businessName })
    expect(decodeDraft(raw)).toBeNull()
  })
})
