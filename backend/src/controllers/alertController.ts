import { Request, Response } from 'express';

const notImplemented = (res: Response, name: string, plannedDay: number) =>
    res.status(501).json({ message: `${name} is not implemented yet`, plannedDay });

export const listAlerts = (_req: Request, res: Response) =>
    notImplemented(res, 'listAlerts', 6);

export const getAlertSummary = (_req: Request, res: Response) =>
    notImplemented(res, 'getAlertSummary', 6);

export const acknowledgeAlert = (_req: Request, res: Response) =>
    notImplemented(res, 'acknowledgeAlert', 7);

export const resolveAlert = (_req: Request, res: Response) =>
    notImplemented(res, 'resolveAlert', 7);

export const recomputeAlerts = (_req: Request, res: Response) =>
    notImplemented(res, 'recomputeAlerts', 7);

export const listNotifications = (_req: Request, res: Response) =>
    notImplemented(res, 'listNotifications', 7);

export const markNotificationRead = (_req: Request, res: Response) =>
    notImplemented(res, 'markNotificationRead', 7);