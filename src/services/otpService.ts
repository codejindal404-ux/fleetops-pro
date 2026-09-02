import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { config } from '../config/index.ts';

interface OTPRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastResendAt: number;
}

interface PendingJwtPayload {
  userId: string;
  stage: string;
}

// In-memory OTP store keyed by userId
const otpStore = new Map<string, OTPRecord>();

/**
 * Generate a short-lived 5-minute pending JWT for the 2FA verification step.
 */
export const generatePendingToken = (userId: string): string => {
  return jwt.sign(
    { userId, stage: 'otp_pending' },
    config.jwtSecret,
    { expiresIn: '5m' }
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
  } catch (err) {
    throw new Error('Pending authentication session expired or invalid. Please log in again.');
  }
};

/**
 * Send OTP code via nodemailer if SMTP is configured, and log to server console for testing.
 */
const deliverEmail = async (email: string, code: string): Promise<{ sentEmail: boolean; devFallback: boolean }> => {
  // Always log to server console for local testing/demo evaluation
  console.log(`\n==============================================`);
  console.log(`🔑 [2FA OTP CODE] Target Email: ${email}`);
  console.log(`👉 Verification Code: ${code} (Expires in 5 mins)`);
  console.log(`==============================================\n`);

  if (!config.smtpConfigured) {
    console.log(`ℹ️ [2FA OTP] SMTP not configured. Using console-log dev fallback.`);
    return { sentEmail: false, devFallback: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });

    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'FleetOps Pro — 2FA Verification Code',
      text: `Your FleetOps Pro verification code is ${code}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #f59e0b; margin-top: 0; font-family: sans-serif;">FleetOps Pro Security</h2>
          <p style="font-size: 14px; color: #cbd5e1;">You requested access to your FleetOps Pro account.</p>
          <div style="background-color: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f59e0b;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This code expires in 5 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    });

    return { sentEmail: true, devFallback: false };
  } catch (err: any) {
    console.error(`⚠️ SMTP Email Delivery Warning for ${email}:`, err?.message || err);
    return { sentEmail: false, devFallback: true };
  }
};

/**
 * Create a new 6-digit OTP, record it in memory, and deliver via email/console.
 */
export const createAndSendOTP = async (
  userId: string,
  email: string
): Promise<{ sentEmail: boolean; devFallback: boolean; code: string }> => {
  const code = crypto.randomInt(100000, 999999).toString();
  const now = Date.now();

  otpStore.set(userId, {
    code,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attempts: 5,
    lastResendAt: now
  });

  const delivery = await deliverEmail(email, code);
  return { ...delivery, code };
};

/**
 * Verify a 6-digit OTP code submitted by a user.
 */
export const verifyOTP = (
  userId: string,
  inputCode: string
): { success: boolean; message?: string; remainingAttempts?: number } => {
  const record = otpStore.get(userId);

  if (!record || Date.now() > record.expiresAt) {
    otpStore.delete(userId);
    return { success: false, message: 'Verification code is invalid or has expired. Please log in again.' };
  }

  if (record.attempts <= 0) {
    otpStore.delete(userId);
    return { success: false, message: 'Maximum verification attempts exceeded. Please log in again.' };
  }

  const cleanInput = inputCode.trim();
  if (record.code === cleanInput) {
    otpStore.delete(userId);
    return { success: true };
  }

  record.attempts -= 1;

  if (record.attempts <= 0) {
    otpStore.delete(userId);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please log in again.',
      remainingAttempts: 0
    };
  }

  return {
    success: false,
    message: 'Invalid verification code.',
    remainingAttempts: record.attempts
  };
};

/**
 * Resend OTP with a 60-second rate limit constraint per user.
 */
export const resendOTP = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; retryAfter?: number; devFallback?: boolean; code?: string }> => {
  const record = otpStore.get(userId);
  const now = Date.now();

  if (record && now - record.lastResendAt < 60 * 1000) {
    const retryAfter = Math.ceil((60 * 1000 - (now - record.lastResendAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${retryAfter} seconds before requesting a new code.`,
      retryAfter
    };
  }

  const delivery = await createAndSendOTP(userId, email);
  return {
    success: true,
    message: delivery.devFallback
      ? 'A fresh verification code has been generated (check server console).'
      : 'A fresh verification code has been sent to your email.',
    devFallback: delivery.devFallback,
    code: delivery.code
  };
};

