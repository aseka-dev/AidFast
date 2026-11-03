import { Router, RequestHandler } from 'express';
import {
    authenticate,
    requireSelectedPharmacy,
    AuthRequest
} from '../middleware/authMiddleware';
import { getMyPharmacies } from '../controllers/pharmacyController';

const router = Router();

router.get(
    '/my-pharmacies',
    authenticate,
    getMyPharmacies
);

const getSelectedPharmacy: RequestHandler = (req, res) => {
    const authReq = req as AuthRequest;

    res.status(200).json({
        pharmacyId: authReq.user?.pharmacyId,
        role: authReq.user?.role,
        permissions: authReq.user?.permissions
    });
};

router.get(
    '/selected',
    authenticate,
    requireSelectedPharmacy,
    getSelectedPharmacy
);

export default router;
