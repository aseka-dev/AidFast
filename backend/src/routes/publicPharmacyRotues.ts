
import { Router, RequestHandler } from 'express';
import type { PublicPharmacyDTO } from '../dto/community.dto';

const router = Router();

// GET /api/v1/public/pharmacies?area=Kandana
const getPublicPharmacies: RequestHandler = (req, res) => {
    const area = typeof req.query.area === 'string'
        ? req.query.area.trim()
        : '';

    // Day 03 stub: public pharmacy database queries
    // will be implemented later.
    const pharmacies: PublicPharmacyDTO[] = [];

    res.status(200).json({
        success: true,
        message: 'Public pharmacy directory API stub',
        area,
        data: pharmacies
    });
};

// GET /api/v1/public/pharmacies/:id
const getPublicPharmacyById: RequestHandler = (req, res) => {
    const pharmacyId = String(req.params.id);

    // Day 03 stub: pharmacy details will be
    // retrieved from MongoDB later.
    res.status(501).json({
        success: false,
        message: 'Public pharmacy details not implemented yet',
        pharmacyId
    });
};

router.get('/', getPublicPharmacies);
router.get('/:id', getPublicPharmacyById);

export default router;