// =========================================================================
// PASSWORD RESET OTP & TOKEN SERVICES
// =========================================================================

// In-memory Password Reset OTP store keyed by userId
const resetOtpStore = new Map<string, OTPRecord>();

/**
 * Generate a short-lived 10-minute reset JWT for the password reset verification step.
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
  } catch (err) {
    throw new Error('Password reset session expired or invalid. Please request a new reset code.');
  }
};

/**
 * Send Password Reset OTP code via nodemailer if SMTP is configured, and log to server console.
 */
const deliverResetEmail = async (email: string, code: string): Promise<{ sentEmail: boolean; devFallback: boolean }> => {
  // Always log to server console for local testing/demo evaluation
  console.log(`\n==============================================`);
  console.log(`🔐 [PASSWORD RESET CODE] Target Email: ${email}`);
  console.log(`👉 Reset Code: ${code} (Expires in 10 mins)`);
  console.log(`==============================================\n`);

  if (!config.smtpConfigured) {
    console.log(`ℹ️ [PASSWORD RESET] SMTP not configured. Using console-log dev fallback.`);
    return { sentEmail: false, devFallback: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });

    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'FleetOps Pro — Password Reset Code',
      text: `Your FleetOps Pro password reset code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #f59e0b; margin-top: 0; font-family: sans-serif;">FleetOps Pro Password Reset</h2>
          <p style="font-size: 14px; color: #cbd5e1;">A password reset request was initiated for your FleetOps Pro account.</p>
          <div style="background-color: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f59e0b;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This code expires in 10 minutes. If you did not request this password reset, please ignore this email or contact support immediately.</p>
        </div>
      `
    });

    return { sentEmail: true, devFallback: false };
  } catch (err: any) {
    console.error(`⚠️ SMTP Reset Email Delivery Warning for ${email}:`, err?.message || err);
    return { sentEmail: false, devFallback: true };
  }
};

/**
 * Create a new 6-digit Password Reset OTP, record it in memory, and deliver via email/console.
 */
export const createAndSendResetOTP = async (
  userId: string,
  email: string
): Promise<{ sentEmail: boolean; devFallback: boolean; code: string }> => {
  const code = crypto.randomInt(100000, 999999).toString();
  const now = Date.now();

  resetOtpStore.set(userId, {
    code,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attempts: 5,
    lastResendAt: now
  });

  const delivery = await deliverResetEmail(email, code);
  return { ...delivery, code };
};

/**
 * Verify a 6-digit Reset OTP code.
 */
export const verifyResetOTP = (
  userId: string,
  inputCode: string
): { success: boolean; message?: string; remainingAttempts?: number } => {
  const record = resetOtpStore.get(userId);

  if (!record || Date.now() > record.expiresAt) {
    resetOtpStore.delete(userId);
    return { success: false, message: 'Password reset code is invalid or has expired. Please request a new code.' };
  }

  if (record.attempts <= 0) {
    resetOtpStore.delete(userId);
    return { success: false, message: 'Maximum reset attempts exceeded. Please request a new code.' };
  }

  const cleanInput = inputCode.trim();
  if (record.code === cleanInput) {
    resetOtpStore.delete(userId);
    return { success: true };
  }

  record.attempts -= 1;

  if (record.attempts <= 0) {
    resetOtpStore.delete(userId);
    return {
      success: false,
      message: 'Maximum reset attempts exceeded. Please request a new code.',
      remainingAttempts: 0
    };
  }

  return {
    success: false,
    message: 'Invalid password reset code.',
    remainingAttempts: record.attempts
  };
};

/**
 * Resend Password Reset OTP with 60-second rate limiting.
 */
export const resendResetOTP = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; retryAfter?: number; devFallback?: boolean; code?: string }> => {
  const record = resetOtpStore.get(userId);
  const now = Date.now();

  if (record && now - record.lastResendAt < 60 * 1000) {
    const retryAfter = Math.ceil((60 * 1000 - (now - record.lastResendAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${retryAfter} seconds before requesting a new reset code.`,
      retryAfter
    };
  }

  const delivery = await createAndSendResetOTP(userId, email);
  return {
    success: true,
    message: delivery.devFallback
      ? 'A fresh reset code has been generated (check server console).'
      : 'A fresh reset code has been sent to your email.',
    devFallback: delivery.devFallback,
    code: delivery.code
  };
};
