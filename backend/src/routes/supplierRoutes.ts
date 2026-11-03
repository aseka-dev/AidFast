import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get suppliers API not implemented yet",
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get supplier API not implemented yet",
  });
});

router.post("/", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Create supplier API not implemented yet",
  });
});

router.put("/:id", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Update supplier API not implemented yet",
  });
});

router.patch("/:id/deactivate", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Deactivate supplier API not implemented yet",
  });
});

export default router;
