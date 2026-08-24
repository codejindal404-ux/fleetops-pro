import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore } from '../services/dbService.ts';
import { notificationService } from '../services/notificationService.ts';
import { sendToUser } from '../services/socketService.ts';

export const getCustomerDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const data = dbStore.getCustomerDashboardData(userId);
  res.status(200).json(data);
};

export const getVehicleHealth = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const healthList = dbStore.getCustomerVehiclesHealth(userId);
  res.status(200).json({
    health: healthList,
    count: healthList.length
  });
};

export const getReminders = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const reminders = dbStore.getCustomerReminders(userId);
  res.status(200).json({
    reminders,
    count: reminders.length
  });
};

export const getRewards = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rewards = dbStore.getLoyaltyRewards(userId);
  res.status(200).json(rewards);
};

export const redeemCoupon = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }
  const userId = req.user!.userId;
  const { code } = req.body;
  const result = dbStore.redeemCoupon(userId, code);
  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }
  res.status(200).json(result);
};

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { bookingId } = req.params;

  const booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  if (booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You can only access chat for your own bookings.' });
    return;
  }

  const messages = dbStore.getChatMessages(bookingId);
  res.status(200).json({
    messages,
    count: messages.length,
    mechanic: booking.mechanicId ? dbStore.getUserById(booking.mechanicId) : null
  });
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const userId = req.user!.userId;
  const user = dbStore.getUserById(userId);
  const { bookingId, message, imageUrl } = req.body;

  const booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  if (booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You can only chat on your own bookings.' });
    return;
  }

  const chatMessage = dbStore.addChatMessage({
    bookingId,
    senderId: userId,
    senderName: user?.name || 'Customer',
    senderRole: 'CUSTOMER',
    message: message.trim(),
    imageUrl
  });

  if (booking.mechanicId) {
    sendToUser(booking.mechanicId, 'CUSTOMER_CHAT_MESSAGE', {
      bookingId,
      message: chatMessage,
      sender: req.user
    });
  }

  res.status(201).json({ message: 'Message sent', chatMessage });
};
