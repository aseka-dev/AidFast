import { Router } from 'express';

import {
    login,
    selectPharmacy,
    getMe,
    logout,
    changePassword,
    getAuditLogs
} from '../controllers/authController';

import { authenticate, requireSelectedPharmacy } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);

router.post(
    '/select-pharmacy',
    authenticate,
    selectPharmacy
);

router.get(
    '/me',
    authenticate,
    getMe
);

router.post(
    '/logout',
    authenticate,
    logout
);

router.post(
    '/change-password',
    authenticate,
    changePassword
);

router.get(
    '/audit-logs',
    authenticate,
    requireSelectedPharmacy,
    getAuditLogs
);

export default router;
