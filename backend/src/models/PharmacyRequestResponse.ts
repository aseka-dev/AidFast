
import mongoose, { Schema, Document } from 'mongoose';

export interface IPharmacyRequestResponse extends Document {
    requestRecipientId: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    respondedBy: mongoose.Types.ObjectId;
    responseStatus:
        | 'AVAILABLE'
        | 'LOW_AVAILABILITY'
        | 'OUT_OF_STOCK'
        | 'UNABLE_TO_CONFIRM';
    responseMessage?: string;
    respondedAt: Date;
    isVisibleToRequester: boolean;
}

const pharmacyRequestResponseSchema =
    new Schema<IPharmacyRequestResponse>(
        {
            requestRecipientId: {
                type: Schema.Types.ObjectId,
                ref: 'RequestRecipient',
                required: true
            },
            requestId: {
                type: Schema.Types.ObjectId,
                ref: 'MedicineAvailabilityRequest',
                required: true
            },
            pharmacyId: {
                type: Schema.Types.ObjectId,
                ref: 'Pharmacy',
                required: true
            },
            respondedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            responseStatus: {
                type: String,
                enum: [
                    'AVAILABLE',
                    'LOW_AVAILABILITY',
                    'OUT_OF_STOCK',
                    'UNABLE_TO_CONFIRM'
                ],
                required: true
            },
            responseMessage: {
                type: String,
                trim: true
            },
            respondedAt: {
                type: Date,
                default: Date.now
            },
            isVisibleToRequester: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true,
            collection: 'pharmacyRequestResponses'
        }
    );

export default mongoose.model<IPharmacyRequestResponse>(
    'PharmacyRequestResponse',
    pharmacyRequestResponseSchema
);
