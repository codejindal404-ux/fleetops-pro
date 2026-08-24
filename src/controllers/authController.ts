import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { config } from '../config/index.ts';
import { dbStore, Role } from '../services/dbStore.ts';
import {
  generatePendingToken,
  verifyPendingToken,
  createAndSendOTP,
  verifyOTP,
  resendOTP
} from '../services/otpService.ts';

const generateToken = (userId: string, role: Role): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: '8h'
  } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { name, email, password, phone } = req.body;

  const existingUser = dbStore.getUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ message: 'User with this email already exists.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Always creates CUSTOMER role regardless of client input
  const newUser = dbStore.createUser({
    name,
    email,
    password: hashedPassword,
    phone: phone || '',
    role: 'CUSTOMER'
  });

  const token = generateToken(newUser.id, newUser.role);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: userWithoutPassword
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: 'Invalid email or password' });
    return;
  }

  const { email, password } = req.body;

  const user = dbStore.getUserByEmail(email);
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
    message: otpResult.devFallback
      ? 'Verification code generated.'
      : 'OTP sent to your email.',
    pendingToken,
    email: user.email,
    devFallback: true,
    devCode: otpResult.code
  });
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
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

  const user = dbStore.getUserById(userId);
  if (!user) {
    res.status(404).json({ message: 'User account not found.' });
    return;
  }

  // Issue real, full 8-hour session JWT token upon 2FA verification
  const token = generateToken(user.id, user.role);

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({
    message: 'Authentication successful',
    token,
    user: userWithoutPassword
  });
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
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

  const user = dbStore.getUserById(userId);
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
    message: result.message,
    ...(result.devFallback ? { devFallback: true, devCode: result.code } : {})
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = dbStore.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword });
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const users = dbStore.getUsers().map(({ password, ...u }) => u);
  res.status(200).json({ users });
};

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { name, email, password, phone, role } = req.body;

  if (role !== 'ADMIN' && role !== 'MECHANIC') {
    res.status(400).json({ message: "Staff role must be either 'ADMIN' or 'MECHANIC'." });
    return;
  }

  const existingUser = dbStore.getUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ message: 'User with this email already exists.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newStaff = dbStore.createUser({
    name,
    email,
    password: hashedPassword,
    phone: phone || '',
    role
  });

  const { password: _, ...userWithoutPassword } = newStaff;
  res.status(201).json({
    message: `Staff user created successfully with role ${role}`,
    user: userWithoutPassword
  });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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

  const existingUser = dbStore.getUserById(userId);
  if (!existingUser) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }

  // If email is changing, check uniqueness
  if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
    const emailCheck = dbStore.getUserByEmail(email);
    if (emailCheck && emailCheck.id !== userId) {
      res.status(400).json({ message: 'Email address is already in use by another user.' });
      return;
    }
  }

  const updates: Partial<{ name: string; email: string; phone: string; password: string }> = {};

  if (name) updates.name = name.trim();
  if (email) updates.email = email.trim();
  if (phone !== undefined) updates.phone = phone.trim();

  if (newPassword && newPassword.trim().length >= 6) {
    updates.password = await bcrypt.hash(newPassword.trim(), 10);
  }

  const updatedUser = dbStore.updateUser(userId, updates);
  if (!updatedUser) {
    res.status(500).json({ message: 'Failed to update profile.' });
    return;
  }

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.status(200).json({
    message: 'Profile updated successfully',
    user: userWithoutPassword
  });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  // Non-admin can only delete their own account; admin can delete any user
  if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
    res.status(403).json({ message: 'Forbidden: You do not have clearance to delete this user account.' });
    return;
  }

  const userToDelete = dbStore.getUserById(id);
  if (!userToDelete) {
    res.status(404).json({ message: 'User account not found.' });
    return;
  }

  // Prevent deleting the default primary admin if requested or prevent deleting last admin
  if (userToDelete.role === 'ADMIN') {
    const adminCount = dbStore.getUsers().filter((u) => u.role === 'ADMIN').length;
    if (adminCount <= 1) {
      res.status(400).json({ message: 'Cannot delete the sole primary Administrator account.' });
      return;
    }
  }

  const deleted = dbStore.deleteUser(id);
  if (!deleted) {
    res.status(500).json({ message: 'Failed to delete user.' });
    return;
  }

  res.status(200).json({ message: `User account '${userToDelete.name}' (${userToDelete.email}) was deleted successfully.` });
};


