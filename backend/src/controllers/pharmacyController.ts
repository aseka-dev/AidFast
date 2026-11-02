import { Response } from 'express';
import PharmacyUser from '../models/PharmacyUser';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMyPharmacies = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const memberships = await PharmacyUser.find({
            userId: req.user?.userId,
            isActive: true
        })
            .populate({
                path: 'pharmacyId',
                match: { status: 'ACTIVE' },
                select: 'name address contactNumber email'
            })
            .populate('roleId');

        const pharmacies = memberships
            .filter((item: any) => item.pharmacyId)
            .map((item: any) => ({
                pharmacy: item.pharmacyId,
                role: item.roleId.name,
                permissions: item.roleId.permissions
            }));

        res.status(200).json({
            count: pharmacies.length,
            pharmacies
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to retrieve pharmacies'
        });
    }
};