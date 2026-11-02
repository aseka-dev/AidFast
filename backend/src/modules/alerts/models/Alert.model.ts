import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
    pharmacyId: mongoose.Types.ObjectId;
    medicineId: mongoose.Types.ObjectId;
    batchId?: mongoose.Types.ObjectId;
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRY' | 'RECALL_MATCH';
    alertLevel: 'INFO' | 'ALERT' | 'WARNING' | 'CRITICAL';
    message: string;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
    dedupeKey: string;
    resolvedAt?: Date;
}

const alertSchema = new Schema<IAlert>(
    {
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy',
            required: true
        },
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicineCatalog',
            required: true
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch'
        },
        alertType: {
            type: String,
            enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY', 'RECALL_MATCH'],
            required: true
        },
        alertLevel: {
            type: String,
            enum: ['INFO', 'ALERT', 'WARNING', 'CRITICAL'],
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
            default: 'OPEN'
        },
        dedupeKey: {
            type: String,
            required: true,
            trim: true
        },
        resolvedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: 'alerts'
    }
);

alertSchema.index({ pharmacyId: 1, dedupeKey: 1 }, { unique: true });
alertSchema.index({ pharmacyId: 1, status: 1, alertLevel: 1 });

export default mongoose.model<IAlert>('Alert', alertSchema);