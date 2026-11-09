import type { MovementType, StockPostingCommand } from '../contracts/stockPosting';

export class StockPostingError extends Error {
  constructor(message: string, public readonly httpStatus = 400) {
    super(message);
    this.name = 'StockPostingError';
  }
}

const movementTypes: readonly MovementType[] = [
  'GRN_RECEIPT', 'SALE', 'CUSTOMER_RETURN', 'DISTRIBUTOR_RETURN',
  'DAMAGE', 'EXPIRY', 'ADJUSTMENT', 'REVERSAL'
];

const positiveOnly: readonly MovementType[] = ['GRN_RECEIPT', 'CUSTOMER_RETURN'];
const negativeOnly: readonly MovementType[] = ['SALE', 'DISTRIBUTOR_RETURN', 'DAMAGE', 'EXPIRY'];

export function validateStockPostingCommand(command: StockPostingCommand): void {
  if (!command || typeof command !== 'object') throw new StockPostingError('Command is required');
  for (const field of ['pharmacyId', 'medicineId', 'batchId', 'referenceId', 'performedById'] as const) {
    if (!/^[a-f\d]{24}$/i.test(command[field] ?? '')) {
      throw new StockPostingError(`${field} must be a MongoDB ObjectId`);
    }
  }
  if (!movementTypes.includes(command.movementType)) throw new StockPostingError('Invalid movement type');
  if (!Number.isSafeInteger(command.quantityDelta) || command.quantityDelta === 0) {
    throw new StockPostingError('Quantity delta must be a non-zero safe integer');
  }
  if (positiveOnly.includes(command.movementType) && command.quantityDelta < 0) {
    throw new StockPostingError(`${command.movementType} must increase stock`);
  }
  if (negativeOnly.includes(command.movementType) && command.quantityDelta > 0) {
    throw new StockPostingError(`${command.movementType} must decrease stock`);
  }
  if (typeof command.referenceType !== 'string' || !/^[A-Z][A-Z_]{1,39}$/.test(command.referenceType)) {
    throw new StockPostingError('Invalid reference type');
  }
  if (typeof command.idempotencyKey !== 'string' || command.idempotencyKey.trim().length < 8 || command.idempotencyKey.length > 180) {
    throw new StockPostingError('Idempotency key must contain 8–180 characters');
  }
  if (command.reason !== undefined && (typeof command.reason !== 'string' || !command.reason.trim())) {
    throw new StockPostingError('Reason must not be empty');
  }
  if (command.movementType === 'GRN_RECEIPT' && command.referenceType !== 'GRN_ITEM') {
    throw new StockPostingError('GRN receipt must reference a GRN_ITEM');
  }
  if (command.movementType === 'ADJUSTMENT' && command.referenceType !== 'STOCK_ADJUSTMENT') {
    throw new StockPostingError('Adjustment must reference an approved STOCK_ADJUSTMENT');
  }
}

export function calculateNewQuantity(before: number, delta: number): number {
  if (!Number.isSafeInteger(before) || before < 0 || !Number.isSafeInteger(delta) || delta === 0) {
    throw new StockPostingError('Invalid stock balance or delta');
  }
  const after = before + delta;
  if (!Number.isSafeInteger(after)) throw new StockPostingError('Stock quantity exceeds safe integer range');
  if (after < 0) throw new StockPostingError('Insufficient stock', 409);
  return after;
}

export function samePosting(
  current: Pick<StockPostingCommand, 'pharmacyId' | 'medicineId' | 'batchId' | 'movementType' | 'quantityDelta' | 'referenceType' | 'referenceId' | 'performedById'>,
  previous: Record<string, unknown>
): boolean {
  const fields = ['pharmacyId', 'medicineId', 'batchId', 'movementType', 'quantityDelta', 'referenceType', 'referenceId', 'performedById'] as const;
  return fields.every((field) => String(current[field]) === String(previous[field]));
}
