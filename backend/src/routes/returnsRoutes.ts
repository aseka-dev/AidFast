
import { Router } from "express";

const router = Router();

// Create a new return draft
router.post("/", (_req, res) => {
  res.status(501).json({
    message: "Create return not implemented yet"
  });
});

// Get all returns
router.get("/", (_req, res) => {
  res.status(501).json({
    message: "Get returns not implemented yet"
  });
});

// Get return by ID
router.get("/:id", (_req, res) => {
  res.status(501).json({
    message: "Get return by ID not implemented yet"
  });
});

// Confirm a return
router.post("/:id/confirm", (_req, res) => {
  res.status(501).json({
    message: "Confirm return not implemented yet"
  });
});

export default router;
