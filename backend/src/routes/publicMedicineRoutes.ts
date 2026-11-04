
import { Router, RequestHandler } from 'express';
import {
    PublicMedicineDTO,
    PublicAvailabilityDTO
} from '../dto/community.dto';

const router = Router();

// GET /api/v1/public/medicines?q=paracetamol
const searchMedicines: RequestHandler = (req, res) => {
    const q = typeof req.query.q === 'string'
        ? req.query.q.trim()
        : '';

    // Day 03 stub: database search will be added later.
    const medicines: PublicMedicineDTO[] = [];

    res.status(200).json({
        success: true,
        message: 'Public medicine search API stub',
        query: q,
        data: medicines
    });
};

// GET /api/v1/public/medicines/:id/availability
const getMedicineAvailability: RequestHandler = (req, res) => {
    const medicineId = String(req.params.id);

    // Day 03 stub: availability snapshots will be
    // integrated with Member 2's service later.
    const availability: PublicAvailabilityDTO[] = [];

    res.status(200).json({
        success: true,
        message: 'Medicine availability API stub',
        medicineId,
        data: availability
    });
};

router.get('/', searchMedicines);
router.get('/:id/availability', getMedicineAvailability);

export default router;
