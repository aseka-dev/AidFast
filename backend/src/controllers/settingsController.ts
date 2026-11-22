import { Response } from 'express';
import PharmacySetting from '../models/PharmacySetting';
import Pharmacy from '../models/Pharmacy';
import { AuthRequest } from '../middleware/authMiddleware';
import auditLogger from '../utils/auditLogger';

/**
 * Validate IANA timezone string using JavaScript standard Intl API.
 */
export const isValidTimezone = (tz: unknown): boolean => {
    if (typeof tz !== 'string' || !tz.trim()) return false;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
        return true;
    } catch {
        return false;
    }
};

export const getSettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const rawPharmacyId = req.params.pharmacyId || req.user?.pharmacyId;
        const pharmacyId = String(Array.isArray(rawPharmacyId) ? rawPharmacyId[0] : rawPharmacyId);

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
            success: true,
            pharmacy,
            settings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'Unable to retrieve settings'
        });
    }
};

export const updateSettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const rawPharmacyId = req.params.pharmacyId || req.user?.pharmacyId;
        const pharmacyId = String(Array.isArray(rawPharmacyId) ? rawPharmacyId[0] : rawPharmacyId);
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
        } = req.body || {};

        // 1. Validate Timezone (must be valid IANA timezone)
        if (timezone !== undefined) {
            if (!isValidTimezone(timezone)) {
                res.status(400).json({
                    success: false,
                    status: 'fail',
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid IANA timezone specified'
                });
                return;
            }
        }

        // 2. Validate Public Availability Visibility (must be boolean)
        if (publicAvailabilityEnabled !== undefined) {
            if (typeof publicAvailabilityEnabled !== 'boolean') {
                res.status(400).json({
                    success: false,
                    status: 'fail',
                    code: 'VALIDATION_ERROR',
                    message: 'publicAvailabilityEnabled must be a boolean'
                });
                return;
            }
        }

        // 3. Validate Low Stock Threshold (must be non-negative integer)
        if (lowStockThreshold !== undefined) {
            if (typeof lowStockThreshold !== 'number' || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
                res.status(400).json({
                    success: false,
                    status: 'fail',
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid low stock threshold'
                });
                return;
            }
        }

        // 4. Validate Expiry Alert Months (must be [12, 9, 6] subset/valid intervals)
        if (expiryAlertMonths !== undefined) {
            if (
                !Array.isArray(expiryAlertMonths) ||
                expiryAlertMonths.length === 0 ||
                expiryAlertMonths.some(
                    (month: unknown) =>
                        typeof month !== 'number' ||
                        !Number.isInteger(month) ||
                        ![12, 9, 6].includes(month as number)
                )
            ) {
                res.status(400).json({
                    success: false,
                    status: 'fail',
                    code: 'VALIDATION_ERROR',
                    message: 'Expiry alerts must use 12, 9 or 6 months'
                });
                return;
            }
        }

        // 5. Update Pharmacy Profile if profile fields supplied
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

        // 6. Update or Upsert Pharmacy Settings
        const settings = await PharmacySetting.findOneAndUpdate(
            {
                pharmacyId
            },
            {
                $set: {
                    ...(timezone !== undefined && { timezone: timezone.trim() }),
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

        // 7. Record Operational Audit Trail
        await auditLogger({
            userId: req.user!.userId,
            pharmacyId: String(pharmacyId),
            action: 'SETTINGS_UPDATED',
            entity: 'PharmacySetting',
            entityId: String(settings.id || settings._id),
            description: `Updated pharmacy settings: timezone=${settings.timezone}, lowStockThreshold=${settings.lowStockThreshold}, publicAvailability=${settings.publicAvailabilityEnabled}, expiryAlertMonths=[${settings.expiryAlertMonths.join(', ')}]`,
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            pharmacy: updatedPharmacy,
            settings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'Unable to update settings'
        });
    }
};
