import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role, { RoleName } from '../models/Role';
import { ROLE_PERMISSIONS } from '../config/permissions';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        pharmacyId?: string;
        role?: string;
        permissions?: string[];
    };
}

interface TokenData {
    userId: string;
    pharmacyId?: string;
    iat: number;
    exp: number;
    iss: string;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                code: 'INVALID_TOKEN',
                message: 'Authentication token required'
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, secret, {
            issuer: 'aidfast-api'
        }) as TokenData;

        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            res.status(401).json({
                message: 'User account is inactive or unavailable'
            });
            return;
        }

        let role: string | undefined;
        let permissions: string[] = [];

        if (decoded.pharmacyId) {
            const pharmacy = await Pharmacy.findOne({
                _id: decoded.pharmacyId,
                status: 'ACTIVE'
            });

            if (!pharmacy) {
                res.status(403).json({
                    message: 'Selected pharmacy is unavailable'
                });
                return;
            }

            const membership = await PharmacyUser.findOne({
                userId: user._id,
                pharmacyId: decoded.pharmacyId,
                isActive: true
            });

            if (!membership) {
                res.status(403).json({
                    message: 'You are not authorized for this pharmacy'
                });
                return;
            }

            const roleRecord = await Role.findById(membership.roleId);

            if (!roleRecord) {
                res.status(403).json({
                    message: 'User role not found'
                });
                return;
            }

            role = roleRecord.name;
            const roleName = (roleRecord.name || '').toUpperCase() as RoleName;
            const configPermissions = ROLE_PERMISSIONS[roleName]?.permissions || [];
            permissions = Array.from(new Set([...configPermissions, ...(roleRecord.permissions || [])]));
        }

        req.user = {
            userId: user.id,
            pharmacyId: decoded.pharmacyId,
            role,
            permissions
        };

        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired authentication token'
        });
    }
};

export const requireSelectedPharmacy = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user?.pharmacyId) {
        res.status(400).json({
            success: false,
            status: 'fail',
            code: 'PHARMACY_SELECTION_REQUIRED',
            message: 'Please select a pharmacy first'
        });
        return;
    }

    next();
};