
import { Router } from "express";

import {
  createReturn,
  getReturns,
  getReturnById,
  confirmReturn
} from "../controllers/returnController";

const router = Router();

// Create a return draft
router.post("/", createReturn);

// Get return history
router.get("/", getReturns);

// Get one return
router.get("/:id", getReturnById);

// Confirm a return
router.post("/:id/confirm", confirmReturn);

export default router;
