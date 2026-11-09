import mongoose from 'mongoose';
import Batch from '../models/Batch';
import StockMovement from '../models/StockMovement';
import StockAdjustment from '../models/StockAdjustment';
import GrnItem from '../models/GrnItem';
import Grn from '../models/Grn';
import type { StockPostingCommand, StockPostingResult, IStockPostingService } from '../contracts/stockPosting';
import { isEligibleLot } from './eligibleStock';
import { calculateNewQuantity, samePosting, StockPostingError, validateStockPostingCommand } from './stockPostingRules';

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

const str = (value: unknown): string => String(value);

/** Internal service only.*/
export class CentralStockPostingService implements IStockPostingService {
  async postStockIn(command: Omit<StockPostingCommand, 'quantityDelta'> & { quantity: number }): Promise<StockPostingResult> {
    const { quantity, ...other } = command;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new StockPostingError('Stock-in quantity must be positive');
    return this.post({ ...other, quantityDelta: quantity });
  }

  async postStockOut(command: Omit<StockPostingCommand, 'quantityDelta'> & { quantity: number }): Promise<StockPostingResult> {
    const { quantity, ...other } = command;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new StockPostingError('Stock-out quantity must be positive');
    return this.post({ ...other, quantityDelta: -quantity });
  }

  async post(command: StockPostingCommand): Promise<StockPostingResult> {
    validateStockPostingCommand(command);
    const lookup = { pharmacyId: command.pharmacyId, idempotencyKey: command.idempotencyKey };

    const replay = async (existing: any): Promise<StockPostingResult> => {
      if (!samePosting(command, {
        pharmacyId: str(existing.pharmacyId), medicineId: str(existing.medicineId),
        batchId: str(existing.batchId), movementType: existing.movementType,
        quantityDelta: existing.quantityDelta, referenceType: existing.referenceType,
        referenceId: str(existing.referenceId), performedById: str(existing.performedBy)
      })) throw new StockPostingError('Idempotency key reused for a different operation', 409);
      const batch = await Batch.findOne({ _id: command.batchId, pharmacyId: command.pharmacyId, medicineId: command.medicineId });
      if (!batch) throw new StockPostingError('Original batch not found', 404);
      return {
        movementId: str(existing._id), batchId: command.batchId,
        quantityBefore: existing.quantityBefore, quantityAfter: existing.quantityAfter,
        applied: false, batchStatus: batch.batchStatus
      };
    };

    const session = await mongoose.startSession();
    try {
      try {
        return await session.withTransaction(async (): Promise<StockPostingResult> => {
          const previous = await StockMovement.findOne(lookup).session(session);
          if (previous) return replay(previous);

          const batch = await Batch.findOne({
            _id: command.batchId, pharmacyId: command.pharmacyId, medicineId: command.medicineId
          }).session(session);
          if (!batch) throw new StockPostingError('Batch not found in selected pharmacy', 404);

          const before = batch.currentQuantity;
          const after = calculateNewQuantity(before, command.quantityDelta);

          // A sale may use only active, safe, unexpired stock. Blocked stock can still be removed physically for disposal/return under another movement type.
          if (command.movementType === 'SALE' && !isEligibleLot({
            pharmacyId: command.pharmacyId,
            medicineId: command.medicineId,
            currentQuantity: before,
            batchStatus: batch.batchStatus,
            safetyStatus: batch.safetyStatus,
            expiryDate: batch.expiryDate
          }, new Date())) {
            throw new StockPostingError('Batch is not eligible for sale', 409);
          }

          if (command.movementType === 'GRN_RECEIPT') {
            // Requires an existing zero-balance batch shell, linked to a verified GRN item.
            const item = await GrnItem.findOne({
              _id: command.referenceId,
              pharmacyId: command.pharmacyId,
              medicineId: command.medicineId,
              batchId: command.batchId
            }).session(session);
            if (!item || str(batch.grnItemId) !== str(item._id) || item.acceptedQuantity !== command.quantityDelta) {
              throw new StockPostingError('GRN item is missing, mismatched, or quantity is incorrect', 409);
            }
            const grn = await Grn.findOne({ _id: item.grnId, pharmacyId: command.pharmacyId }).session(session);
            if (!grn || !['PENDING_VERIFICATION', 'CONFIRMED'].includes(grn.status) ||
                !grn.verifiedBy || (grn.createdBy && str(grn.verifiedBy) === str(grn.createdBy))) {
              throw new StockPostingError('GRN requires an independent verifier before stock posting', 409);
            }
            if (before !== 0) throw new StockPostingError('GRN item stock already received or batch is not empty', 409);
          }

          if (command.movementType === 'ADJUSTMENT') {
            const adjustment = await StockAdjustment.findOne({
              _id: command.referenceId,
              pharmacyId: command.pharmacyId,
              batchId: command.batchId,
              approvalStatus: 'APPROVED',
              postedMovementId: { $exists: false },
              quantityDelta: command.quantityDelta
            }).session(session);
            if (!adjustment) throw new StockPostingError('Approved, unposted matching stock adjustment required', 409);
          }

          if (command.movementType === 'CUSTOMER_RETURN' && batch.batchStatus !== 'QUARANTINED') {
            throw new StockPostingError('Customer return must be credited into a quarantined batch', 409);
          }

          let nextStatus = batch.batchStatus;
          if (after === 0 && batch.batchStatus === 'ACTIVE') nextStatus = 'DEPLETED';
          if (after > 0 && batch.batchStatus === 'DEPLETED' && command.quantityDelta > 0) nextStatus = 'ACTIVE';

          const updated = await Batch.findOneAndUpdate(
            { _id: batch._id, pharmacyId: command.pharmacyId, medicineId: command.medicineId, currentQuantity: before },
            { $inc: { currentQuantity: command.quantityDelta, ...(command.movementType === 'GRN_RECEIPT' ? { initialQuantity: command.quantityDelta } : {}) }, $set: { batchStatus: nextStatus } },
            { new: true, runValidators: true, session }
          );
          if (!updated) throw new StockPostingError('Concurrent stock update; retry operation', 409);

          const [movement] = await StockMovement.create([{ 
            pharmacyId: command.pharmacyId, medicineId: command.medicineId,
            batchId: command.batchId, performedBy: command.performedById,
            movementType: command.movementType, quantityDelta: command.quantityDelta,
            quantityBefore: before, quantityAfter: after,
            reason: command.reason?.trim() || command.movementType,
            referenceType: command.referenceType, referenceId: command.referenceId,
            idempotencyKey: command.idempotencyKey
          }], { session });

          if (command.movementType === 'ADJUSTMENT') {
            const adjustmentUpdate = await StockAdjustment.updateOne(
              { _id: command.referenceId, pharmacyId: command.pharmacyId, postedMovementId: { $exists: false } },
              { $set: { postedMovementId: movement._id, postedAt: new Date() } }, { session }
            );
            if (adjustmentUpdate.modifiedCount !== 1) throw new StockPostingError('Adjustment was already posted', 409);
          }

          return {
            movementId: str(movement._id), batchId: command.batchId,
            quantityBefore: before, quantityAfter: after, applied: true,
            batchStatus: updated.batchStatus
          };
        });
      } catch (error) {
        if (isDuplicateKey(error)) {
          const existing = await StockMovement.findOne(lookup);
          if (existing) return replay(existing);
        }
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }
}

export const stockPostingService = new CentralStockPostingService();
