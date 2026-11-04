

export type SafetyAction = 'BLOCK' | 'QUARANTINE' | 'RELEASE';

export interface BatchSafetyRequest {
    pharmacyId: string;
    batchId: string;
    action: SafetyAction;
    reason: string;
    safetyNoticeId: string;
    requestedBy: string;
    idempotencyKey: string; // `${safetyNoticeId}:${batchId}:${action}`
}

export interface BatchSafetyResult {
    batchId: string;
    batchStatus: 'ACTIVE' | 'BLOCKED' | 'QUARANTINED' | 'EXPIRED' | 'DEPLETED';
    safetyStatus: 'CLEAR' | 'UNDER_REVIEW' | 'MATCHED' | 'RESOLVED';
    changed: boolean; // false when the same request was already applied
    updatedAt: string;
}

export type BatchSafetyErrorCode =
    | 'BATCH_NOT_FOUND'
    | 'CROSS_PHARMACY_ACCESS'
    | 'INVALID_TRANSITION';

export interface BatchSafetyService {
    applySafetyAction(request: BatchSafetyRequest): Promise<BatchSafetyResult>;
}

// MOCK: M2 replaces this with the real service. Nothing is saved to the database.
export const batchSafetyService: BatchSafetyService = {
    async applySafetyAction(request) {
        const batchStatus =
            request.action === 'BLOCK' ? 'BLOCKED'
            : request.action === 'QUARANTINE' ? 'QUARANTINED'
            : 'ACTIVE';
        const safetyStatus = request.action === 'RELEASE' ? 'RESOLVED' : 'MATCHED';
        return {
            batchId: request.batchId,
            batchStatus,
            safetyStatus,
            changed: true,
            updatedAt: new Date().toISOString()
        };
    }
};