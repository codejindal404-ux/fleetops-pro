import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  requestOtp,
  verifyOtp,
  resendOtp,
  getMe,
  getUsers,
  createStaff,
  updateProfile,
  deleteUser,
  forgotPassword,
  resetPassword,
  resendResetOtp
} from '../controllers/authController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import {
  authLimiter,
  loginLimiter,
  sensitiveAuthLimiter,
  otpRequestLimiter,
  otpVerifyLimiter
} from '../middlewares/rateLimiters.ts';

const router = Router();

router.use(authLimiter);

// ---------------------------------------------------------
// User Registration & Login
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// Standard OTP Endpoints (Email Verification & 2FA)
// ---------------------------------------------------------

// POST /api/auth/otp/request
router.post(
  '/otp/request',
  otpRequestLimiter,
  [
    body('email').trim().isEmail().isLength({ max: 150 }).withMessage('Valid email is required')
  ],
  requestOtp
);

// POST /api/auth/otp/verify
router.post(
  '/otp/verify',
  otpVerifyLimiter,
  verifyOtp
);

// POST /api/auth/otp/resend
router.post(
  '/otp/resend',
  otpRequestLimiter,
  resendOtp
);

// Legacy/Compatibility OTP endpoints
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  verifyOtp
);

router.post(
  '/resend-otp',
  otpRequestLimiter,
  resendOtp
);

// ---------------------------------------------------------
// Password Recovery Endpoints
// ---------------------------------------------------------

router.post(
  '/forgot-password',
  sensitiveAuthLimiter,
  [
    body('email').trim().isEmail().isLength({ max: 150 }).withMessage('Valid email address is required')
  ],
  forgotPassword
);

router.post(
  '/reset-password',
  sensitiveAuthLimiter,
  [
    body('resetToken').notEmpty().withMessage('Reset authorization token is required'),
    body('code').optional().trim(),
    body('otp').optional().trim(),
    body('newPassword').isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters')
  ],
  resetPassword
);

router.post(
  '/resend-reset-otp',
  sensitiveAuthLimiter,
  resendResetOtp
);

// ---------------------------------------------------------
// User Profile & Management (Protected)
// ---------------------------------------------------------

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
