import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

// Rejects requests where the URL pharmacy differs from the pharmacy in the token.
const matchPharmacyParam = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user?.pharmacyId) {
        res.status(400).json({ message: 'Please select a pharmacy first' });
        return;
    }

    if (String(req.params.pharmacyId) !== String(req.user.pharmacyId)) {
        res.status(403).json({ message: 'You cannot access another pharmacy' });
        return;
    }

    next();
};

export default matchPharmacyParam;