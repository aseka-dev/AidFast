import { Router, Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';

// mergeParams is required to read :pharmacyId from the parent mount path.
const router = Router({ mergeParams: true });

router.use((req: Request, res: Response, next: NextFunction): void => {
  const authenticatedPharmacyId = (req as AuthRequest).user?.pharmacyId;
  if (!authenticatedPharmacyId || authenticatedPharmacyId !== req.params.pharmacyId) {
    res.status(403).json({ success: false, message: 'Pharmacy access denied' });
    return;
  }
  next();
});

function notYetImplemented(action: string) {
  return (_req: Request, res: Response): void => {
    res.status(501).json({ success: false, message: `${action} is not implemented yet` });
  };
}

router.get('/', notYetImplemented('List/search pharmacy medicines'));
router.get('/:medicineId', notYetImplemented('Get medicine details'));
router.post('/', notYetImplemented('Create/link pharmacy medicine'));
router.patch('/:medicineId', notYetImplemented('Update pharmacy medicine'));
router.delete('/:medicineId', notYetImplemented('Archive pharmacy medicine'));

export default router;
