import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

const requirePermission = (permission: string | string[]) => {
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

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
            requiredPermissions.some((reqPerm) =>
                userPermissions.includes(reqPerm) ||
                userPermissions.some((p) => p.endsWith(':*') && reqPerm.startsWith(p.slice(0, -1)))
            );

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
