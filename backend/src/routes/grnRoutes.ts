import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get GRNs API not implemented yet",
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get GRN API not implemented yet",
  });
});

router.post("/", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Create GRN API not implemented yet",
  });
});

router.post("/:id/submit", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Submit GRN API not implemented yet",
  });
});

router.post("/:id/request-changes", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Request changes API not implemented yet",
  });
});

router.post("/:id/confirm", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Confirm GRN API not implemented yet",
  });
});

router.post("/:id/reverse", (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Reverse GRN API not implemented yet",
  });
});

export default router;
