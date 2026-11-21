import { Router } from "express";
import {
  authenticate,
  requireSelectedPharmacy
} from "../middleware/authMiddleware";
import matchPharmacyParam from "../middleware/matchPharmacyParam";
import requirePermission from "../middleware/permissionMiddleware";
import { PERMISSIONS } from "../config/permissions";
import {
  createReturn,
  getReturns,
  getReturnById,
  confirmReturn
} from "../controllers/returnController";

const router = Router({ mergeParams: true });

router.use(authenticate, requireSelectedPharmacy, matchPharmacyParam);

// Create a return draft
router.post(
  "/",
  requirePermission(PERMISSIONS.RETURNS_CREATE),
  createReturn
);

// Get return history
router.get(
  "/",
  requirePermission(PERMISSIONS.RETURNS_READ),
  getReturns
);

// Get one return
router.get(
  "/:id",
  requirePermission(PERMISSIONS.RETURNS_READ),
  getReturnById
);

// Confirm a return
router.post(
  "/:id/confirm",
  requirePermission(PERMISSIONS.RETURNS_APPROVE),
  confirmReturn
);

export default router;
