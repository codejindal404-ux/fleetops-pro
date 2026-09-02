import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { config } from '../config/index.ts';
import { Role, User } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import {
  generatePendingToken,
  verifyPendingToken,
  createAndSendOTP,
  verifyOTP,
  resendOTP,
  generateResetToken,
  verifyResetToken,
  createAndSendResetOTP,
  verifyResetOTP,
  resendResetOTP
} from '../services/otpService.ts';

const generateToken = (userId: string, role: Role): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: '8h'
  } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await firebaseService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Always creates CUSTOMER role for public registration
    const newUser = await firebaseService.createDocument<User & { password?: string }>(
      'users',
      {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: (phone || '').trim(),
        role: 'CUSTOMER',
        status: 'ACTIVE'
      },
      userId
    );

    const token = generateToken(newUser.id, newUser.role);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: 'Invalid email or password' });
      return;
    }

    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await firebaseService.getUserByEmail(normalizedEmail);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate 5-minute pending token and create/send 2FA OTP code
    const pendingToken = generatePendingToken(user.id);
    const otpResult = await createAndSendOTP(user.id, user.email);

    res.status(200).json({
      message: 'A verification code has been sent. Please check your email or server console.',
      pendingToken,
      email: user.email
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const authHeader = req.headers.authorization;
    const pendingToken =
      req.body.pendingToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    const code = (req.body.code || req.body.otpCode || '').toString().trim();

    if (!pendingToken) {
      res.status(401).json({ message: 'Missing pending authentication token.' });
      return;
    }

    if (!code) {
      res.status(400).json({ message: '6-digit verification code is required.' });
      return;
    }

    let userId: string;
    try {
      const verified = verifyPendingToken(pendingToken);
      userId = verified.userId;
    } catch (err: any) {
      res.status(401).json({ message: err.message || 'Pending token expired or invalid. Please log in again.' });
      return;
    }

    const result = verifyOTP(userId, code);
    if (!result.success) {
      res.status(401).json({
        message: result.message || 'Invalid verification code.',
        remainingAttempts: result.remainingAttempts
      });
      return;
    }

    const user = await firebaseService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    // Issue real session JWT token upon 2FA verification
    const token = generateToken(user.id, user.role);
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const pendingToken =
      req.body.pendingToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!pendingToken) {
      res.status(401).json({ message: 'Missing pending authentication token.' });
      return;
    }

    let userId: string;
    try {
      const verified = verifyPendingToken(pendingToken);
      userId = verified.userId;
    } catch (err: any) {
      res.status(401).json({ message: err.message || 'Pending token expired or invalid. Please log in again.' });
      return;
    }

    const user = await firebaseService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    const result = await resendOTP(userId, user.email);
    if (!result.success) {
      res.status(429).json({ message: result.message, retryAfter: result.retryAfter });
      return;
    }

    res.status(200).json({
      message: 'A fresh verification code has been sent. Please check your email or server console.'
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP resend', error: error.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await firebaseService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await firebaseService.getCollection<User & { password?: string }>('users');
    const sanitized = users.map(({ password, ...u }) => u);
    res.status(200).json({ users: sanitized });
  } catch (error: any) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (role !== 'ADMIN' && role !== 'MECHANIC') {
      res.status(400).json({ message: "Staff role must be either 'ADMIN' or 'MECHANIC'." });
      return;
    }

    const existingUser = await firebaseService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${role.toLowerCase().slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newStaff = await firebaseService.createDocument<User & { password?: string }>(
      'users',
      {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: (phone || '').trim(),
        role,
        status: 'ACTIVE'
      },
      userId
    );

    const { password: _, ...userWithoutPassword } = newStaff;
    res.status(201).json({
      message: `Staff user created successfully with role ${role}`,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('createStaff error:', error);
    res.status(500).json({ message: 'Server error creating staff account', error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { name, email, phone, newPassword } = req.body;
    const userId = req.user.userId;

    const existingUser = await firebaseService.getUserById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    // If email is changing, check uniqueness
    if (email && email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailCheck = await firebaseService.getUserByEmail(email.trim().toLowerCase());
      if (emailCheck && emailCheck.id !== userId) {
        res.status(400).json({ message: 'Email address is already in use by another user.' });
        return;
      }
    }

    const updates: Partial<{ name: string; email: string; phone: string; password: string }> = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone.trim();

    if (newPassword && newPassword.trim().length >= 6) {
      updates.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await firebaseService.updateDocument<User & { password?: string }>('users', userId, updates);
    if (!updatedUser) {
      res.status(500).json({ message: 'Failed to update profile.' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      res.status(403).json({ message: 'Forbidden: You do not have clearance to delete this user account.' });
      return;
    }

    const userToDelete = await firebaseService.getUserById(id);
    if (!userToDelete) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    if (userToDelete.role === 'ADMIN') {
      const allUsers = await firebaseService.getCollection('users', [{ field: 'role', op: '==', value: 'ADMIN' }]);
      if (allUsers.length <= 1) {
        res.status(400).json({ message: 'Cannot delete the sole primary Administrator account.' });
        return;
      }
    }

    const deleted = await firebaseService.deleteDocument('users', id);
    if (!deleted) {
      res.status(500).json({ message: 'Failed to delete user.' });
      return;
    }

    // Cascading deletion for user's vehicles and bookings
    const userVehicles = await firebaseService.getVehiclesByOwner(id);
    for (const v of userVehicles) {
      await firebaseService.deleteDocument('vehicles', v.id);
    }

    const userBookings = await firebaseService.getBookingsByCustomer(id);
    for (const b of userBookings) {
      await firebaseService.deleteDocument('bookings', b.id);
    }

    res.status(200).json({ message: `User account '${userToDelete.name}' (${userToDelete.email}) was deleted successfully.` });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
};

// =========================================================================
// FORGOT & RESET PASSWORD CONTROLLERS
// =========================================================================

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg || 'Valid email is required' });
      return;
    }

    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await firebaseService.getUserByEmail(normalizedEmail);
    if (!user) {
      // For security and UX consistency, inform user if email is not found
      res.status(404).json({ message: 'No registered account found with that email address.' });
      return;
    }

    const resetToken = generateResetToken(user.id);
    const delivery = await createAndSendResetOTP(user.id, user.email);

    res.status(200).json({
      message: delivery.devFallback
        ? 'A password reset code has been generated. Check the server console or on-screen code.'
        : 'A password reset code has been sent to your email address.',
      resetToken,
      email: user.email,
      devFallback: delivery.devFallback,
      devCode: delivery.devFallback ? delivery.code : undefined
    });
  } catch (error: any) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Server error initiating password reset', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { resetToken, code, newPassword } = req.body;
    const cleanCode = (code || '').toString().trim();

    if (!resetToken) {
      res.status(401).json({ message: 'Missing password reset authorization token.' });
      return;
    }

    if (!cleanCode || cleanCode.length !== 6) {
      res.status(400).json({ message: '6-digit verification code is required.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long.' });
      return;
    }

    let userId: string;
    try {
      const verified = verifyResetToken(resetToken);
      userId = verified.userId;
    } catch (err: any) {
      res.status(401).json({ message: err.message || 'Password reset session expired or invalid. Please request a new code.' });
      return;
    }

    const otpResult = verifyResetOTP(userId, cleanCode);
    if (!otpResult.success) {
      res.status(401).json({
        message: otpResult.message || 'Invalid password reset code.',
        remainingAttempts: otpResult.remainingAttempts
      });
      return;
    }

    const user = await firebaseService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    // Hash new password and update in Firestore
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await firebaseService.updateDocument<User & { password?: string }>('users', userId, {
      password: hashedPassword
    });

    // Create security audit log
    try {
      await firebaseService.createDocument('auditLogs', {
        action: 'PASSWORD_RESET',
        performedBy: user.email,
        details: `Password reset successfully completed for user '${user.name}' (${user.email})`,
        timestamp: new Date().toISOString()
      });
    } catch (auditErr) {
      console.warn('Failed to log audit event for password reset:', auditErr);
    }

    res.status(200).json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
      email: user.email
    });
  } catch (error: any) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

export const resendResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken } = req.body;

    if (!resetToken) {
      res.status(401).json({ message: 'Missing password reset authorization token.' });
      return;
    }

    let userId: string;
    try {
      const verified = verifyResetToken(resetToken);
      userId = verified.userId;
    } catch (err: any) {
      res.status(401).json({ message: err.message || 'Password reset session expired or invalid. Please request a new code.' });
      return;
    }

    const user = await firebaseService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    const result = await resendResetOTP(userId, user.email);
    if (!result.success) {
      res.status(429).json({ message: result.message, retryAfter: result.retryAfter });
      return;
    }

    res.status(200).json({
      message: 'A fresh password reset code has been sent. Please check your email or server console.',
      devFallback: result.devFallback,
      devCode: result.devFallback ? result.code : undefined
    });
  } catch (error: any) {
    console.error('resendResetOtp error:', error);
    res.status(500).json({ message: 'Server error resending password reset code', error: error.message });
  }
};
