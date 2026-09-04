import { UnitOfMeasure } from '../../../generated/prisma/enums';

/**
 * Unit Conversion Matrix
 * Normalizes between metric mass, volume, and discrete units.
 */
export function convertQuantity(
  quantity: number,
  fromUnit: UnitOfMeasure | string,
  toUnit: UnitOfMeasure | string,
): number {
  if (fromUnit === toUnit) return quantity;

  const from = String(fromUnit).toUpperCase();
  const to = String(toUnit).toUpperCase();

  // 1. Mass Conversions (KG <-> GRAM)
  if (from === 'GRAM' && to === 'KG') {
    return quantity / 1000;
  }
  if (from === 'KG' && to === 'GRAM') {
    return quantity * 1000;
  }

  // 2. Volume Conversions (ML <-> LITER)
  if (from === 'ML' && to === 'LITER') {
    return quantity / 1000;
  }
  if (from === 'LITER' && to === 'ML') {
    return quantity * 1000;
  }

  // 3. Count Conversions (PIECE, BOX)
  if (from === 'PIECE' && to === 'PIECE') {
    return quantity;
  }
  if (from === 'BOX' && to === 'BOX') {
    return quantity;
  }

  // Fallback: If units are incompatible, return raw quantity
  return quantity;
}

/**
 * Format a quantity with its unit of measure in a human-friendly string
 */
export function formatQuantityWithUnit(
  quantity: number,
  unit: UnitOfMeasure | string,
): string {
  const num = Number(quantity);
  const u = String(unit).toUpperCase();

  switch (u) {
    case 'KG':
      return `${num >= 1 ? num.toFixed(2) : (num * 1000).toFixed(0)} ${num >= 1 ? 'kg' : 'g'}`;
    case 'GRAM':
      return `${num} g`;
    case 'LITER':
      return `${num >= 1 ? num.toFixed(2) : (num * 1000).toFixed(0)} ${num >= 1 ? 'L' : 'ml'}`;
    case 'ML':
      return `${num} ml`;
    case 'PIECE':
      return `${num} ${num === 1 ? 'pc' : 'pcs'}`;
    case 'BOX':
      return `${num} ${num === 1 ? 'box' : 'boxes'}`;
    default:
      return `${num} ${unit}`;
  }
}
