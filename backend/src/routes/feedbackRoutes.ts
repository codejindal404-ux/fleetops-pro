import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitFeedback,
  getFeedback,
  getMechanicRating
} from '../controllers/feedbackController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';

const router = Router();

router.use(authMiddleware);

// POST /api/bookings/:id/feedback - customer only
router.post(
  '/bookings/:id/feedback',
  restrictTo('CUSTOMER'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters')
  ],
  submitFeedback
);

router.get('/feedback', getFeedback);
router.get('/mechanics/:id/rating', getMechanicRating);

export default router;
