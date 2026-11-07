import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { batchSafetyService, SafetyAction } from '../services/batchSafetyContract';

const notImplemented = (res: Response, name: string, plannedDay: number) =>
    res.status(501).json({ message: `${name} is not implemented yet`, plannedDay });

export const listSafetyNotices = (_req: Request, res: Response) =>
    notImplemented(res, 'listSafetyNotices', 8);

export const createSafetyNotice = (_req: Request, res: Response) =>
    notImplemented(res, 'createSafetyNotice', 8);

export const verifySafetyNotice = (_req: Request, res: Response) =>
    notImplemented(res, 'verifySafetyNotice', 8);

export const rejectSafetyNotice = (_req: Request, res: Response) =>
    notImplemented(res, 'rejectSafetyNotice', 8);

export const listSafetyMatches = (_req: Request, res: Response) =>
    notImplemented(res, 'listSafetyMatches', 9);

export const runSafetyMatching = (_req: Request, res: Response) =>
    notImplemented(res, 'runSafetyMatching', 9);

// Validates input and calls the M2 contract (mock for now, nothing saved).
export const applySafetyAction = async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;
    const { action, reason, batchId, safetyNoticeId } = req.body as {
        action?: SafetyAction;
        reason?: string;
        batchId?: string;
        safetyNoticeId?: string;
    };

    if (!action || !['BLOCK', 'QUARANTINE', 'RELEASE'].includes(action)) {
        return res.status(400).json({ message: 'action must be BLOCK, QUARANTINE or RELEASE' });
    }
    if (!reason || !batchId || !safetyNoticeId) {
        return res.status(400).json({ message: 'reason, batchId and safetyNoticeId are required' });
    }

    // TODO Day 11: load the match, check the notice is VERIFIED,
    // then save actionTaken on the match.
    const result = await batchSafetyService.applySafetyAction({
        pharmacyId: String(req.user?.pharmacyId),
        batchId,
        action,
        reason,
        safetyNoticeId,
        requestedBy: String(req.user?.userId),
        idempotencyKey: `${safetyNoticeId}:${batchId}:${action}`
    });

    return res.status(200).json({ matchId, mock: true, result });
};