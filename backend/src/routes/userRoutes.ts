import { Router } from 'express';

import {
    createUser,
    getUsers
} from '../controllers/userController';

import {
    authenticate,
    requireSelectedPharmacy
} from '../middleware/authMiddleware';

import requirePermission from '../middleware/permissionMiddleware';

const router = Router();

router.post(
    '/',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('users:create'),
    createUser
);

router.get(
    '/',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('users:read'),
    getUsers
);

export default router;