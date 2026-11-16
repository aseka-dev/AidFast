
import crypto from 'node:crypto';
import mongoose from 'mongoose';

import MedicineAvailabilityRequest from '../models/MedicineAvailabilityRequest';
import RequestRecipient from '../models/RequestRecipient';

import type {
    SubmitMedicineRequestDTO,
    MedicineRequestReceiptDTO
} from '../dto/community.dto';

import { encryptPhone } from '../utils/phoneEncryption';

import {
    findPharmaciesByArea,
    findSpecificPharmacy
} from './pharmacyRoutingService';

const CONTACT_METHODS = [
    'PHONE_CALL',
    'WHATSAPP',
    'SMS'
] as const;

const REQUEST_DESTINATIONS = [
    'NEARBY_PARTICIPATING_PHARMACIES',
    'SPECIFIC_PHARMACY'
] as const;

function normalizeOptionalText(
    value: string | undefined,
    maxLength: number,
    fieldName: string
): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw new Error(`Invalid ${fieldName}`);
    }

    const normalized = value.trim();

    if (normalized.length > maxLength) {
        throw new Error(
            `${fieldName} must not exceed ${maxLength} characters`
        );
    }

    return normalized || undefined;
}

function validateMedicineRequest(
    input: SubmitMedicineRequestDTO
): void {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid medicine request');
    }

    if (
        typeof input.medicineName !== 'string' ||
        !input.medicineName.trim() ||
        input.medicineName.trim().length > 200
    ) {
        throw new Error('Valid medicine name is required');
    }

    if (
        !CONTACT_METHODS.some(
            method => method === input.contactPreference
        )
    ) {
        throw new Error('Invalid contact preference');
    }

    if (
        typeof input.phone !== 'string' ||
        !/^\+?[0-9]{9,15}$/.test(input.phone.trim())
    ) {
        throw new Error('Valid phone number is required');
    }

    if (input.consentAccepted !== true) {
        throw new Error('Customer consent is required');
    }

    if (
        !REQUEST_DESTINATIONS.some(
            destination => destination === input.requestDestination
        )
    ) {
        throw new Error('Invalid request destination');
    }

    if (
        input.requestDestination ===
        'SPECIFIC_PHARMACY'
    ) {
        if (
            !input.selectedPharmacyId ||
            !mongoose.isValidObjectId(
                input.selectedPharmacyId
            )
        ) {
            throw new Error('Valid selected pharmacy is required');
        }
    }

    if (
        input.requestDestination ===
        'NEARBY_PARTICIPATING_PHARMACIES'
    ) {
        if (
            typeof input.preferredTownArea !== 'string' ||
            !input.preferredTownArea.trim() ||
            input.preferredTownArea.trim().length > 100
        ) {
            throw new Error('Valid preferred area is required');
        }
    }

    normalizeOptionalText(
        input.preferredBrandTradeName,
        200,
        'Preferred brand'
    );

    normalizeOptionalText(
        input.strength,
        100,
        'Strength'
    );

    normalizeOptionalText(
        input.dosageForm,
        100,
        'Dosage form'
    );

    normalizeOptionalText(
        input.additionalDetails,
        1000,
        'Additional details'
    );

    normalizeOptionalText(
        input.preferredTownArea,
        100,
        'Preferred area'
    );
}

export async function submitMedicineRequest(
    input: SubmitMedicineRequestDTO
): Promise<MedicineRequestReceiptDTO> {
    // Step 1: Validate customer input.
    validateMedicineRequest(input);

    // Step 2: Find pharmacies based on request destination.
    let pharmacyIds: mongoose.Types.ObjectId[] = [];

    if (
        input.requestDestination ===
        'SPECIFIC_PHARMACY'
    ) {
        const pharmacy = await findSpecificPharmacy(
            input.selectedPharmacyId!
        );

        if (!pharmacy) {
            throw new Error(
                'Selected pharmacy is unavailable'
            );
        }

        pharmacyIds = [
            pharmacy._id as mongoose.Types.ObjectId
        ];
    } else {
        const pharmacies = await findPharmaciesByArea(
            input.preferredTownArea!.trim()
        );

        pharmacyIds = pharmacies.map(
            pharmacy =>
                pharmacy._id as mongoose.Types.ObjectId
        );
    }

    // Step 3: Remove duplicate pharmacy IDs.
    pharmacyIds = [
        ...new Map(
            pharmacyIds.map(id => [
                id.toString(),
                id
            ])
        ).values()
    ];

    if (pharmacyIds.length === 0) {
        throw new Error(
            'No eligible pharmacies found for this request'
        );
    }

    // Step 4: Encrypt the customer's phone number.
    const phoneEncrypted = encryptPhone(
        input.phone.trim()
    );

    // Internal reference only; no public tracking.
    const requestReference =
        `REQ-${crypto.randomUUID()}`;

    const submittedAt = new Date();

    // Step 5: Save the request and recipients atomically.
    return mongoose.connection.transaction(
        async session => {
            const [medicineRequest] =
                await MedicineAvailabilityRequest.create(
                    [
                        {
                            requestReference,

                            medicineName:
                                input.medicineName.trim(),

                            preferredBrandTradeName:
                                normalizeOptionalText(
                                    input.preferredBrandTradeName,
                                    200,
                                    'Preferred brand'
                                ),

                            strength:
                                normalizeOptionalText(
                                    input.strength,
                                    100,
                                    'Strength'
                                ),

                            dosageForm:
                                normalizeOptionalText(
                                    input.dosageForm,
                                    100,
                                    'Dosage form'
                                ),

                            additionalDetails:
                                normalizeOptionalText(
                                    input.additionalDetails,
                                    1000,
                                    'Additional details'
                                ),

                            preferredTownArea:
                                normalizeOptionalText(
                                    input.preferredTownArea,
                                    100,
                                    'Preferred area'
                                ),

                            requestDestination:
                                input.requestDestination,

                            selectedPharmacyId:
                                input.requestDestination ===
                                'SPECIFIC_PHARMACY'
                                    ? input.selectedPharmacyId
                                    : undefined,

                            contactPreference:
                                input.contactPreference,

                            phoneEncrypted,

                            consentAcceptedAt:
                                submittedAt,

                            requestStatus:
                                'SUBMITTED',

                            submittedAt
                        }
                    ],
                    { session }
                );

            // Step 6: Create one recipient for each pharmacy.
            await RequestRecipient.insertMany(
                pharmacyIds.map(pharmacyId => ({
                    requestId: medicineRequest._id,
                    pharmacyId,
                    deliveryStatus: 'PENDING',
                    contactStatus: 'NOT_CONTACTED'
                })),
                { session }
            );

            // Step 7: Mark request as routed.
            medicineRequest.requestStatus = 'ROUTED';

            await medicineRequest.save({ session });

            // Step 8: Return a safe acknowledgement.
            return {
                requestReference:
                    medicineRequest.requestReference,

                requestStatus:
                    medicineRequest.requestStatus,

                submittedAt:
                    medicineRequest.submittedAt.toISOString(),

                message:
                    'Your medicine request has been submitted successfully. ' +
                    'If the medicine is available, pharmacy staff may ' +
                    'contact you using your selected contact method.'
            };
        }
    );
}
