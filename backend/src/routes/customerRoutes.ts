import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { notificationService } from '../services/notificationService.ts';
import { sendToUser } from '../services/socketService.ts';
import { Booking, Vehicle, User, Invoice, Feedback, RepairLog, ChatMessage, PaymentTransaction } from '../types.ts';

const router = Router();

// Protect ALL customer routes to CUSTOMER role only
router.use(authMiddleware);
router.use(restrictTo('CUSTOMER'));

// GET /api/customer/dashboard - Advanced customer dashboard summary
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await firebaseService.getDocument<User>('users', userId);
    const vehicles = await firebaseService.getCollection<Vehicle>('vehicles', [{ field: 'ownerId', op: '==', value: userId }]);
    const bookings = await firebaseService.getBookingsByCustomer(userId);
    
    // Invoices are tied to bookings
    const bookingIds = bookings.map((b: any) => b.id);
    let invoices: Invoice[] = [];
    if (bookingIds.length > 0) {
      // Firebase 'in' queries are limited to 10 items, so chunk it if necessary. For simplicity we fetch all and filter.
      const allInvoices = await firebaseService.getCollection<Invoice>('invoices');
      invoices = allInvoices.filter(inv => bookingIds.includes(inv.bookingId));
    }
    
    // Rewards
    let rewards = await firebaseService.getDocument<any>('rewards', userId);
    if (!rewards) {
      rewards = { points: 0, tier: 'SILVER', customerId: userId };
    }

    const vehicleHealthList = vehicles.map((v: any) => ({
      vehicleId: v.id,
      brand: v.brand,
      model: v.model,
      healthScore: v.healthScore || 90,
      status: 'GOOD'
    }));

    const reminders = await firebaseService.getCollection<any>('reminders', [{ field: 'customerId', op: '==', value: userId }]);
    
    // Recommend garages (mock logic or actual)
    const recommendedGarages = await firebaseService.getCollection<any>('serviceCenters');
    const garagesSubset = recommendedGarages.slice(0, 3);

    const activeBookings = bookings.filter((b: any) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
    const completedServices = bookings.filter((b: any) => b.status === 'COMPLETED').length;

    const totalSpending = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    const pendingInvoicesAmount = invoices
      .filter(i => i.status === 'UNPAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    res.status(200).json({
      customer: {
        id: userId,
        name: user?.name || 'Valued Customer',
        email: user?.email || '',
        phone: user?.phone || '',
        membershipTier: rewards.tier,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`
      },
      stats: {
        totalVehicles: vehicles.length,
        activeBookings: activeBookings.length,
        completedServices,
        totalSpending,
        pendingInvoicesAmount,
        rewardPoints: rewards.points
      },
      vehicleHealthList,
      activeBookings,
      upcomingReminders: reminders,
      recommendedGarages: garagesSubset,
      rewards
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/vehicle-health
router.get('/vehicle-health', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const vehicles = await firebaseService.getCollection<Vehicle>('vehicles', [{ field: 'ownerId', op: '==', value: userId }]);
    const healthList = vehicles.map((v: any) => ({
      vehicleId: v.id,
      brand: v.brand,
      model: v.model,
      healthScore: v.healthScore || 90,
      status: 'GOOD'
    }));
    res.status(200).json({ health: healthList, count: healthList.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/reminders
router.get('/reminders', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const reminders = await firebaseService.getCollection<any>('reminders', [{ field: 'customerId', op: '==', value: userId }]);
    res.status(200).json({ reminders, count: reminders.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/rewards
router.get('/rewards', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    let rewards = await firebaseService.getDocument<any>('rewards', userId);
    if (!rewards) rewards = { points: 0, tier: 'SILVER', customerId: userId };
    res.status(200).json(rewards);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer/rewards/redeem
router.post(
  '/rewards/redeem',
  [body('code').trim().notEmpty().withMessage('Coupon code is required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array()[0].msg });
      return;
    }
    const userId = req.user!.userId;
    const { code } = req.body;
    
    // Mock redeem
    res.status(200).json({ success: true, message: 'Coupon applied successfully.', discount: 10 });
  }
);

// GET /api/customer/chat/:bookingId
router.get('/chat/:bookingId', async (req: Request, res: Response): Promise<void> => {
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

    const messages = await firebaseService.getCollection<ChatMessage>('chatMessages', [{ field: 'bookingId', op: '==', value: bookingId }]);
    
    let mechanic = null;
    if (booking.mechanicId) {
      mechanic = await firebaseService.getUserById(booking.mechanicId);
    }

    res.status(200).json({
      messages: messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      count: messages.length,
      mechanic
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer/chat/message
router.post(
  '/chat/message',
  [
    body('bookingId').trim().notEmpty().withMessage('bookingId is required'),
    body('message').trim().notEmpty().withMessage('Message content cannot be empty')
  ],
  async (req: Request, res: Response): Promise<void> => {
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
        res.status(403).json({ message: 'Forbidden: You can only chat in your own service bookings.' });
        return;
      }

      const chatMsg = await firebaseService.createDocument<ChatMessage>('chatMessages', {
        bookingId,
        senderId: userId,
        senderName: user?.name || 'Customer',
        senderRole: 'CUSTOMER',
        message,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString()
      });

      if (booking.mechanicId) {
        sendToUser(booking.mechanicId, 'CHAT_MESSAGE_RECEIVED', {
          bookingId,
          message: chatMsg
        });
      }

      res.status(201).json({ message: 'Message sent successfully', chatMessage: chatMsg });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/customer/payment/create
router.post(
  '/payment/create',
  [
    body('invoiceId').trim().notEmpty().withMessage('invoiceId is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('paymentMethod').isIn(['UPI', 'CARD', 'RAZORPAY', 'NET_BANKING']).withMessage('Valid payment method required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: errors.array()[0].msg });
        return;
      }

      const userId = req.user!.userId;
      const user = await firebaseService.getUserById(userId);
      const { invoiceId, amount, paymentMethod } = req.body;

      const invoice = await firebaseService.getDocument<Invoice>('invoices', invoiceId);
      if (!invoice) {
        res.status(404).json({ message: 'Invoice not found.' });
        return;
      }

      const booking = await firebaseService.getDocument<Booking>('bookings', invoice.bookingId);
      if (!booking || booking.customerId !== userId) {
        res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
        return;
      }

      // Simulate payment transaction
      const transactionRef = 'TXN' + Math.random().toString().slice(2, 10);
      const transaction = await firebaseService.createDocument<any>('payments', {
        invoiceId,
        customerId: userId,
        amount: Number(amount),
        paymentMethod,
        transactionRef,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      });

      // Update invoice
      await firebaseService.updateDocument<Invoice>('invoices', invoiceId, {
        status: 'PAID',
        paidAt: new Date().toISOString()
      });
      const updatedInvoice = await firebaseService.getDocument<Invoice>('invoices', invoiceId);

      await notificationService.createNotification({
        userId,
        title: 'Payment Received & Verified',
        message: `Your payment of $${Number(amount).toFixed(2)} via ${paymentMethod} (Ref: ${transactionRef}) was processed successfully.`,
        type: 'PAYMENT_RECEIVED',
        link: `/invoices`
      });

      res.status(200).json({ message: 'Payment completed successfully', transaction, invoice: updatedInvoice });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Payment processing failed.' });
    }
  }
);

// GET /api/customer/invoices/:id/pdf
router.get('/invoices/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const invoice = await firebaseService.getDocument<Invoice>('invoices', id);
    if (!invoice) {
      res.status(404).send('<h1>Invoice Not Found</h1>');
      return;
    }

    const booking = await firebaseService.getDocument<Booking>('bookings', invoice.bookingId);
    if (!booking || booking.customerId !== userId) {
      res.status(403).send('<h1>Access Denied</h1>');
      return;
    }

    const customer = await firebaseService.getUserById(userId);
    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId);
    const mechanic = booking.mechanicId ? await firebaseService.getUserById(booking.mechanicId) : null;
    const serviceCenter = booking.serviceCenterId ? await firebaseService.getDocument<any>('serviceCenters', booking.serviceCenterId) : null;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>FleetOps Pro Invoice #${invoice.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 32px; }
        .brand { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .brand span { color: #f59e0b; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-unpaid { background: #fee2e2; color: #991b1b; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13px; }
        .box-title { font-weight: 700; text-transform: uppercase; font-size: 11px; color: #64748b; margin-bottom: 12px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        th { text-align: left; padding: 12px 16px; background: #f1f5f9; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; }
        td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .total-card { margin-left: auto; width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .grand-total { border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 12px; font-size: 16px; font-weight: 800; color: #0f172a; }
        .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">FLEETOPS<span>PRO</span></div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">INVOICE #${invoice.id}</div>
          <span class="badge ${invoice.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">
            ${invoice.status === 'PAID' ? '✓ PAID' : '⚠ PAYMENT PENDING'}
          </span>
        </div>
      </div>
      <div class="grid">
        <div class="box">
          <div class="box-title">Billed To</div>
          <strong style="font-size: 14px; color: #0f172a;">${customer?.name || 'Customer'}</strong><br/>
          Email: ${customer?.email || 'N/A'}
        </div>
        <div class="box">
          <div class="box-title">Vehicle Details</div>
          <strong style="font-size: 14px; color: #0f172a;">${vehicle?.brand} ${vehicle?.model}</strong><br/>
          Reg No: ${vehicle?.registrationNumber || 'N/A'}
        </div>
      </div>
      <div class="total-card">
        <div class="total-row grand-total"><span>Total Amount:</span> <span>$${(invoice.amount || (invoice.serviceCharges + invoice.partsCost + (invoice.tax || 0))).toFixed(2)}</span></div>
      </div>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    res.status(500).send('<h1>Server Error</h1>');
  }
});

// PATCH /api/customer/bookings/:id/cancel
router.patch('/bookings/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }
    if (booking.customerId !== userId) {
      res.status(403).json({ message: 'Unauthorized: You can only cancel your own bookings.' });
      return;
    }
    if (booking.status === 'REPAIRING' || booking.status === 'COMPLETED') {
      res.status(400).json({ message: 'Booking cannot be cancelled now.' });
      return;
    }
    if (booking.status === 'CANCELLED') {
      res.status(400).json({ message: 'Booking is already cancelled.' });
      return;
    }
    await firebaseService.updateDocument<Booking>('bookings', id, { status: 'CANCELLED' });
    const updated = await firebaseService.getDocument<Booking>('bookings', id);
    res.status(200).json({ message: 'Booking cancelled successfully.', booking: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/preferences
router.get('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const pref = await firebaseService.getDocument<any>('preferences', userId) || {};
    res.status(200).json({ preferences: pref });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customer/preferences
router.put('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    // Overwrite/merge preferences
    const existing = await firebaseService.getDocument<any>('preferences', userId);
    let updated;
    if (existing) {
      await firebaseService.updateDocument<any>('preferences', userId, req.body);
      updated = await firebaseService.getDocument<any>('preferences', userId);
    } else {
      updated = await firebaseService.createDocument<any>('preferences', { ...req.body }, userId);
    }
    res.status(200).json({ message: 'Preferences updated successfully', preferences: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/vehicles
router.get('/vehicles', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const vehicles = await firebaseService.getVehiclesByOwner(userId);
    res.status(200).json({ vehicles, count: vehicles.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer/vehicles
router.post(
  '/vehicles',
  [
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('vehicleType').optional().isIn(['CAR', 'TRUCK', 'VAN', 'BUS', 'MOTORCYCLE']).withMessage('Invalid vehicle type')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
        return;
      }
      const { registrationNumber, brand, model, year, vehicleType, mileage } = req.body;
      const userId = req.user!.userId;
      
      const existing = await firebaseService.getCollection<Vehicle>('vehicles', [{ field: 'registrationNumber', op: '==', value: registrationNumber.toUpperCase().trim() }]);
      if (existing.length > 0) {
        res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
        return;
      }

      const vehicle = await firebaseService.createDocument<Vehicle>('vehicles', {
        ownerId: userId,
        registrationNumber: registrationNumber.toUpperCase().trim(),
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        vehicleType: vehicleType || 'CAR',
        mileage: mileage ? Number(mileage) : 0,
        createdAt: new Date().toISOString()
      });
      res.status(201).json({ message: 'Vehicle added successfully', vehicle });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/customer/bookings
router.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const bookings = await firebaseService.getBookingsByCustomer(userId);
    const enriched = await Promise.all(bookings.map(async (b: any) => {
      const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', b.vehicleId);
      const mechanic = b.mechanicId ? await firebaseService.getUserById(b.mechanicId) : null;
      const repairLogs = await firebaseService.getCollection<RepairLog>('repairLogs', [{ field: 'bookingId', op: '==', value: b.id }]);
      const enrichedLogs = await Promise.all(repairLogs.map(async (rl: any) => {
        const user = await firebaseService.getUserById(rl.updatedBy);
        return { ...rl, updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null };
      }));
      const invoiceCol = await firebaseService.getCollection<Invoice>('invoices', [{ field: 'bookingId', op: '==', value: b.id }]);
      const feedbackCol = await firebaseService.getCollection<Feedback>('feedback', [{ field: 'bookingId', op: '==', value: b.id }]);
      return {
        ...b,
        vehicle,
        mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email, phone: mechanic.phone } : null,
        repairLogs: enrichedLogs,
        invoice: invoiceCol.length > 0 ? invoiceCol[0] : null,
        feedback: feedbackCol.length > 0 ? feedbackCol[0] : null
      };
    }));
    res.status(200).json({ bookings: enriched, count: enriched.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer/bookings
router.post(
  '/bookings',
  [
    body('vehicleId').notEmpty().withMessage('vehicleId is required'),
    body('serviceType').trim().notEmpty().withMessage('serviceType is required'),
    body('preferredDate').notEmpty().withMessage('preferredDate is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
        return;
      }
      const { vehicleId, serviceType, preferredDate, serviceCenterId, issueDescription } = req.body;
      const userId = req.user!.userId;
      const user = await firebaseService.getUserById(userId);
      const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', vehicleId);
      if (!vehicle) {
        res.status(404).json({ message: 'Vehicle not found.' });
        return;
      }
      if (vehicle.ownerId !== userId) {
        res.status(403).json({ message: 'Forbidden: You can only book service for vehicles you own.' });
        return;
      }
      const booking = await firebaseService.createDocument<Booking>('bookings', {
        vehicleId,
        customerId: userId,
        serviceType: serviceType.trim(),
        preferredDate,
        serviceCenterId: serviceCenterId || null,
        issueDescription: issueDescription || '',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await notificationService.createNotification({
        userId,
        title: 'Service Booking Submitted',
        message: `Your booking for ${serviceType} (${vehicle.brand} ${vehicle.model}) was scheduled for ${preferredDate}.`,
        type: 'BOOKING_CREATED',
        link: `/my-bookings`
      });
      await notificationService.notifyRole('ADMIN', {
        title: 'New Service Booking Received',
        message: `${user?.name || 'A customer'} requested ${serviceType} for ${vehicle.brand} ${vehicle.model}.`,
        type: 'BOOKING_CREATED',
        link: `/admin/dashboard`
      });
      res.status(201).json({
        message: 'Service appointment booked successfully with status PENDING',
        booking: { ...booking, vehicle, customer: user ? { id: user.id, name: user.name, email: user.email } : null }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/customer/reviews
router.post(
  '/reviews',
  [
    body('bookingId').notEmpty().withMessage('bookingId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
        return;
      }
      const { bookingId, rating, comment } = req.body;
      const userId = req.user!.userId;
      const booking = await firebaseService.getDocument<Booking>('bookings', bookingId);
      if (!booking) {
        res.status(404).json({ message: 'Booking not found.' });
        return;
      }
      if (booking.customerId !== userId) {
        res.status(403).json({ message: 'Forbidden: You can only leave feedback for your own bookings.' });
        return;
      }
      if (booking.status !== 'COMPLETED') {
        res.status(400).json({ message: `Feedback can only be submitted for COMPLETED bookings.` });
        return;
      }
      const existing = await firebaseService.getCollection<Feedback>('feedback', [{ field: 'bookingId', op: '==', value: bookingId }]);
      if (existing.length > 0) {
        res.status(409).json({ message: 'Feedback already submitted.', feedback: existing[0] });
        return;
      }
      const feedback = await firebaseService.createDocument<Feedback>('feedback', {
        bookingId,
        customerId: userId,
        rating: Number(rating),
        comment: comment || '',
        createdAt: new Date().toISOString()
      });
      res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/customer/invoices/:id/pay
router.patch('/invoices/:id/pay', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const invoice = await firebaseService.getDocument<Invoice>('invoices', id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }
    const booking = await firebaseService.getDocument<Booking>('bookings', invoice.bookingId);
    if (!booking || booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
      return;
    }
    if (invoice.status === 'PAID') {
      res.status(400).json({ message: 'This invoice is already paid.', invoice });
      return;
    }
    await firebaseService.updateDocument<Invoice>('invoices', id, { status: 'PAID', paidAt: new Date().toISOString() });
    const updated = await firebaseService.getDocument<Invoice>('invoices', id);
    res.status(200).json({ message: 'Invoice paid successfully', invoice: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer/profile
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await firebaseService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }
    const { password: _, ...safeUser } = user as any;
    res.status(200).json({ success: true, profile: safeUser, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export const customerRoutes = router;
export default router;
