import { Router } from 'express';

import {
    getSettings,
    updateSettings
} from '../controllers/settingsController';

import {
    authenticate,
    requireSelectedPharmacy
} from '../middleware/authMiddleware';

import requirePermission from '../middleware/permissionMiddleware';

const router = Router();

router.get(
    '/',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('pharmacy:settings'),
    getSettings
);

router.put(
    '/',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('pharmacy:settings'),
    updateSettings
);

export default router;