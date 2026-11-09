import { Router, Request, Response } from "express";
import { authenticate, requireSelectedPharmacy } from '../middleware/authMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import requirePermission from '../middleware/permissionMiddleware';
import { createGrn, getGrn, listGrns, submitGrn, updateGrn } from '../controllers/grnController';

const router = Router({ mergeParams: true });

router.use(authenticate, requireSelectedPharmacy, matchPharmacyParam);

router.get("/", requirePermission('grn:read'), listGrns);
router.get("/:id", requirePermission('grn:read'), getGrn);
router.post("/", requirePermission('grn:create'), createGrn);
router.put("/:id", requirePermission('grn:create'), updateGrn);
router.patch("/:id", requirePermission('grn:create'), updateGrn);
router.post("/:id/submit", requirePermission('grn:submit'), submitGrn);

router.post("/:id/request-changes", requirePermission('grn:verify'), (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Request changes API not implemented yet",
  });
});

router.post("/:id/confirm", requirePermission('grn:confirm'), (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Confirm GRN API not implemented yet",
  });
});

router.post("/:id/reverse", requirePermission('grn:reverse'), (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Reverse GRN API not implemented yet",
  });
});

export default router;
