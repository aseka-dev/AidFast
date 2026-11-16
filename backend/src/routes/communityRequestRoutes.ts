
import { Router } from 'express';

import { authenticate } from '../middleware/authMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import requirePermission from '../middleware/permissionMiddleware';

import {
    listCommunityRequests
} from '../controllers/communityRequestController';

const router = Router();

const base = '/pharmacies/:pharmacyId';

// GET requests received by the selected pharmacy
router.get(
    `${base}/community-requests`,
    authenticate,
    matchPharmacyParam,
    requirePermission('community-requests:read'),
    listCommunityRequests
);

export default router;
