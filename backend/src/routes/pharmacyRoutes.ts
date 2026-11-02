import { Router, RequestHandler } from 'express';
import {
    authenticate,
    requireSelectedPharmacy,
    AuthRequest
} from '../middleware/authMiddleware';

const router = Router();

router.get(
    '/my-pharmacies',
    authenticate,
    (req, res) => {
        // Your existing getMyPharmacies controller can be used here
        res.status(200).json({
            message: 'My pharmacies endpoint'
        });
    }
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