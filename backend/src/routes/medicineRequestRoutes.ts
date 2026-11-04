
import { Router, RequestHandler } from 'express';
import type {
    SubmitMedicineRequestDTO,
    TrackMedicineRequestDTO
} from '../dto/community.dto';

const router = Router();

// POST /api/v1/public/medicine-requests
const submitMedicineRequest: RequestHandler = (req, res) => {
    const request = (req.body ?? {}) as Partial<SubmitMedicineRequestDTO>;

    if (
        typeof request.medicineName !== 'string' ||
        !request.medicineName.trim()
    ) {
        res.status(400).json({
            success: false,
            message: 'Medicine name is required'
        });
        return;
    }

    // Day 03 stub: no request is saved yet.
    res.status(501).json({
        success: false,
        message: 'Medicine request submission is not implemented yet'
    });
};

// POST /api/v1/public/medicine-requests/track
const trackMedicineRequest: RequestHandler = (req, res) => {
    const request = (req.body ?? {}) as Partial<TrackMedicineRequestDTO>;
    if (
        typeof request.requestReference !== 'string' ||
        !request.requestReference.trim() ||
        typeof request.trackingSecret !== 'string' ||
        !request.trackingSecret.trim()
    ) {
        res.status(400).json({
            success: false,
            message: 'Request reference and tracking secret are required'
        });
        return;
    }

    // Day 03 stub: tracking verification is not implemented yet.
    res.status(501).json({
        success: false,
        message: 'Medicine request tracking is not implemented yet'
    });
};

// GET /api/v1/public/medicine-requests/:reference/responses
const getRequestResponses: RequestHandler = (_req, res) => {
    // Do not expose responses without tracking authorization.
    res.status(501).json({
        success: false,
        message: 'Authorized request responses are not implemented yet'
    });
};

router.post('/', submitMedicineRequest);
router.post('/track', trackMedicineRequest);
router.get('/:reference/responses', getRequestResponses);

export default router;
