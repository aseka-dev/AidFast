import { Response } from 'express';
import PharmacySetting from '../models/PharmacySetting';
import { AuthRequest } from '../middleware/authMiddleware';
import auditLogger from '../utils/auditLogger';

export const getSettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const settings = await PharmacySetting.findOne({
            pharmacyId: req.user?.pharmacyId
        });

        res.status(200).json({
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
        const {
            timezone,
            lowStockThreshold,
            publicAvailabilityEnabled,
            expiryAlertMonths
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

        const settings = await PharmacySetting.findOneAndUpdate(
            {
                pharmacyId: req.user?.pharmacyId
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
                    })
                },
                $setOnInsert: {
                    pharmacyId: req.user?.pharmacyId
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
            description: 'Pharmacy settings updated',
            ipAddress: req.ip
        });

        res.status(200).json({
            message: 'Settings updated successfully',
            settings
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to update settings'
        });
    }
};