import { Router } from 'express';

import {
    login,
    selectPharmacy,
    getMe,
    logout
} from '../controllers/authController';

import { authenticate } from '../middleware/authMiddleware';

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

export default router;