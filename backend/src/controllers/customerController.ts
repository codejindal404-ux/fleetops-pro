import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { firebaseService } from '../services/firebaseService.ts';
import { sendToUser } from '../services/socketService.ts';
import { Booking, Vehicle, User } from '../../../src/types.ts';

export const getCustomerDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const customer = await firebaseService.getUserById(userId);
    const vehicles = await firebaseService.getVehiclesByOwner(userId);
    const bookings = await firebaseService.getBookingsByCustomer(userId);
    const activeBookings = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
    const completedServices = bookings.filter((b) => b.status === 'COMPLETED');

    const customerBookings = new Set(bookings.map((b) => b.id));
    const allInvoices = await firebaseService.getCollection('invoices');
    const customerInvoices = allInvoices.filter((inv) => customerBookings.has(inv.bookingId));
    const totalSpending = customerInvoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingInvoicesAmount = customerInvoices.filter((i) => i.status === 'UNPAID').reduce((sum, i) => sum + (i.amount || 0), 0);

    const vehicleHealthList = vehicles.map((v: Vehicle) => ({
      vehicleId: v.id,
      vehicleBrand: v.brand,
      vehicleModel: v.model,
      registrationNumber: v.registrationNumber,
      currentMileage: v.mileage || 25000,
      overallHealthScore: 92,
      metrics: {
        engineHealth: { name: 'Engine Health', score: 95, status: 'GOOD', detail: 'Optimal performance' },
        brakeCondition: { name: 'Brake Pads', score: 88, status: 'GOOD', detail: '7.5mm remaining' },
        oilLife: { name: 'Engine Oil', score: 82, status: 'GOOD', detail: '5,000 miles before change' },
        batteryStatus: { name: 'Battery 12V', score: 98, status: 'GOOD', detail: '12.8V - Healthy' },
        tyrePressure: { name: 'Tyre Pressure', score: 90, status: 'GOOD', detail: '33 PSI balanced' }
      },
      aiRecommendation: 'Vehicle running smoothly. Upcoming 30,000 mi check recommended.',
      predictedService: 'Periodic Inspection',
      predictedServiceDays: 25,
      predictedServiceMileage: 30000,
      healthStatus: 'GOOD',
      lastUpdated: new Date().toISOString()
    }));

    const rewards = {
      points: 250,
      tier: 'SILVER',
      tierColor: '#94A3B8',
      lifetimePoints: 550,
      redeemedPoints: 300,
      nextTierPointsRemaining: 450,
      nextTierName: 'GOLD',
      availableCoupons: [
        { code: 'FLEET10', title: '10% Off Routine Service', discountAmount: 25, pointsCost: 100, minBillAmount: 100, expiresAt: '2026-12-31' },
        { code: 'BRAKE20', title: '$20 Off Brake Inspection', discountAmount: 20, pointsCost: 150, minBillAmount: 80, expiresAt: '2026-12-31' }
      ]
    };

    res.status(200).json({
      customer: {
        id: customer?.id || userId,
        name: customer?.name || 'Customer',
        email: customer?.email || '',
        phone: customer?.phone || '',
        membershipTier: 'SILVER'
      },
      stats: {
        totalVehicles: vehicles.length,
        activeBookings: activeBookings.length,
        completedServices: completedServices.length,
        totalSpending,
        pendingInvoicesAmount,
        rewardPoints: 250
      },
      vehicleHealthList,
      activeBookings,
      upcomingReminders: [],
      recommendedGarages: [],
      rewards
    });
  } catch (error: any) {
    console.error('getCustomerDashboard error:', error);
    res.status(500).json({ message: 'Server error fetching customer dashboard', error: error.message });
  }
};

