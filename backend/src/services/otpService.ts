import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { firebaseService } from './firebaseService.ts';
import { sendOtpEmail, sendPasswordResetEmail } from './emailService.ts';

export interface OtpRecord {
  id?: string;
  email: string;
  userId?: string;
  otpHash: string;
  createdAt: string;
  expiresAt: number; // timestamp in ms (10 minutes)
  used: boolean;
  attempts: number; // Max 5 attempts
  ip?: string;
  type?: 'EMAIL_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
  lastResendAt: number;
}

interface PendingJwtPayload {
  userId: string;
  stage: string;
}

const OTP_COLLECTION = 'otp_verifications';
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum 3 OTP requests per 15 minutes
const MAX_VERIFICATION_ATTEMPTS = 5; // Maximum 5 verification attempts per OTP

/**
 * Generate a pending JWT for the 2FA verification step.
 * Set to 10 minutes to match the OTP Firestore record lifetime (OTP_EXPIRATION_MS).
 * Previously 5m which caused "session expired" errors on still-valid OTPs.
 */
export const generatePendingToken = (userId: string): string => {
  return jwt.sign(
    { userId, stage: 'otp_pending' },
    config.jwtSecret,
    { expiresIn: '10m' }
  );
};

/**
 * Verify that a pending token is valid and in stage 'otp_pending'.
 */
export const verifyPendingToken = (pendingToken: string): { userId: string } => {
  try {
    const decoded = jwt.verify(pendingToken, config.jwtSecret) as PendingJwtPayload;
    if (decoded.stage !== 'otp_pending' || !decoded.userId) {
      throw new Error('Invalid stage');
    }
    return { userId: decoded.userId };
  } catch {
    throw new Error('Pending authentication session expired or invalid. Please log in again.');
  }
};

/**
 * Generate a short-lived 10-minute reset JWT for password reset flow.
 */
export const generateResetToken = (userId: string): string => {
  return jwt.sign(
    { userId, stage: 'reset_pending' },
    config.jwtSecret,
    { expiresIn: '10m' }
  );
};

/**
 * Verify that a reset token is valid and in stage 'reset_pending'.
 */
export const verifyResetToken = (resetToken: string): { userId: string } => {
  try {
    const decoded = jwt.verify(resetToken, config.jwtSecret) as PendingJwtPayload;
    if (decoded.stage !== 'reset_pending' || !decoded.userId) {
      throw new Error('Invalid reset token stage');
    }
    return { userId: decoded.userId };
  } catch {
    throw new Error('Password reset session expired or invalid. Please request a new reset code.');
  }
};

/**
 * Invalidate all existing unused OTP records in Firestore for a given email.
 */
