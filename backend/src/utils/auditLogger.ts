import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

export interface AuditData {
    userId?: string;
    pharmacyId?: string;
    action: string;
    entity: string;
    entityId?: string;
    description: string;
    ipAddress?: string;
}

const auditLogger = async (data: AuditData): Promise<void> => {
    // When running in offline/disconnected unit tests without an active mock,
    // skip write to prevent 10-second Mongoose buffer timeouts.
    const isMocked = typeof (AuditLog.create as any).mock !== 'undefined';
    if (mongoose.connection.readyState === 0 && !isMocked) {
        return;
    }

    try {
        await AuditLog.create({
            userId: data.userId,
            pharmacyId: data.pharmacyId,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            description: data.description,
            ipAddress: data.ipAddress
        });
    } catch (err) {
        // Fail-safe: Audit failure should not crash core operational business workflows
        if (process.env.NODE_ENV !== 'test') {
            console.error('AuditLogger error:', err);
        }
    }
};

export default auditLogger;
