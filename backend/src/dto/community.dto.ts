
export type AvailabilityStatus =
    | 'AVAILABLE'
    | 'LOW_AVAILABILITY'
    | 'OUT_OF_STOCK';

export type RequestStatus =
    | 'SUBMITTED'
    | 'ROUTED'
    | 'RESPONSES_RECEIVED'
    | 'CLOSED'
    | 'CANCELLED';

// Public medicine information
export interface PublicMedicineDTO {
    id: string;
    medicineName: string;
    genericName: string;
    brandTradeName: string;
    strength: string;
    dosageForm: string;
    prescriptionRequired: boolean;
}

// Public pharmacy information
export interface PublicPharmacyDTO {
    id: string;
    pharmacyName: string;
    address: string;
    city: string;
    district: string;
    phone?: string;
    openingHours?: unknown[];
}

// Public medicine availability
export interface PublicAvailabilityDTO {
    medicineId: string;
    pharmacyId: string;
    availabilityStatus: AvailabilityStatus;
    lastUpdatedAt: string;
}

// Guest medicine request input
export interface SubmitMedicineRequestDTO {
    medicineName: string;
    preferredBrandTradeName?: string;
    strength?: string;
    dosageForm?: string;
    additionalDetails?: string;
    preferredTownArea?: string;
    requestDestination:
        | 'NEARBY_PARTICIPATING_PHARMACIES'
        | 'SPECIFIC_PHARMACY';
    selectedPharmacyId?: string;
    contactPreference:
    | 'PHONE_CALL'
    | 'WHATSAPP'
    | 'SMS';
phone: string;
}

// Request submission response
export interface MedicineRequestReceiptDTO {
    requestReference: string;
    trackingSecret: string;
    requestStatus: RequestStatus;
    submittedAt: string;
}

// Request tracking input
export interface TrackMedicineRequestDTO {
    requestReference: string;
    trackingSecret: string;
}

// Safe request tracking response
export interface RequestTrackingDTO {
    requestReference: string;
    requestStatus: RequestStatus;
    submittedAt: string;
    responses: PharmacyResponseDTO[];
}

// Approved pharmacy response
export interface PharmacyResponseDTO {
    pharmacyName: string;
    responseStatus:
        | 'AVAILABLE'
        | 'LOW_AVAILABILITY'
        | 'OUT_OF_STOCK'
        | 'UNABLE_TO_CONFIRM';
    responseMessage?: string;
    respondedAt: string;
}
