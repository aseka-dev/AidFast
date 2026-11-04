import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyNoticeMatch extends Document {
    pharmacyId: mongoose.Types.ObjectId;
    safetyNoticeId: mongoose.Types.ObjectId;
    batchId: mongoose.Types.ObjectId;
    matchStatus: 'POTENTIAL' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';
    actionTaken: 'NONE' | 'BLOCKED' | 'QUARANTINED' | 'RELEASED';
    matchedAt: Date;
    actionAt?: Date;
    actionTakenBy?: mongoose.Types.ObjectId;
    reason?: string;
}

const safetyNoticeMatchSchema = new Schema<ISafetyNoticeMatch>(
    {
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy',
            required: true
        },
        safetyNoticeId: {
            type: Schema.Types.ObjectId,
            ref: 'SafetyNotice',
            required: true
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            required: true
        },
        matchStatus: {
            type: String,
            enum: ['POTENTIAL', 'CONFIRMED', 'DISMISSED', 'RESOLVED'],
            default: 'POTENTIAL'
        },
        actionTaken: {
            type: String,
            enum: ['NONE', 'BLOCKED', 'QUARANTINED', 'RELEASED'],
            default: 'NONE'
        },
        matchedAt: {
            type: Date,
            default: Date.now
        },
        actionAt: {
            type: Date
        },
        actionTakenBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
        collection: 'safetyNoticeMatches'
    }
);

safetyNoticeMatchSchema.index(
    { pharmacyId: 1, safetyNoticeId: 1, batchId: 1 },
    { unique: true }
);

export default mongoose.model<ISafetyNoticeMatch>(
    'SafetyNoticeMatch',
    safetyNoticeMatchSchema
);