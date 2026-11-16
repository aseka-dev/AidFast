
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

import RequestRecipient from '../models/RequestRecipient';
import MedicineAvailabilityRequest from '../models/MedicineAvailabilityRequest';

import { decryptPhone } from '../utils/phoneEncryption';

export const listCommunityRequests = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pharmacyId = req.user?.pharmacyId;

        if (!pharmacyId) {
            res.status(403).json({
                success: false,
                message: 'Pharmacy authorization required'
            });
            return;
        }

        // Extra protection: verify permission in the controller.
        const permissions = req.user?.permissions ?? [];

        if (
            !permissions.includes('*') &&
            !permissions.includes('community-requests:*') &&
            !permissions.includes('community-requests:read')
        ) {
            res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
            return;
        }

        // Find only requests routed to this pharmacy.
        const recipients = await RequestRecipient.find({
    pharmacyId,
    deliveryStatus: { $ne: 'DECLINED' }
}).sort({ createdAt: -1 });

        const results = [];

        for (const recipient of recipients) {
            const medicineRequest =
                await MedicineAvailabilityRequest.findById(
                    recipient.requestId
                ).select('+phoneEncrypted');

            if (!medicineRequest) {
                continue;
            }

            results.push({
                requestId: medicineRequest.id,
                medicineName: medicineRequest.medicineName,
                preferredBrandTradeName:
                    medicineRequest.preferredBrandTradeName,
                strength: medicineRequest.strength,
                dosageForm: medicineRequest.dosageForm,
                additionalDetails:
                    medicineRequest.additionalDetails,
                contactPreference:
                    medicineRequest.contactPreference,
                phone: decryptPhone(
                    medicineRequest.phoneEncrypted
                ),
                requestStatus:
                    medicineRequest.requestStatus,
                deliveryStatus:
                    recipient.deliveryStatus,
                contactStatus:
                    recipient.contactStatus,
                submittedAt:
                    medicineRequest.submittedAt
            });
        }

        res.status(200).json({
            success: true,
            count: results.length,
            requests: results
        });

    } catch (error) {
        console.error('Unable to retrieve community requests');

        res.status(500).json({
            success: false,
            message: 'Unable to retrieve community requests'
        });
    }
};
