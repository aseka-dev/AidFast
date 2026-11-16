
import { Router, RequestHandler } from 'express';
import type {
    SubmitMedicineRequestDTO
} from '../dto/community.dto';

import {
    submitMedicineRequest as saveMedicineRequest
} from '../services/medicineRequestService';

const router = Router();

// POST /api/v1/public/medicine-requests
const submitMedicineRequest: RequestHandler = async (req, res) => {

    const request = (req.body ?? {}) as Partial<SubmitMedicineRequestDTO>;

    // Validate medicine name
    if (
        typeof request.medicineName !== 'string' ||
        !request.medicineName.trim()
    ) {
        res.status(400).json({
            success: false,
            message: 'Medicine name is required'
        });
        return;
    }

    // Validate request destination
    if (
        request.requestDestination !== 'NEARBY_PARTICIPATING_PHARMACIES' &&
        request.requestDestination !== 'SPECIFIC_PHARMACY'
    ) {
        res.status(400).json({
            success: false,
            message: 'Valid request destination is required'
        });
        return;
    }

    // Validate selected pharmacy
    if (
        request.requestDestination === 'SPECIFIC_PHARMACY' &&
        (
            typeof request.selectedPharmacyId !== 'string' ||
            !request.selectedPharmacyId.trim()
        )
    ) {
        res.status(400).json({
            success: false,
            message: 'Please select a pharmacy'
        });
        return;
    }

    // Validate preferred area
    if (
        request.requestDestination === 'NEARBY_PARTICIPATING_PHARMACIES' &&
        (
            typeof request.preferredTownArea !== 'string' ||
            !request.preferredTownArea.trim()
        )
    ) {
        res.status(400).json({
            success: false,
            message: 'Preferred town or area is required'
        });
        return;
    }

    // Validate contact method
    if (
        request.contactPreference !== 'PHONE_CALL' &&
        request.contactPreference !== 'WHATSAPP' &&
        request.contactPreference !== 'SMS'
    ) {
        res.status(400).json({
            success: false,
            message: 'Please select a valid contact method'
        });
        return;
    }

    // Validate phone number
    if (
        typeof request.phone !== 'string' ||
        !/^\+?[0-9]{9,15}$/.test(request.phone.trim())
    ) {
        res.status(400).json({
            success: false,
            message: 'Valid phone number is required'
        });
        return;
    }

    // Validate customer consent
    if (request.consentAccepted !== true) {
        res.status(400).json({
            success: false,
            message: 'Customer consent is required'
        });
        return;
    }

    // Submit the request through the service layer.
// The service handles encryption and pharmacy routing.
        try {
        const result = await saveMedicineRequest(
            request as SubmitMedicineRequestDTO
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(
            'Medicine request submission failed:',
            error instanceof Error ? error.message : 'Unknown error'
        );

        res.status(500).json({
            success: false,
            message: 'Unable to submit medicine request'
        });
    }
};

router.post('/', submitMedicineRequest);

export default router;
