import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

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

        if (!allowedRoles.includes(roleName.toUpperCase())) {
            res.status(400).json({
                message: 'Invalid role'
            });
            return;
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        const role = await Role.findOne({
            name: roleName.toUpperCase()
        });

        if (!role) {
            res.status(400).json({
                message: 'Role not found'
            });
            return;
        }

        let userToAssign = existingUser;

        if (!userToAssign) {
            const hashedPassword = await bcrypt.hash(password, 12);
            userToAssign = await User.create({
                fullName,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                isActive: true
            });
        }

        // Check if user is already an active member of this pharmacy
        const existingMembership = await PharmacyUser.findOne({
            userId: userToAssign._id,
            pharmacyId: req.user!.pharmacyId
        });

        if (existingMembership && existingMembership.isActive) {
            res.status(409).json({
                message: 'User is already an active member of this pharmacy'
            });
            return;
        }

        let membership;
        if (existingMembership) {
            existingMembership.isActive = true;
            existingMembership.roleId = role._id as any;
            membership = await existingMembership.save();
        } else {
            membership = await PharmacyUser.create({
                userId: userToAssign._id,
                pharmacyId: req.user!.pharmacyId,
                roleId: role._id,
                isActive: true
            });
        }

        await auditLogger({
            userId: req.user!.userId,
            pharmacyId: req.user!.pharmacyId,
            action: 'USER_CREATED',
            entity: 'User',
            entityId: userToAssign.id,
            description: `Added user ${userToAssign.email} with role ${role.name}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: userToAssign.id,
                fullName: userToAssign.fullName,
                email: userToAssign.email
            },
            role: role.name,
            membershipId: membership.id
        });

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
            pharmacyId: req.user?.pharmacyId
        })
            .populate('userId', 'fullName email isActive lastLogin createdAt')
            .populate('roleId', 'name permissions');

        res.status(200).json({
            count: memberships.length,
            users: memberships
                .filter((membership: any) => membership.userId)
                .map((membership: any) => ({
                    membershipId: membership.id,
                    isActive: membership.isActive,
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

export const removeUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { membershipId } = req.params;

        if (!membershipId || !mongoose.isValidObjectId(membershipId)) {
            res.status(400).json({
                message: 'Invalid membership ID'
            });
            return;
        }

        const membership = await PharmacyUser.findOne({
            _id: membershipId,
            pharmacyId: req.user?.pharmacyId
        });

        if (!membership) {
            res.status(404).json({
                message: 'Staff membership not found'
            });
            return;
        }

        if (String(membership.userId) === String(req.user?.userId)) {
            res.status(400).json({
                message: 'You cannot remove your own active membership'
            });
            return;
        }

        membership.isActive = false;
        await membership.save();

        await auditLogger({
            userId: req.user!.userId,
            pharmacyId: req.user!.pharmacyId,
            action: 'USER_DEACTIVATED',
            entity: 'PharmacyUser',
            entityId: membership.id,
            description: `Deactivated staff membership ${membershipId}`,
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'User removed from pharmacy successfully'
        });

    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({
            message: 'Unable to remove user'
        });
    }
};
