
import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestRecipient extends Document {
    requestId: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    deliveryStatus:
        | 'PENDING'
        | 'DELIVERED'
        | 'VIEWED'
        | 'DECLINED';
    deliveredAt?: Date;
    viewedAt?: Date;
    respondedAt?: Date;
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
        deliveredAt: {
            type: Date
        },
        viewedAt: {
            type: Date
        },
        respondedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: 'requestRecipients'
    }
);

// Prevent sending the same request to
// the same pharmacy more than once.
requestRecipientSchema.index(
    { requestId: 1, pharmacyId: 1 },
    { unique: true }
);

export default mongoose.model<IRequestRecipient>(
    'RequestRecipient',
    requestRecipientSchema
);
