import AuditLog from '../models/AuditLog';

interface AuditData {
    userId?: string;
    pharmacyId?: string;
    action: string;
    entity: string;
    entityId?: string;
    description: string;
    ipAddress?: string;
}

const auditLogger = async (data: AuditData): Promise<void> => {
    await AuditLog.create({
        userId: data.userId,
        pharmacyId: data.pharmacyId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        ipAddress: data.ipAddress
    });
};

export default auditLogger;