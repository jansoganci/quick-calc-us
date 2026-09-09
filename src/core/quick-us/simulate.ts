import { calculateQuick } from './calculate.ts';
import type { QuickResolvedInput, QuickSimulationRow, SimulationLabel } from './types.ts';

const LEVELS: ReadonlyArray<{
  label: SimulationLabel;
  multiplier: number;
  round: boolean;
}> = [
  { label: '-50%', multiplier: 0.5, round: true },
  { label: '-25%', multiplier: 0.75, round: true },
  { label: 'current', multiplier: 1, round: false },
  { label: '+25%', multiplier: 1.25, round: true },
  { label: '+50%', multiplier: 1.5, round: true },
];

export function simulateQuick(input: QuickResolvedInput): QuickSimulationRow[] {
  return LEVELS.map((level) => {
    const dailySales = level.round
      ? Math.round(input.dailySalesVolume * level.multiplier)
      : input.dailySalesVolume;
    const result = calculateQuick({ ...input, dailySalesVolume: dailySales });
    return {
      label: level.label,
      dailySales,
      estimatedTotalCostPerSale: result.perSale?.estimatedTotalCost ?? null,
      monthlyOperatingEarnings: result.monthly.operatingEarnings,
      isCurrent: level.label === 'current',
    };
  });
}
