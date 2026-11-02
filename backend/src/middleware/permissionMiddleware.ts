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

        if (!req.user.permissions?.includes(permission)) {
            res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
            return;
        }

        next();
    };
};

export default requirePermission;