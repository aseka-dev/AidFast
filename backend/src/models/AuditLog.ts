import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId?: mongoose.Types.ObjectId;
    pharmacyId?: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId?: string;
    description: string;
    ipAddress?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy'
        },
        action: {
            type: String,
            required: true
        },
        entity: {
            type: String,
            required: true
        },
        entityId: {
            type: String
        },
        description: {
            type: String,
            required: true
        },
        ipAddress: {
            type: String
        }
    },
    {
        timestamps: true,
        collection: 'auditLogs'
    }
);

auditLogSchema.index({ pharmacyId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>(
    'AuditLog',
    auditLogSchema
);