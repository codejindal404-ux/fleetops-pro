import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, verifyOtp, resendOtp, getMe, getUsers, createStaff, updateProfile, deleteUser } from '../controllers/authController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { authLimiter, loginLimiter, sensitiveAuthLimiter } from '../middlewares/rateLimiters.ts';

const router = Router();

router.use(authLimiter);

router.post(
  '/register',
  sensitiveAuthLimiter,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required and must be under 100 characters'),
    body('email').trim().isEmail().isLength({ max: 150 }).withMessage('Valid email is required'),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),
    body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number must be under 30 characters')
  ],
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().isLength({ max: 150 }).withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.post(
  '/verify-otp',
  sensitiveAuthLimiter,
  [
    body('code').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit code is required')
  ],
  verifyOtp
);

router.post(
  '/resend-otp',
  sensitiveAuthLimiter,
  resendOtp
);

router.get('/me', authMiddleware, getMe);
router.put(
  '/profile',
  authMiddleware,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
    body('email').optional().trim().isEmail().isLength({ max: 150 }).withMessage('Valid email is required'),
    body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number must be under 30 characters'),
    body('newPassword').optional().isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters')
  ],
  updateProfile
);
router.get('/users', authMiddleware, restrictTo('ADMIN', 'MECHANIC'), getUsers);

router.post(
  '/create-staff',
  authMiddleware,
  restrictTo('ADMIN'),
  sensitiveAuthLimiter,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required and must be under 100 characters'),
    body('email').trim().isEmail().isLength({ max: 150 }).withMessage('Valid email is required'),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),
    body('role').isIn(['ADMIN', 'MECHANIC']).withMessage('Role must be ADMIN or MECHANIC'),
    body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number must be under 30 characters')
  ],
  createStaff
);

router.delete('/users/:id', authMiddleware, deleteUser);

export default router;
