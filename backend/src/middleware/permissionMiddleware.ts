import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

const requirePermission = (permission: string) => {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user?.pharmacyId) {
            res.status(403).json({
                message: 'Pharmacy selection required'
            });
            return;
        }

        const userPermissions = req.user.permissions || [];
        const hasPermission =
            userPermissions.includes('*') ||
            userPermissions.includes(permission) ||
            userPermissions.some((p) => p.endsWith(':*') && permission.startsWith(p.slice(0, -1)));

        if (!hasPermission) {
            res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
            return;
        }

        next();
    };
};

export default requirePermission;
