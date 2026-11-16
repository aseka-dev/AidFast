
import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestRecipient extends Document {
    requestId: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;

    deliveryStatus:
        | 'PENDING'
        | 'DELIVERED'
        | 'VIEWED'
        | 'DECLINED';

    contactStatus:
        | 'NOT_CONTACTED'
        | 'CONTACTED'
        | 'UNABLE_TO_CONTACT';

    deliveredAt?: Date;
    viewedAt?: Date;
    contactedAt?: Date;
}

const requestRecipientSchema = new Schema<IRequestRecipient>(
    {
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
        deliveryStatus: {
            type: String,
            enum: [
                'PENDING',
                'DELIVERED',
                'VIEWED',
                'DECLINED'
            ],
            default: 'PENDING'
        },
        contactStatus: {
            type: String,
            enum: [
                'NOT_CONTACTED',
                'CONTACTED',
                'UNABLE_TO_CONTACT'
            ],
            default: 'NOT_CONTACTED'
        },
        deliveredAt: {
            type: Date
        },
        viewedAt: {
            type: Date
        },
        contactedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: 'requestRecipients'
    }
);

// Prevent duplicate routing to the same pharmacy
requestRecipientSchema.index(
    { requestId: 1, pharmacyId: 1 },
    { unique: true }
);

export default mongoose.model<IRequestRecipient>(
    'RequestRecipient',
    requestRecipientSchema
);
