
import { Router } from "express";

import {
  authenticate,
  requireSelectedPharmacy,
  type AuthRequest
} from "../middleware/authMiddleware";

import requirePermission from "../middleware/permissionMiddleware";
import { PERMISSIONS } from "../config/permissions";

import {
  createSale,
  getSales,
  getSaleById,
  completeSale
} from "../controllers/salesController";

import { previewSaleAllocation } from "../services/salesPreview";

const router = Router({ mergeParams: true });

// Authentication middleware
router.use(authenticate, requireSelectedPharmacy);

// Day 6 - Create draft sale
router.post(
  "/",
  requirePermission(PERMISSIONS.SALES_CREATE),
  createSale
);

// Day 6 - Get sale history
router.get(
  "/",
  requirePermission(PERMISSIONS.SALES_READ),
  getSales
);

// Day 8 - FIFO allocation preview
// IMPORTANT: This must be before /:id
router.get(
  "/preview",
  requirePermission(PERMISSIONS.SALES_READ),
  async (req: AuthRequest, res) => {
    if (
      !req.user?.pharmacyId ||
      req.user.pharmacyId !== req.params.pharmacyId
    ) {
      res.status(403).json({
        success: false,
        message: "Unauthorized pharmacy"
      });
      return;
    }

    try {
      const result = await previewSaleAllocation(
        req.user.pharmacyId,
        String(req.query.medicineId ?? ""),
        Number(req.query.quantity)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "FIFO allocation preview failed"
      });
    }
  }
);

// Day 6 - Get sale details
router.get(
  "/:id",
  requirePermission(PERMISSIONS.SALES_READ),
  getSaleById
);

// Day 9 - Complete sale
// Remains disabled in the controller until
// atomic stock posting is implemented.
router.post(
  "/:id/complete",
  requirePermission(PERMISSIONS.SALES_CREATE),
  completeSale
);

export default router;
