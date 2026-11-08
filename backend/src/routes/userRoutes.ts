import { Router } from 'express';

import {
    createUser,
    getUsers,
    removeUser,
    updateUserRole
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

router.put(
    '/:membershipId/role',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('users:update'),
    updateUserRole
);

router.delete(
    '/:membershipId',
    authenticate,
    requireSelectedPharmacy,
    requirePermission('users:delete'),
    removeUser
);

export default router;
