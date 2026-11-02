import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';

import generateToken from '../utils/generateToken';
import auditLogger from '../utils/auditLogger';
import { AuthRequest } from '../middleware/authMiddleware';

export const login = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                message: 'Email and password are required'
            });
            return;
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select('+password');

        if (!user || !user.isActive) {
            res.status(401).json({
                message: 'Invalid email or password'
            });
            return;
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            res.status(401).json({
                message: 'Invalid email or password'
            });
            return;
        }

        const memberships = await PharmacyUser.find({
            userId: user._id,
            isActive: true
        }).populate('pharmacyId').populate('roleId');

        const availablePharmacies = memberships
            .filter((membership: any) =>
                membership.pharmacyId?.status === 'ACTIVE'
            )
            .map((membership: any) => ({
                pharmacyId: membership.pharmacyId._id,
                pharmacyName: membership.pharmacyId.name,
                role: membership.roleId.name,
                permissions: membership.roleId.permissions
            }));

        if (availablePharmacies.length === 0) {
            res.status(403).json({
                message: 'No active pharmacy membership found'
            });
            return;
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken({
            userId: user.id
        });

        await auditLogger({
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            description: 'User logged into AidFast',
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            },
            pharmacies: availablePharmacies
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export const selectPharmacy = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { pharmacyId } = req.body;

        if (!pharmacyId) {
            res.status(400).json({
                message: 'Pharmacy ID is required'
            });
            return;
        }

        const membership = await PharmacyUser.findOne({
            userId: req.user?.userId,
            pharmacyId,
            isActive: true
        }).populate('roleId');

        if (!membership) {
            res.status(403).json({
                message: 'You are not a member of this pharmacy'
            });
            return;
        }

        const pharmacy = await Pharmacy.findOne({
            _id: pharmacyId,
            status: 'ACTIVE'
        });

        if (!pharmacy) {
            res.status(404).json({
                message: 'Pharmacy not found or inactive'
            });
            return;
        }

        const role = membership.roleId as any;

        const token = generateToken({
            userId: req.user!.userId,
            pharmacyId: pharmacy.id
        });

        await auditLogger({
            userId: req.user!.userId,
            pharmacyId: pharmacy.id,
            action: 'PHARMACY_SELECTED',
            entity: 'Pharmacy',
            entityId: pharmacy.id,
            description: `Selected pharmacy: ${pharmacy.name}`,
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Pharmacy selected successfully',
            token,
            pharmacy: {
                id: pharmacy.id,
                name: pharmacy.name
            },
            role: role.name,
            permissions: role.permissions
        });

    } catch (error) {
        console.error('Pharmacy selection error:', error);

        res.status(500).json({
            message: 'Unable to select pharmacy'
        });
    }
};

export const getMe = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const user = await User.findById(req.user?.userId)
            .select('-password');

        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            user,
            pharmacyId: req.user?.pharmacyId,
            role: req.user?.role,
            permissions: req.user?.permissions
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to retrieve user details'
        });
    }
};

export const logout = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        await auditLogger({
            userId: req.user?.userId,
            pharmacyId: req.user?.pharmacyId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: req.user?.userId,
            description: 'User logged out',
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Logout successful. Please discard your token.'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to complete logout'
        });
    }
};