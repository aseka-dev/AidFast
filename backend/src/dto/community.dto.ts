
export type AvailabilityStatus =
    | 'AVAILABLE'
    | 'LOW_AVAILABILITY'
    | 'OUT_OF_STOCK';

export type RequestStatus =
    | 'SUBMITTED'
    | 'ROUTED'
    | 'CONTACTED'
    | 'CLOSED'
    | 'CANCELLED';

export type ContactPreference =
    | 'PHONE_CALL'
    | 'WHATSAPP'
    | 'SMS';

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

// Customer medicine request
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

    contactPreference: ContactPreference;
    phone: string;
    consentAccepted: boolean;
}

// Request submission acknowledgement
// Internal reference only; no customer tracking.
export interface MedicineRequestReceiptDTO {
    requestReference: string;
    requestStatus: RequestStatus;
    submittedAt: string;
    message: string;
}

// Pharmacy staff request information
// Only available to authorized recipient pharmacies.
export interface PharmacyRequestDTO {
    requestId: string;
    medicineName: string;
    preferredBrandTradeName?: string;
    strength?: string;
    dosageForm?: string;
    additionalDetails?: string;
    preferredTownArea?: string;
    contactPreference: ContactPreference;
    phone: string;
    requestStatus: RequestStatus;
    submittedAt: string;
}

// Internal pharmacy contact update
export interface PharmacyContactUpdateDTO {
    contactStatus: 'CONTACTED' | 'UNABLE_TO_CONTACT';
    notes?: string;
}
