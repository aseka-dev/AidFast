// Pure rules: no DB, API, or network dependency. Each lot quantity is already
// expressed in the agreed base dispensing unit (tablet, capsule, bottle, etc.).
export type LotBatchStatus = 'ACTIVE' | 'BLOCKED' | 'QUARANTINED' | 'EXPIRED' | 'DEPLETED';
export type LotSafetyStatus = 'CLEAR' | 'UNDER_REVIEW' | 'MATCHED' | 'RESOLVED';
export type AvailabilityStatus = 'AVAILABLE' | 'LOW_AVAILABILITY' | 'OUT_OF_STOCK';

export interface EligibleStockLot {
  pharmacyId: string;
  medicineId: string;
  currentQuantity: number;
  batchStatus: LotBatchStatus;
  safetyStatus: LotSafetyStatus;
  expiryDate: Date;
}

// Business dates use Sri Lankan calendar days, not fixed UTC 24-hour intervals.
export function colomboToday(asOf: Date): string {
  if (Number.isNaN(asOf.getTime())) throw new Error('Invalid as-of date');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(asOf);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isEligibleLot(lot: EligibleStockLot, asOf: Date): boolean {
  if (!Number.isSafeInteger(lot.currentQuantity) || lot.currentQuantity <= 0) return false;
  if (lot.batchStatus !== 'ACTIVE') return false;
  if (lot.safetyStatus !== 'CLEAR' && lot.safetyStatus !== 'RESOLVED') return false;
  if (!(lot.expiryDate instanceof Date) || Number.isNaN(lot.expiryDate.getTime())) return false;
  // Store expiry as a date-only UTC date, e.g., 2027-11-05T00:00:00.000Z.
  // It remains eligible through its printed expiry date, unless separately blocked.
  return lot.expiryDate.toISOString().slice(0, 10) >= colomboToday(asOf);
}

export function eligibleQuantity(
  lots: readonly EligibleStockLot[], pharmacyId: string, medicineId: string, asOf: Date
): number {
  if (!pharmacyId || !medicineId) throw new Error('Pharmacy and medicine are required');
  let total = 0;
  for (const lot of lots) {
    if (lot.pharmacyId !== pharmacyId || lot.medicineId !== medicineId) continue;
    if (isEligibleLot(lot, asOf)) {
      total += lot.currentQuantity;
      if (!Number.isSafeInteger(total)) throw new Error('Eligible quantity exceeds safe integer range');
    }
  }
  return total;
}

export function availabilityStatusFromQuantity(
  quantity: number, lowAvailabilityThreshold: number
): AvailabilityStatus {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Invalid eligible quantity');
  if (!Number.isSafeInteger(lowAvailabilityThreshold) || lowAvailabilityThreshold < 0) {
    throw new Error('Invalid low-availability threshold');
  }
  if (quantity === 0) return 'OUT_OF_STOCK';
  return quantity <= lowAvailabilityThreshold ? 'LOW_AVAILABILITY' : 'AVAILABLE';
}

// Never expose eligibleQuantity in the public DTO. The outward-facing snapshot
// stores availabilityStatus only, and respects public-visibility opt-in.
export function createPublicAvailabilityProjection(
  lots: readonly EligibleStockLot[], pharmacyId: string, medicineId: string,
  lowAvailabilityThreshold: number, isPubliclyVisible: boolean, asOf: Date
): { availabilityStatus: AvailabilityStatus; isPubliclyVisible: boolean; lastUpdatedAt: Date } {
  const quantity = eligibleQuantity(lots, pharmacyId, medicineId, asOf);
  return {
    availabilityStatus: availabilityStatusFromQuantity(quantity, lowAvailabilityThreshold),
    isPubliclyVisible,
    lastUpdatedAt: asOf,
  };
}
