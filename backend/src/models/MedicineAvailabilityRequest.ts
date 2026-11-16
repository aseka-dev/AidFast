
import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineAvailabilityRequest extends Document {
    requestReference: string;
    medicineId?: mongoose.Types.ObjectId;
    medicineName: string;
    preferredBrandTradeName?: string;
    strength?: string;
    dosageForm?: string;
    additionalDetails?: string;
    preferredTownArea?: string;

    requestDestination:
        | 'NEARBY_PARTICIPATING_PHARMACIES'
        | 'SPECIFIC_PHARMACY';

    selectedPharmacyId?: mongoose.Types.ObjectId;

    contactPreference: 'PHONE_CALL' | 'WHATSAPP' | 'SMS';
    phoneEncrypted: string;
    consentAcceptedAt: Date;

    requestStatus:
        | 'SUBMITTED'
        | 'ROUTED'
        | 'CONTACTED'
        | 'CLOSED'
        | 'CANCELLED';

    submittedAt: Date;
    closedAt?: Date;
}

const medicineAvailabilityRequestSchema =
    new Schema<IMedicineAvailabilityRequest>(
        {
            requestReference: {
                type: String,
                required: true,
                unique: true,
                trim: true
            },
            medicineId: {
                type: Schema.Types.ObjectId,
                ref: 'MedicineCatalog'
            },
            medicineName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },
            preferredBrandTradeName: {
                type: String,
                trim: true
            },
            strength: {
                type: String,
                trim: true
            },
            dosageForm: {
                type: String,
                trim: true
            },
            additionalDetails: {
                type: String,
                trim: true
            },
            preferredTownArea: {
                type: String,
                trim: true,
                maxlength: 100
            },
            requestDestination: {
                type: String,
                enum: [
                    'NEARBY_PARTICIPATING_PHARMACIES',
                    'SPECIFIC_PHARMACY'
                ],
                required: true
            },
            selectedPharmacyId: {
                type: Schema.Types.ObjectId,
                ref: 'Pharmacy'
            },
            contactPreference: {
                type: String,
                enum: ['PHONE_CALL', 'WHATSAPP', 'SMS'],
                required: true
            },
            phoneEncrypted: {
                type: String,
                required: true,
                select: false
            },
            consentAcceptedAt: {
                type: Date,
                required: true
            },
            requestStatus: {
                type: String,
                enum: [
                    'SUBMITTED',
                    'ROUTED',
                    'CONTACTED',
                    'CLOSED',
                    'CANCELLED'
                ],
                default: 'SUBMITTED'
            },
            submittedAt: {
                type: Date,
                default: Date.now
            },
            closedAt: {
                type: Date
            }
        },
        {
            timestamps: true,
            collection: 'medicineAvailabilityRequests'
        }
    );

export default mongoose.model<IMedicineAvailabilityRequest>(
    'MedicineAvailabilityRequest',
    medicineAvailabilityRequestSchema
);