export const invalidatePreviousOtps = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const existingRecords = await firebaseService.getCollection<OtpRecord>(OTP_COLLECTION, [
      { field: 'email', op: '==', value: normalizedEmail },
      { field: 'used', op: '==', value: false }
    ]);

    for (const record of existingRecords) {
      if (record.id) {
        await firebaseService.updateDocument(OTP_COLLECTION, record.id, {
          used: true,
          invalidatedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error(`Error invalidating previous OTPs for ${normalizedEmail}:`, err);
  }
};

/**
 * Request a new 6-digit OTP for email verification / 2FA.
 * Applies rate limiting (3 requests / 15 min), 60s cooldown, bcrypt hashing, Firestore storage, and Nodemailer email delivery.
 * If role is ADMIN or MECHANIC, the OTP is also printed to the terminal for dev convenience.
 */
export const requestOtp = async (
  email: string,
  ip?: string,
  userId?: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION',
  role?: string
): Promise<{ success: boolean; message: string; retryAfter?: number }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();

  // 1. Fetch recent OTPs for this email to check cooldown and rate limiting
  const recentRecords = await firebaseService.getCollection<OtpRecord>(OTP_COLLECTION, [
    { field: 'email', op: '==', value: normalizedEmail }
  ]);

  // Sort descending by creation
  recentRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Check 60-second cooldown from most recent OTP
  if (recentRecords.length > 0) {
    const latest = recentRecords[0];
    const timeSinceLast = now - (latest.lastResendAt || new Date(latest.createdAt).getTime());
    if (timeSinceLast < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
      return {
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting a new OTP.`,
        retryAfter
      };
    }
  }

  // Check 15-minute window rate limit (maximum 3 requests)
  const windowStartTime = now - RATE_LIMIT_WINDOW_MS;
  const requestsInWindow = recentRecords.filter(
    (r) => new Date(r.createdAt).getTime() > windowStartTime
  ).length;

  if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
    return {
      success: false,
      message: 'Maximum OTP request limit reached (3 per 15 minutes). Please try again later.'
    };
  }

  // 2. Invalidate previous active OTPs
  await invalidatePreviousOtps(normalizedEmail);

  // 3. Generate secure 6-digit numeric OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // ── DEV TERMINAL OUTPUT ──────────────────────────────────────────────────
  // Print OTP directly to terminal during local development to enable fast testing.
  if (role === 'ADMIN' || role === 'MECHANIC' || process.env.NODE_ENV !== 'production') {
    const displayRole = role || 'USER';
    const border = '─'.repeat(44);
    console.log(`\n┌${border}┐`);
    console.log(`│  🔐 FLEETOPS 2FA OTP  [${displayRole}]${' '.repeat(Math.max(0, 44 - 27 - displayRole.length))}│`);
    console.log(`├${border}┤`);
    console.log(`│  Email : ${normalizedEmail.padEnd(33)}│`);
    console.log(`│  OTP   : ${rawOtp.padEnd(33)}│`);
    console.log(`│  Type  : ${type.padEnd(33)}│`);
    console.log(`│  Valid : 10 minutes${' '.repeat(24)}│`);
    console.log(`└${border}┘\n`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // 4. Hash the OTP with bcrypt before storing
  const otpHash = await bcrypt.hash(rawOtp, 10);

  // 5. Store in Firestore collection `otp_verifications`
  const docId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await firebaseService.createDocument<OtpRecord>(
    OTP_COLLECTION,
    {
      email: normalizedEmail,
      userId: userId || null,
      otpHash,
      createdAt: new Date().toISOString(),
      expiresAt: now + OTP_EXPIRATION_MS, // 10 minutes
      used: false,
      attempts: 0,
      ip: ip || null,
      type,
      lastResendAt: now
    },
    docId
  );

  // 6. Deliver OTP via real email service (Nodemailer)
  const emailSent = type === 'PASSWORD_RESET'
    ? await sendPasswordResetEmail(normalizedEmail, rawOtp)
    : await sendOtpEmail(normalizedEmail, rawOtp);

  if (!emailSent && !config.smtpConfigured) {
    return {
      success: true,
      message: 'OTP generated. Please configure SMTP in .env for live email delivery.'
    };
  }

  return {
    success: true,
    message: 'OTP sent successfully to your email'
  };
};

/**
 * Verify a 6-digit OTP code against Firestore.
 * Enforces 10-minute expiration, max 5 attempts, and bcrypt hash comparison.
 */
export const verifyOtpCode = async (
  email: string,
  inputOtp: string,
  userId?: string
): Promise<{ success: boolean; message: string; remainingAttempts?: number }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = (inputOtp || '').toString().trim();

  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      success: false,
      message: 'Invalid OTP format. Must be 6 digits.'
    };
  }

  // Find active, unused OTP records for this email
  const filters: any[] = [
    { field: 'email', op: '==', value: normalizedEmail },
    { field: 'used', op: '==', value: false }
  ];

  const activeRecords = await firebaseService.getCollection<OtpRecord>(OTP_COLLECTION, filters);

  if (!activeRecords || activeRecords.length === 0) {
    return {
      success: false,
      message: 'Invalid or expired OTP'
    };
  }

  // Sort descending by creation date to get the latest
  activeRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const record = activeRecords[0];

  const now = Date.now();

  // Check expiration (10 minutes)
  if (now > record.expiresAt) {
    if (record.id) {
      await firebaseService.updateDocument(OTP_COLLECTION, record.id, { used: true, reason: 'expired' });
    }
    return {
      success: false,
      message: 'Invalid or expired OTP'
    };
  }

  // Check max attempts
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    if (record.id) {
      await firebaseService.updateDocument(OTP_COLLECTION, record.id, { used: true, reason: 'max_attempts_exceeded' });
    }
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      remainingAttempts: 0
    };
  }

  // Compare OTP using bcrypt (with dev fallback 123456 for automated testing in development mode)
  const isMatch = (process.env.NODE_ENV !== 'production' && cleanOtp === '123456')
    ? true
    : await bcrypt.compare(cleanOtp, record.otpHash);

  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    const remaining = MAX_VERIFICATION_ATTEMPTS - updatedAttempts;

    if (record.id) {
      await firebaseService.updateDocument(OTP_COLLECTION, record.id, {
        attempts: updatedAttempts,
        used: updatedAttempts >= MAX_VERIFICATION_ATTEMPTS
      });
    }

    if (remaining <= 0) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        remainingAttempts: 0
      };
    }

    return {
      success: false,
      message: 'Invalid or expired OTP',
      remainingAttempts: remaining
    };
  }

  // Valid OTP: mark as used
  if (record.id) {
    await firebaseService.updateDocument(OTP_COLLECTION, record.id, {
      used: true,
      verifiedAt: new Date().toISOString()
    });
  }

  // Complete existing email verification if user exists
  if (userId || record.userId) {
    const targetUserId = userId || record.userId;
    if (targetUserId) {
      try {
        await firebaseService.updateDocument('users', targetUserId, {
          emailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error updating user email verification status:', err);
      }
    }
  }

  return {
    success: true,
    message: 'Email verified successfully'
  };
};

/**
 * Resend OTP with 60-second cooldown
 */
export const resendOtpCode = async (
  email: string,
  ip?: string,
  userId?: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
): Promise<{ success: boolean; message: string; retryAfter?: number }> => {
  return requestOtp(email, ip, userId, type);
};

// =========================================================================
// BACKWARD-COMPATIBLE ADAPTERS FOR EXISTING CONTROLLER FLOWS
// =========================================================================

/**
 * 2FA Login OTP wrapper
 */
export const createAndSendOTP = async (
  userId: string,
  email: string,
  role?: string
): Promise<{ success: boolean; message: string }> => {
  const result = await requestOtp(email, undefined, userId, 'LOGIN_2FA', role);
  return {
    success: result.success,
    message: result.message
  };
};

/**
 * 2FA Login verification wrapper
 */
export const verifyOTP = async (
  userId: string,
  code: string,
  email?: string
): Promise<{ success: boolean; message?: string; remainingAttempts?: number }> => {
  let targetEmail = email;
  if (!targetEmail) {
    const user = await firebaseService.getUserById(userId);
    targetEmail = user?.email;
  }

  if (!targetEmail) {
    return { success: false, message: 'User account not found.' };
  }

  const result = await verifyOtpCode(targetEmail, code, userId);
  return {
    success: result.success,
    message: result.message,
    remainingAttempts: result.remainingAttempts
  };
};

/**
 * 2FA Resend wrapper
 */
export const resendOTP = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; retryAfter?: number }> => {
  return resendOtpCode(email, undefined, userId, 'LOGIN_2FA');
};

/**
 * Password Reset OTP wrapper
 */
export const createAndSendResetOTP = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string }> => {
  const result = await requestOtp(email, undefined, userId, 'PASSWORD_RESET');
  return {
    success: result.success,
    message: result.message
  };
};

/**
 * Password Reset OTP verification wrapper
 */
export const verifyResetOTP = async (
  userId: string,
  code: string,
  email?: string
): Promise<{ success: boolean; message?: string; remainingAttempts?: number }> => {
  let targetEmail = email;
  if (!targetEmail) {
    const user = await firebaseService.getUserById(userId);
    targetEmail = user?.email;
  }

  if (!targetEmail) {
    return { success: false, message: 'User account not found.' };
  }

  const result = await verifyOtpCode(targetEmail, code, userId);
  return {
    success: result.success,
    message: result.message,
    remainingAttempts: result.remainingAttempts
  };
};

/**
 * Password Reset Resend wrapper
 */
export const resendResetOTP = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; retryAfter?: number }> => {
  return resendOtpCode(email, undefined, userId, 'PASSWORD_RESET');
};
