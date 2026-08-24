import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import {
  getCustomerDashboard,
  getVehicleHealth,
  getReminders,
  getRewards,
  redeemCoupon,
  getChatMessages,
  sendChatMessage
} from '../controllers/customerController.ts';

const router = Router();

router.use(authMiddleware);
router.use(restrictTo('CUSTOMER'));

router.get('/dashboard', getCustomerDashboard);
router.get('/service-history', getCustomerDashboard);
router.get('/vehicle-health', getVehicleHealth);
router.get('/reminders', getReminders);
router.get('/rewards', getRewards);
router.post(
  '/rewards/redeem',
  [body('code').trim().notEmpty().withMessage('Coupon code is required')],
  redeemCoupon
);
router.get('/chat/:bookingId', getChatMessages);
router.post(
  '/chat/message',
  [
    body('bookingId').trim().notEmpty().withMessage('bookingId is required'),
    body('message').trim().notEmpty().withMessage('Message content cannot be empty')
  ],
  sendChatMessage
);

export const customerRoutes = router;
export default router;
