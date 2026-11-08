import { Router } from 'express';
import { authenticate, requireSelectedPharmacy } from '../middleware/authMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import requirePermission from '../middleware/permissionMiddleware';
import { listSuppliers, getSupplier, createSupplier, updateSupplier } from '../controllers/purchasingController';
const router = Router({ mergeParams: true });
router.use(authenticate, requireSelectedPharmacy, matchPharmacyParam);
router.get('/', requirePermission('suppliers:read'), listSuppliers);
router.get('/:id', requirePermission('suppliers:read'), getSupplier);
router.post('/', requirePermission('suppliers:create'), createSupplier);
// Supplier maintenance shares the existing suppliers:create permission.
router.put('/:id', requirePermission('suppliers:create'), updateSupplier);
router.patch('/:id/deactivate', requirePermission('suppliers:create'), (_req, res) => {
  res.status(501).json({ success: false, message: 'Deactivate supplier API not implemented yet' });
});
export default router;
