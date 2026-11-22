import { Router } from 'express';

import {
    getSettings,
    updateSettings
} from '../controllers/settingsController';

import {
    authenticate,
    requireSelectedPharmacy
} from '../middleware/authMiddleware';

import matchPharmacyParam from '../middleware/matchPharmacyParam';
import requirePermission from '../middleware/permissionMiddleware';

const router = Router({ mergeParams: true });

router.use(
    authenticate,
    requireSelectedPharmacy,
    matchPharmacyParam
);

router.get(
    '/',
    requirePermission(['pharmacy:settings', 'pharmacy:settings:read']),
    getSettings
);

router.put(
    '/',
    requirePermission('pharmacy:settings'),
    updateSettings
);

export default router;