import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { TenantAccessError, BadRequestError } from '../utils/errors';

// Rejects requests where the URL pharmacy differs from the pharmacy in the token.
const matchPharmacyParam = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    if (!req.user?.pharmacyId) {
        return next(new BadRequestError('Please select a pharmacy first', 'PHARMACY_SELECTION_REQUIRED'));
    }

    if (String(req.params.pharmacyId) !== String(req.user.pharmacyId)) {
        return next(new TenantAccessError('You cannot access another pharmacy'));
    }

    next();
};

export default matchPharmacyParam;