import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import requirePermission from '../middleware/permissionMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import {
    listSafetyNotices,
    createSafetyNotice,
    verifySafetyNotice,
    rejectSafetyNotice,
    listSafetyMatches,
    runSafetyMatching,
    applySafetyAction
} from '../controllers/safetyController';

const router = Router();
const base = '/pharmacies/:pharmacyId';

// Shared notices (no pharmacyId in the URL)
router.get('/safety-notices', authenticate, requirePermission('safety:read'), listSafetyNotices);
router.post('/safety-notices', authenticate, requirePermission('safety:create'), createSafetyNotice);
router.patch('/safety-notices/:noticeId/verify', authenticate, requirePermission('safety:verify'), verifySafetyNotice);
router.patch('/safety-notices/:noticeId/reject', authenticate, requirePermission('safety:verify'), rejectSafetyNotice);

// Pharmacy-scoped matches
router.get(`${base}/safety-matches`, authenticate, matchPharmacyParam, requirePermission('safety:read'), listSafetyMatches);
router.post(`${base}/safety-notices/:noticeId/match`, authenticate, matchPharmacyParam, requirePermission('safety:action'), runSafetyMatching);
router.post(`${base}/safety-matches/:matchId/action`, authenticate, matchPharmacyParam, requirePermission('safety:action'), applySafetyAction);

export default router;