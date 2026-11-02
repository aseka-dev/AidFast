import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import User from '../models/User';
import Role from '../models/Role';
import PharmacyUser from '../models/PharmacyUser';

import auditLogger from '../utils/auditLogger';
import { AuthRequest } from '../middleware/authMiddleware';

export const createUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { fullName, email, password, roleName } = req.body;

        if (!fullName || !email || !password || !roleName) {
            res.status(400).json({
                message: 'All fields are required'
            });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
            return;
        }

        const allowedRoles = [
            'ADMIN',
            'PHARMACIST',
            'STAFF',
            'VERIFIER'
        ];

        if (!allowedRoles.includes(roleName)) {
            res.status(400).json({
                message: 'Invalid role'
            });
            return;
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            res.status(409).json({
                message: 'Email already registered'
            });
            return;
        }

        const role = await Role.findOne({
            name: roleName
        });

        if (!role) {
            res.status(400).json({
                message: 'Role not found'
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            fullName,
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        try {
            const membership = await PharmacyUser.create({
                userId: user._id,
                pharmacyId: req.user!.pharmacyId,
                roleId: role._id,
                isActive: true
            });

            await auditLogger({
                userId: req.user!.userId,
                pharmacyId: req.user!.pharmacyId,
                action: 'USER_CREATED',
                entity: 'User',
                entityId: user.id,
                description: `Created user ${user.email} with role ${role.name}`,
                ipAddress: req.ip
            });

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email
                },
                role: role.name,
                membershipId: membership.id
            });

        } catch (error) {
            await User.deleteOne({ _id: user._id });
            throw error;
        }

    } catch (error) {
        console.error('Create user error:', error);

        res.status(500).json({
            message: 'Unable to create user'
        });
    }
};

export const getUsers = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const memberships = await PharmacyUser.find({
            pharmacyId: req.user?.pharmacyId,
            isActive: true
        })
            .populate('userId', 'fullName email isActive lastLogin')
            .populate('roleId', 'name permissions');

        res.status(200).json({
            count: memberships.length,
            users: memberships.map((membership: any) => ({
                membershipId: membership.id,
                user: membership.userId,
                role: membership.roleId
            }))
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to retrieve users'
        });
    }
};