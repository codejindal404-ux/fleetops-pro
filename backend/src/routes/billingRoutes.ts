import { Router } from 'express';
import { body } from 'express-validator';
import {
  createInvoice,
  getInvoiceById,
  getInvoices,
  payInvoice
} from '../controllers/billingController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';

const router = Router();

router.use(authMiddleware);

// POST /api/bookings/:id/invoice
router.post(
  '/bookings/:id/invoice',
  restrictTo('ADMIN'),
  [
    body('serviceCharges').isFloat({ min: 0, max: 1000000 }).withMessage('serviceCharges must be a non-negative number up to 1,000,000'),
    body('partsCost').isFloat({ min: 0, max: 1000000 }).withMessage('partsCost must be a non-negative number up to 1,000,000'),
    body('tax').isFloat({ min: 0, max: 1000000 }).withMessage('tax must be a non-negative number up to 1,000,000')
  ],
  createInvoice
);

router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.patch('/invoices/:id/pay', payInvoice);

export default router;
