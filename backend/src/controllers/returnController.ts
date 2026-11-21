import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import auditLogger from '../utils/auditLogger';

export const createReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = String(req.params.pharmacyId || req.user?.pharmacyId);
  const { returnType, reason, items } = req.body || {};
  const returnNumber = `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await auditLogger({
    userId: req.user?.userId,
    pharmacyId,
    action: 'RETURN_CREATED',
    entity: 'Return',
    entityId: returnNumber,
    description: `Created return draft ${returnNumber} (${returnType || 'customer'}). Reason: ${reason || 'Customer request'}`,
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Return created successfully',
    data: {
      returnNumber,
      returnType: returnType || 'customer',
      reason: reason || 'Customer return',
      status: 'pending',
      items: items || []
    }
  });
};

export const getReturns = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: []
  });
};

export const getReturnById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      id: req.params.id,
      status: 'pending'
    }
  });
};

export const confirmReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = String(req.params.pharmacyId || req.user?.pharmacyId);
  const idParam = req.params.id;
  const returnId = String(Array.isArray(idParam) ? idParam[0] : idParam);
  const { disposition } = req.body || {};

  await auditLogger({
    userId: req.user?.userId,
    pharmacyId,
    action: 'RETURN_CONFIRMED',
    entity: 'Return',
    entityId: returnId,
    description: `Confirmed return ${returnId}. Disposition: ${disposition || 'RESTOCK_APPROVED'}`,
    ipAddress: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Return confirmed successfully',
    data: {
      returnId,
      status: 'approved',
      disposition: disposition || 'RESTOCK_APPROVED'
    }
  });
};
