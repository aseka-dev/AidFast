import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import requirePermission from '../middleware/permissionMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import {
    listAlerts,
    getAlertSummary,
    acknowledgeAlert,
    resolveAlert,
    recomputeAlerts,
    listNotifications,
    markNotificationRead
} from '../controllers/alertController';

const router = Router();
const base = '/pharmacies/:pharmacyId';

router.get(`${base}/alerts`, authenticate, matchPharmacyParam, requirePermission('alerts:read'), listAlerts);
router.get(`${base}/alerts/summary`, authenticate, matchPharmacyParam, requirePermission('alerts:read'), getAlertSummary);
router.patch(`${base}/alerts/:alertId/acknowledge`, authenticate, matchPharmacyParam, requirePermission('alerts:update'), acknowledgeAlert);
router.patch(`${base}/alerts/:alertId/resolve`, authenticate, matchPharmacyParam, requirePermission('alerts:update'), resolveAlert);
router.post(`${base}/alerts/recompute`, authenticate, matchPharmacyParam, requirePermission('alerts:update'), recomputeAlerts);

router.get(`${base}/notifications`, authenticate, matchPharmacyParam, requirePermission('alerts:read'), listNotifications);
router.patch(`${base}/notifications/:notificationId/read`, authenticate, matchPharmacyParam, requirePermission('alerts:read'), markNotificationRead);

export default router;