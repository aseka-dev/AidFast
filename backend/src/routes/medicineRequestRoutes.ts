
import { Router, RequestHandler } from 'express';

const router = Router();

// Public API - customers do not need to log in
const submitMedicineRequest: RequestHandler = (req, res) => {
    res.status(200).json({
        message: 'Medicine request endpoint is working'
    });
};

router.post(
    '/',
    submitMedicineRequest
);

export default router;