export const getVehicleHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const vehicles = await firebaseService.getVehiclesByOwner(userId);
    const healthList = vehicles.map((v: Vehicle) => ({
      vehicleId: v.id,
      vehicleBrand: v.brand,
      vehicleModel: v.model,
      registrationNumber: v.registrationNumber,
      currentMileage: v.mileage || 25000,
      overallHealthScore: 92,
      metrics: {
        engineHealth: { name: 'Engine Health', score: 95, status: 'GOOD', detail: 'Optimal performance' },
        brakeCondition: { name: 'Brake Pads', score: 88, status: 'GOOD', detail: '7.5mm remaining' },
        oilLife: { name: 'Engine Oil', score: 82, status: 'GOOD', detail: '5,000 miles before change' },
        batteryStatus: { name: 'Battery 12V', score: 98, status: 'GOOD', detail: '12.8V - Healthy' },
        tyrePressure: { name: 'Tyre Pressure', score: 90, status: 'GOOD', detail: '33 PSI balanced' }
      },
      aiRecommendation: 'Vehicle running smoothly. Upcoming 30,000 mi check recommended.',
      predictedService: 'Periodic Inspection',
      predictedServiceDays: 25,
      predictedServiceMileage: 30000,
      healthStatus: 'GOOD',
      lastUpdated: new Date().toISOString()
    }));

    res.status(200).json({
      health: healthList,
      count: healthList.length
    });
  } catch (error: any) {
    console.error('getVehicleHealth error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle health', error: error.message });
  }
};

export const getReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const vehicles = await firebaseService.getVehiclesByOwner(userId);
    const reminders = vehicles.map((v: Vehicle) => ({
      id: `rem_${v.id}`,
      vehicleId: v.id,
      vehicleName: `${v.brand} ${v.model}`,
      registrationNumber: v.registrationNumber,
      title: 'Periodic Scheduled Maintenance',
      description: v.serviceReminderNotes || '30k km Service & Inspection',
      type: 'GENERAL_SERVICE',
      dueDate: v.nextServiceDueDate || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueMileage: v.nextMaintenanceMileage || 30000,
      daysRemaining: 20,
      urgency: 'MEDIUM',
      status: 'ACTIVE'
    }));

    res.status(200).json({
      reminders,
      count: reminders.length
    });
  } catch (error: any) {
    console.error('getReminders error:', error);
    res.status(500).json({ message: 'Server error fetching reminders', error: error.message });
  }
};

export const getRewards = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    points: 250,
    tier: 'SILVER',
    tierColor: '#94A3B8',
    lifetimePoints: 550,
    redeemedPoints: 300,
    nextTierPointsRemaining: 450,
    nextTierName: 'GOLD',
    availableCoupons: [
      { code: 'FLEET10', title: '10% Off Routine Service', discountAmount: 25, pointsCost: 100, minBillAmount: 100, expiresAt: '2026-12-31' },
      { code: 'BRAKE20', title: '$20 Off Brake Inspection', discountAmount: 20, pointsCost: 150, minBillAmount: 80, expiresAt: '2026-12-31' }
    ]
  });
};

export const redeemCoupon = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }
  const { code } = req.body;
  res.status(200).json({
    success: true,
    message: `Coupon ${code} redeemed successfully! Discount applied to your account.`,
    remainingPoints: 150
  });
};

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { bookingId } = req.params;

    const booking = await firebaseService.getDocument<Booking>('bookings', bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only access chat for your own bookings.' });
      return;
    }

    const messages = await firebaseService.getCollection('chatMessages', [{ field: 'bookingId', op: '==', value: bookingId }]);
    const mechanic = booking.mechanicId ? await firebaseService.getUserById(booking.mechanicId) : null;

    res.status(200).json({
      messages,
      count: messages.length,
      mechanic
    });
  } catch (error: any) {
    console.error('getChatMessages error:', error);
    res.status(500).json({ message: 'Server error fetching chat messages', error: error.message });
  }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array()[0].msg });
      return;
    }

    const userId = req.user!.userId;
    const user = await firebaseService.getUserById(userId);
    const { bookingId, message, imageUrl } = req.body;

    const booking = await firebaseService.getDocument<Booking>('bookings', bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only chat on your own bookings.' });
      return;
    }

    const msgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const chatMessage = await firebaseService.createDocument(
      'chatMessages',
      {
        bookingId,
        senderId: userId,
        senderName: user?.name || 'Customer',
        senderRole: 'CUSTOMER',
        message: message.trim(),
        imageUrl: imageUrl || ''
      },
      msgId
    );

    if (booking.mechanicId) {
      sendToUser(booking.mechanicId, 'CUSTOMER_CHAT_MESSAGE', {
        bookingId,
        message: chatMessage,
        sender: req.user
      });
    }

    res.status(201).json({ message: 'Message sent', chatMessage });
  } catch (error: any) {
    console.error('sendChatMessage error:', error);
    res.status(500).json({ message: 'Server error sending message', error: error.message });
  }
};
