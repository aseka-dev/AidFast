import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyNotice extends Document {
    medicineId: mongoose.Types.ObjectId;
    noticeType: 'RECALL' | 'REVOCATION' | 'OTHER';
    referenceNumber: string;
    source: string;
    sourceUrl?: string;
    noticeDate: Date;
    description: string;
    affectedBatchNumbers: string[];
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
}

const safetyNoticeSchema = new Schema<ISafetyNotice>(
    {
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicineCatalog',
            required: true
        },
        noticeType: {
            type: String,
            enum: ['RECALL', 'REVOCATION', 'OTHER'],
            required: true
        },
        referenceNumber: {
            type: String,
            required: true,
            trim: true
        },
        source: {
            type: String,
            required: true,
            trim: true
        },
        sourceUrl: {
            type: String,
            trim: true
        },
        noticeDate: {
            type: Date,
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        affectedBatchNumbers: {
            type: [String],
            default: []
        },
        verificationStatus: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'REJECTED'],
            default: 'PENDING'
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: 'safetyNotices'
    }
);

safetyNoticeSchema.pre('validate', function () {
    if (this.verificationStatus === 'VERIFIED' && (!this.verifiedBy || !this.verifiedAt)) {
        this.invalidate(
            'verificationStatus',
            'A verified notice needs verifiedBy and verifiedAt'
        );
    }
});

safetyNoticeSchema.index({ medicineId: 1, verificationStatus: 1 });
safetyNoticeSchema.index({ referenceNumber: 1 });

export default mongoose.model<ISafetyNotice>('SafetyNotice', safetyNoticeSchema);