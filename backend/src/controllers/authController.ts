import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import AuditLog from '../models/AuditLog';

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
            try {
                await auditLogger({
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    description: `Failed login attempt: ${email.toLowerCase().trim()} (User not found or inactive)`,
                    ipAddress: req.ip
                });
            } catch (auditErr) {
                console.warn('Audit logger warning:', auditErr);
            }

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
            try {
                await auditLogger({
                    userId: user.id,
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: user.id,
                    description: `Failed login attempt: ${user.email} (Incorrect password)`,
                    ipAddress: req.ip
                });
            } catch (auditErr) {
                console.warn('Audit logger warning:', auditErr);
            }

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
            try {
                await auditLogger({
                    userId: user.id,
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: user.id,
                    description: `Login denied: ${user.email} (No active pharmacy membership)`,
                    ipAddress: req.ip
                });
            } catch (auditErr) {
                console.warn('Audit logger warning:', auditErr);
            }

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

        if (!mongoose.isValidObjectId(pharmacyId)) {
            res.status(400).json({
                message: 'Invalid pharmacy ID format. Must be a 24-character hex string.'
            });
            return;
        }

        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication context missing'
            });
            return;
        }

        const membership = await PharmacyUser.findOne({
            userId,
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
        if (!role || !role.name) {
            res.status(500).json({
                message: 'User role configuration not found for this pharmacy'
            });
            return;
        }

        const token = generateToken({
            userId: String(userId),
            pharmacyId: String(pharmacy._id)
        });

        try {
            await auditLogger({
                userId: String(userId),
                pharmacyId: String(pharmacy._id),
                action: 'PHARMACY_SELECTED',
                entity: 'Pharmacy',
                entityId: String(pharmacy._id),
                description: `Selected pharmacy: ${pharmacy.name}`,
                ipAddress: req.ip
            });
        } catch (auditError) {
            console.warn('Audit logger warning (non-fatal):', auditError);
        }

        res.status(200).json({
            message: 'Pharmacy selected successfully',
            token,
            pharmacy: {
                id: String(pharmacy._id),
                name: pharmacy.name
            },
            role: role.name,
            permissions: role.permissions || []
        });

    } catch (error: any) {
        console.error('Select pharmacy error:', error);

        res.status(500).json({
            message: error?.message || 'Unable to select pharmacy'
        });
    }
};

export const getMe = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const user = await User.findById(req.user?.userId);

        if (!user || !user.isActive) {
            res.status(404).json({
                message: 'User not found or inactive'
            });
            return;
        }

        res.status(200).json({
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                lastLogin: user.lastLogin
            },
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

export const changePassword = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({
                message: 'Current password and new password are required'
            });
            return;
        }

        if (newPassword.length < 8) {
            res.status(400).json({
                message: 'New password must contain at least 8 characters'
            });
            return;
        }

        const user = await User.findById(req.user?.userId).select('+password');
        if (!user) {
            res.status(404).json({
                message: 'User account not found'
            });
            return;
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            await auditLogger({
                userId: user.id,
                pharmacyId: req.user?.pharmacyId,
                action: 'PASSWORD_CHANGE_FAILED',
                entity: 'User',
                entityId: user.id,
                description: 'Failed password change: current password incorrect',
                ipAddress: req.ip
            });

            res.status(401).json({
                message: 'Current password is incorrect'
            });
            return;
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        await auditLogger({
            userId: user.id,
            pharmacyId: req.user?.pharmacyId,
            action: 'PASSWORD_CHANGED',
            entity: 'User',
            entityId: user.id,
            description: 'User successfully changed password',
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            message: 'Unable to change password'
        });
    }
};

export const getAuditLogs = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pharmacyId = req.user?.pharmacyId;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const action = req.query.action as string | undefined;

        const filter: any = {};
        if (pharmacyId) {
            filter.$or = [
                { pharmacyId },
                { userId: req.user?.userId }
            ];
        } else {
            filter.userId = req.user?.userId;
        }

        if (action) {
            filter.action = action.toUpperCase();
        }

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('userId', 'fullName email');

        res.status(200).json({
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error('Retrieve audit logs error:', error);
        res.status(500).json({
            message: 'Unable to retrieve audit logs'
        });
    }
};