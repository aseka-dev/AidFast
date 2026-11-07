import { Response } from 'express';
import PharmacySetting from '../models/PharmacySetting';
import Pharmacy from '../models/Pharmacy';
import { AuthRequest } from '../middleware/authMiddleware';
import auditLogger from '../utils/auditLogger';

export const getSettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pharmacyId = req.user?.pharmacyId;

        const pharmacy = await Pharmacy.findById(pharmacyId).select(
            'name address contactNumber email registrationNumber status'
        );

        let settings = await PharmacySetting.findOne({
            pharmacyId
        });

        if (!settings && pharmacyId) {
            settings = await PharmacySetting.create({
                pharmacyId,
                timezone: 'Asia/Colombo',
                lowStockThreshold: 10,
                publicAvailabilityEnabled: true,
                expiryAlertMonths: [12, 9, 6],
                dateFormat: 'DD MMM YYYY',
                currency: 'LKR — Sri Lankan Rupee'
            });
        }

        res.status(200).json({
            pharmacy,
            settings
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to retrieve settings'
        });
    }
};

export const updateSettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pharmacyId = req.user?.pharmacyId;
        const {
            // Pharmacy Profile fields
            name,
            address,
            contactNumber,
            email,
            // Operational alert settings
            timezone,
            lowStockThreshold,
            publicAvailabilityEnabled,
            expiryAlertMonths,
            // System settings
            dateFormat,
            currency
        } = req.body;

        if (
            lowStockThreshold !== undefined &&
            (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)
        ) {
            res.status(400).json({
                message: 'Invalid low stock threshold'
            });
            return;
        }

        if (
            expiryAlertMonths !== undefined &&
            (
                !Array.isArray(expiryAlertMonths) ||
                expiryAlertMonths.some(
                    (month: unknown) =>
                        !Number.isInteger(month) ||
                        ![12, 9, 6].includes(month as number)
                )
            )
        ) {
            res.status(400).json({
                message: 'Expiry alerts must use 12, 9 or 6 months'
            });
            return;
        }

        // 1. Update Pharmacy Profile if fields supplied
        let updatedPharmacy = null;
        if (name || address || contactNumber !== undefined || email !== undefined) {
            updatedPharmacy = await Pharmacy.findByIdAndUpdate(
                pharmacyId,
                {
                    ...(name && { name }),
                    ...(address && { address }),
                    ...(contactNumber !== undefined && { contactNumber }),
                    ...(email !== undefined && { email })
                },
                { new: true, runValidators: true }
            );
        } else {
            updatedPharmacy = await Pharmacy.findById(pharmacyId);
        }

        // 2. Update Pharmacy Settings
        const settings = await PharmacySetting.findOneAndUpdate(
            {
                pharmacyId
            },
            {
                $set: {
                    ...(timezone !== undefined && { timezone }),
                    ...(lowStockThreshold !== undefined && {
                        lowStockThreshold
                    }),
                    ...(publicAvailabilityEnabled !== undefined && {
                        publicAvailabilityEnabled
                    }),
                    ...(expiryAlertMonths !== undefined && {
                        expiryAlertMonths
                    }),
                    ...(dateFormat !== undefined && { dateFormat }),
                    ...(currency !== undefined && { currency })
                },
                $setOnInsert: {
                    pharmacyId
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        await auditLogger({
            userId: req.user!.userId,
            pharmacyId: req.user!.pharmacyId,
            action: 'SETTINGS_UPDATED',
            entity: 'PharmacySetting',
            entityId: settings.id,
            description: 'Pharmacy settings and profile updated',
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Settings updated successfully',
            pharmacy: updatedPharmacy,
            settings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            message: 'Unable to update settings'
        });
    }
};
