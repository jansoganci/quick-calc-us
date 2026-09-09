import { describe, expect, it } from 'vitest'
import { calculateDetailed, validateDetailedInput, type DetailedInput, type DetailedResolvedInput } from '../../core/detailed-us/index.ts'
import {
  buildReportInputGroups,
  formatReportFileDate,
  isValidBusinessName,
  reportDocumentTitle,
  sanitizeBusinessName,
} from './reportView.ts'

const RAW: DetailedInput = {
  usState: 'CA',
  products: [{ id: 'latte', name: 'Latte', normalPrice: 5.5, onlinePrice: 6.15, dailyQuantity: 220, unitProductCost: 1.1 }],
  channelMix: { dineIn: 0.5, takeaway: 0.2, delivery: 0.3 },
  paymentMix: { cash: 0.15, card: 0.85 },
  posCommissionRate: 0.035,
  delivery: { mode: 'platformOnly', platformFeeRate: 0, ownCourierCostPerDeliveryOrder: 3.5 },
  packaging: { takeawayPerOrder: 0.35, deliveryPerOrder: 0.75 },
  occupancy: { monthlyRent: 4500, monthlyCAM: 350 },
  positions: [{ id: 'barista', name: 'Barista', headcount: 2, monthlyCostPerPerson: 3200 }],
  owner: { monthlyDraw: 4000, benefitsAllowance: 500 },
  opexLines: [{ id: 'utilities', name: 'Utilities', monthlyAmount: 450 }],
  capexItems: [{ id: 'espresso', name: 'Espresso machine', amount: 18000 }],
  assumptions: { rampUpPreset: 'normal', projectionHorizonMonths: 24 },
}

function resolve(raw: DetailedInput): DetailedResolvedInput {
  const result = validateDetailedInput(raw)
  if (!result.ok) throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`)
  return result.input
}

describe('buildReportInputGroups', () => {
  it('covers every populated section: jurisdiction, products, channels, payments, delivery, positions, owner, occupancy, opex, capex', () => {
    const input = resolve(RAW)
    const result = calculateDetailed(input)
    const groups = buildReportInputGroups(input, result)
    const sections = groups.map((group) => group.section)
    expect(sections).toEqual(['jurisdiction', 'products', 'channels', 'payments', 'delivery', 'positions', 'owner', 'occupancy', 'opex', 'capex'])
  })

  it('never includes an assumptions group — already rendered in full by the mandatory assumptions block', () => {
    const input = resolve(RAW)
    const result = calculateDetailed(input)
    const groups = buildReportInputGroups(input, result)
    expect(groups.some((group) => group.section === 'assumptions')).toBe(false)
  })

  it('drops the delivery group when the channel mix has no delivery share', () => {
    const input = resolve({ ...RAW, channelMix: { dineIn: 0.7, takeaway: 0.3, delivery: 0 }, delivery: undefined })
    const result = calculateDetailed(input)
    const groups = buildReportInputGroups(input, result)
    expect(groups.some((group) => group.section === 'delivery')).toBe(false)
  })

  it('drops the opex and capex groups when there are no lines, without dropping their totals from the engine result', () => {
    const input = resolve({ ...RAW, opexLines: undefined, capexItems: undefined })
    const result = calculateDetailed(input)
    const groups = buildReportInputGroups(input, result)
    expect(groups.some((group) => group.section === 'opex')).toBe(false)
    expect(groups.some((group) => group.section === 'capex')).toBe(false)
    expect(result.totalInitialInvestment).toBe(0)
  })

  it('every published total equals the engine field it cites, never a sum computed in this file', () => {
    const input = resolve(RAW)
    const result = calculateDetailed(input)
    const base = result.scenarios.base.stabilizedMonth
    const groups = buildReportInputGroups(input, result)

    const positions = groups.find((group) => group.section === 'positions')
    expect(positions?.total?.value).toBe(`$${Math.round(base.monthlyPayroll).toLocaleString('en-US')}`)

    const owner = groups.find((group) => group.section === 'owner')
    expect(owner?.total?.value).toBe(`$${Math.round(base.monthlyOwnerCost).toLocaleString('en-US')}`)

    const occupancy = groups.find((group) => group.section === 'occupancy')
    expect(occupancy?.total?.value).toBe(`$${Math.round(base.monthlyOccupancyCost).toLocaleString('en-US')}`)

    const opex = groups.find((group) => group.section === 'opex')
    expect(opex?.total?.value).toBe(`$${Math.round(base.monthlyOpex).toLocaleString('en-US')}`)

    const capex = groups.find((group) => group.section === 'capex')
    expect(capex?.total?.value).toBe(`$${Math.round(result.totalInitialInvestment).toLocaleString('en-US')}`)
  })

  it('formats every value en-US/USD through lib/, never a report-specific formatter', () => {
    const input = resolve(RAW)
    const result = calculateDetailed(input)
    const groups = buildReportInputGroups(input, result)
    const jurisdiction = groups.find((group) => group.section === 'jurisdiction')
    expect(jurisdiction?.content.kind).toBe('rows')
    if (jurisdiction?.content.kind === 'rows') {
      expect(jurisdiction.content.rows.some((row) => row.value === 'California')).toBe(true)
      expect(jurisdiction.content.rows.some((row) => /^\d+\.\d%$/.test(row.value))).toBe(true)
    }

    const products = groups.find((group) => group.section === 'products')
    expect(products?.content.kind).toBe('table')
    if (products?.content.kind === 'table') {
      expect(products.content.table.rows[0]?.some((cell) => /^\$\d/.test(cell))).toBe(true)
    }
  })
})

describe('report filename and title', () => {
  it('rejects a whitespace-only name', () => {
    expect(isValidBusinessName('   ')).toBe(false)
    expect(isValidBusinessName('Riverside Coffee Co.')).toBe(true)
  })

  it('strips filesystem-hostile characters and length-caps the name', () => {
    expect(sanitizeBusinessName('Riverside / Coffee : Co.')).toBe('Riverside Coffee Co.')
    expect(sanitizeBusinessName('a'.repeat(100)).length).toBe(60)
  })

  it('builds a deterministic, dated document title', () => {
    const date = new Date('2026-09-05T12:00:00Z')
    expect(reportDocumentTitle('Riverside Coffee Co.', date)).toBe(`Feasibility Report — Riverside Coffee Co. — ${formatReportFileDate(date)}`)
    expect(reportDocumentTitle('', date)).toBe(`Feasibility Report — ${formatReportFileDate(date)}`)
  })
})
