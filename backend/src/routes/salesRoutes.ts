
import { Router } from "express";

import {
  createSale,
  getSales,
  getSaleById,
  completeSale
} from "../controllers/salesController";

const router = Router();

router.post("/", createSale);

router.get("/", getSales);

router.get("/:id", getSaleById);

router.post("/:id/complete", completeSale);

export default router;
