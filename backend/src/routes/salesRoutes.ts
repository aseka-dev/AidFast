
import { Router } from "express";
import {
  authenticate,
  requireSelectedPharmacy
} from "../middleware/authMiddleware";

import {
  createSale,
  getSales,
  getSaleById,
  completeSale
} from "../controllers/salesController";

const router = Router({ mergeParams: true });

router.use(authenticate, requireSelectedPharmacy);

router.post("/", createSale);
router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/:id/complete", completeSale);

export default router;
