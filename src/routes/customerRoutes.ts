import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { dbStore } from '../services/dbStore.ts';
import { notificationService } from '../services/notificationService.ts';
import { sendToUser } from '../services/socketService.ts';

const router = Router();

// Protect ALL customer routes to CUSTOMER role only
router.use(authMiddleware);
router.use(restrictTo('CUSTOMER'));

// GET /api/customer/dashboard - Advanced customer dashboard summary
router.get('/dashboard', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const data = dbStore.getCustomerDashboardData(userId);
  res.status(200).json(data);
});

// GET /api/customer/vehicle-health - Vehicle health telemetry & AI prediction
router.get('/vehicle-health', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const healthList = dbStore.getCustomerVehiclesHealth(userId);
  res.status(200).json({
    health: healthList,
    count: healthList.length
  });
});

// GET /api/customer/reminders - Proactive maintenance & policy alerts
router.get('/reminders', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const reminders = dbStore.getCustomerReminders(userId);
  res.status(200).json({
    reminders,
    count: reminders.length
  });
});

// GET /api/customer/rewards - Fleet rewards & loyalty points
router.get('/rewards', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const rewards = dbStore.getLoyaltyRewards(userId);
  res.status(200).json(rewards);
});

// POST /api/customer/rewards/redeem - Redeem discount coupon with loyalty points
router.post(
  '/rewards/redeem',
  [body('code').trim().notEmpty().withMessage('Coupon code is required')],
  (req: Request, res: Response): void => {
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
  }
);

// GET /api/customer/chat/:bookingId - Real-time chat messages with assigned mechanic
router.get('/chat/:bookingId', (req: Request, res: Response): void => {
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
});

// POST /api/customer/chat/message - Send message to mechanic
router.post(
  '/chat/message',
  [
    body('bookingId').trim().notEmpty().withMessage('bookingId is required'),
    body('message').trim().notEmpty().withMessage('Message content cannot be empty')
  ],
  (req: Request, res: Response): void => {
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
      res.status(403).json({ message: 'Forbidden: You can only chat in your own service bookings.' });
      return;
    }

    const chatMsg = dbStore.addChatMessage({
      bookingId,
      senderId: userId,
      senderName: user?.name || 'Customer',
      senderRole: 'CUSTOMER',
      message,
      imageUrl
    });

    // Notify assigned mechanic if present
    if (booking.mechanicId) {
      sendToUser(booking.mechanicId, 'CHAT_MESSAGE_RECEIVED', {
        bookingId,
        message: chatMsg
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: chatMsg
    });
  }
);

// POST /api/customer/payment/create - Process payment via Gateway simulation (UPI, Card, Razorpay)
router.post(
  '/payment/create',
  [
    body('invoiceId').trim().notEmpty().withMessage('invoiceId is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('paymentMethod').isIn(['UPI', 'CARD', 'RAZORPAY', 'NET_BANKING']).withMessage('Valid payment method required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array()[0].msg });
      return;
    }

    const userId = req.user!.userId;
    const user = dbStore.getUserById(userId);
    const { invoiceId, amount, paymentMethod } = req.body;

    const invoice = dbStore.getInvoiceById(invoiceId);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const booking = dbStore.getBookingById(invoice.bookingId);
    if (!booking || booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
      return;
    }

    try {
      const { transaction, invoice: updatedInvoice } = dbStore.createPaymentTransaction({
        invoiceId,
        customerId: userId,
        amount: Number(amount),
        paymentMethod
      });

      // Dispatch real-time notification
      await notificationService.createNotification({
        userId,
        title: 'Payment Received & Verified',
        message: `Your payment of $${Number(amount).toFixed(2)} via ${paymentMethod} (Ref: ${transaction.transactionRef}) was processed successfully. Receipt ready.`,
        type: 'PAYMENT_RECEIVED',
        link: `/invoices`
      });

      dbStore.addAuditLog({
        action: 'PAY_INVOICE',
        performedBy: userId,
        performedByName: user?.name || 'Customer',
        performedByRole: 'CUSTOMER',
        targetType: 'INVOICE',
        targetId: invoiceId,
        details: `Customer completed payment of $${Number(amount).toFixed(2)} via ${paymentMethod} (TxRef: ${transaction.transactionRef}).`,
        status: 'SUCCESS'
      });

      res.status(200).json({
        message: 'Payment completed successfully',
        transaction,
        invoice: updatedInvoice
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Payment processing failed.' });
    }
  }
);

// GET /api/customer/invoices/:id/pdf - Professional PDF printable invoice HTML
router.get('/invoices/:id/pdf', (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const invoice = dbStore.getInvoiceById(id);
  if (!invoice) {
    res.status(404).send('<h1>Invoice Not Found</h1>');
    return;
  }

  const booking = dbStore.getBookingById(invoice.bookingId);
  if (!booking || booking.customerId !== userId) {
    res.status(403).send('<h1>Access Denied</h1>');
    return;
  }

  const customer = dbStore.getUserById(userId);
  const vehicle = dbStore.getVehicleById(booking.vehicleId);
  const mechanic = booking.mechanicId ? dbStore.getUserById(booking.mechanicId) : null;
  const serviceCenter = booking.serviceCenterId ? dbStore.getServiceCenterById(booking.serviceCenterId) : null;

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
      @media print { body { margin: 0; } .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 24px; text-align: right;">
      <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;">
        🖨️ Print / Save as PDF
      </button>
    </div>

    <div class="header">
      <div>
        <div class="brand">FLEETOPS<span>PRO</span></div>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Enterprise Automotive Service & Fleet Solutions</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0 0;">GSTIN: 07AABCF1234F1Z8 • Tax Invoice</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">INVOICE #${invoice.id}</div>
        <span class="badge ${invoice.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">
          ${invoice.status === 'PAID' ? '✓ PAID' : '⚠ PAYMENT PENDING'}
        </span>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Billed To (Customer)</div>
        <strong style="font-size: 14px; color: #0f172a;">${customer?.name || 'Customer'}</strong><br/>
        Email: ${customer?.email || 'N/A'}<br/>
        Phone: ${customer?.phone || 'N/A'}<br/>
        Account: Premium Customer
      </div>
      <div class="box">
        <div class="box-title">Vehicle & Service Center Details</div>
        <strong style="font-size: 14px; color: #0f172a;">${vehicle?.brand} ${vehicle?.model} (${vehicle?.year || 'N/A'})</strong><br/>
        Reg No: <strong>${vehicle?.registrationNumber || 'N/A'}</strong><br/>
        Garage: ${serviceCenter?.name || 'FleetOps Certified Bay'}<br/>
        Technician: ${mechanic?.name || 'Assigned Certified Mechanic'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service Item & Description</th>
          <th>Type</th>
          <th style="text-align: right;">Amount (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${booking.serviceType}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Comprehensive multi-point vehicle inspection, system diagnostics and recalibration.</span>
          </td>
          <td>Labor & Diagnostics</td>
          <td style="text-align: right; font-weight: 700;">$${invoice.serviceCharges.toFixed(2)}</td>
        </tr>
        <tr>
          <td>
            <strong>OEM Replacement Parts & Fluids</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Certified automotive fluids, filters, seals, and consumable hardware.</span>
          </td>
          <td>Parts & Materials</td>
          <td style="text-align: right; font-weight: 700;">$${invoice.partsCost.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-card">
      <div class="total-row"><span>Labor Subtotal:</span> <span>$${invoice.serviceCharges.toFixed(2)}</span></div>
      <div class="total-row"><span>Parts Subtotal:</span> <span>$${invoice.partsCost.toFixed(2)}</span></div>
      <div class="total-row"><span>Taxes & Levies (GST):</span> <span>$${(invoice.tax || 0).toFixed(2)}</span></div>
      <div class="total-row grand-total"><span>Total Amount:</span> <span>$${(invoice.amount || (invoice.serviceCharges + invoice.partsCost + (invoice.tax || 0))).toFixed(2)}</span></div>
    </div>

    <div class="footer">
      <p>Thank you for choosing FleetOps Pro. All services are backed by a 6-month / 10,000 km warranty.</p>
      <p>For inquiries: support@fleetops.com • +1 (800) 555-FLEET</p>
    </div>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// PATCH /api/customer/bookings/:id/cancel - Customer booking cancellation before service starts
router.patch('/bookings/:id/cancel', (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const result = dbStore.cancelBookingByCustomer(id, userId);

  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.status(200).json({
    message: result.message,
    booking: result.booking
  });
});

// GET /api/customer/preferences - Customer notification & alert preferences
router.get('/preferences', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const pref = dbStore.getCustomerPreferences(userId);
  res.status(200).json({ preferences: pref });
});

// PUT /api/customer/preferences - Update notification & alert preferences
router.put('/preferences', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const updated = dbStore.updateCustomerPreferences(userId, req.body);
  res.status(200).json({ message: 'Preferences updated successfully', preferences: updated });
});

// GET /api/customer/vehicles - Get own vehicles
router.get('/vehicles', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const vehicles = dbStore.getVehiclesByOwner(userId);
  res.status(200).json({
    vehicles,
    count: vehicles.length
  });
});

// POST /api/customer/vehicles - Register a new vehicle
router.post(
  '/vehicles',
  [
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('vehicleType').optional().isIn(['CAR', 'TRUCK', 'VAN', 'BUS', 'MOTORCYCLE']).withMessage('Invalid vehicle type')
  ],
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { registrationNumber, brand, model, year, vehicleType, mileage } = req.body;
    const userId = req.user!.userId;
    const user = dbStore.getUserById(userId);

    const existing = dbStore.getVehicleByRegNumber(registrationNumber);
    if (existing) {
      res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
      return;
    }

    const vehicle = dbStore.createVehicle({
      ownerId: userId,
      registrationNumber: registrationNumber.toUpperCase().trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      vehicleType: vehicleType || 'CAR',
      mileage: mileage ? Number(mileage) : undefined
    });

    dbStore.addAuditLog({
      action: 'ADD_VEHICLE',
      performedBy: userId,
      performedByName: user?.name || 'Customer',
      performedByRole: 'CUSTOMER',
      targetType: 'VEHICLE',
      targetId: vehicle.id,
      details: `Customer registered vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}).`,
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle
    });
  }
);

// GET /api/customer/bookings - View customer's service bookings with live progress
router.get('/bookings', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const bookings = dbStore.getBookingsByCustomer(userId);

  const enriched = bookings.map((b) => {
    const vehicle = dbStore.getVehicleById(b.vehicleId);
    const mechanic = b.mechanicId ? dbStore.getUserById(b.mechanicId) : null;
    const repairLogs = dbStore.getRepairLogsByBooking(b.id).map((rl) => {
      const user = dbStore.getUserById(rl.updatedBy);
      return {
        ...rl,
        updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null
      };
    });
    const invoice = dbStore.getInvoiceByBookingId(b.id);
    const feedback = dbStore.getFeedbackByBooking(b.id);

    return {
      ...b,
      vehicle,
      mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email, phone: mechanic.phone } : null,
      repairLogs,
      invoice,
      feedback
    };
  });

  res.status(200).json({
    bookings: enriched,
    count: enriched.length
  });
});

// POST /api/customer/bookings - Book a service appointment
router.post(
  '/bookings',
  [
    body('vehicleId').notEmpty().withMessage('vehicleId is required'),
    body('serviceType').trim().notEmpty().withMessage('serviceType is required'),
    body('preferredDate').notEmpty().withMessage('preferredDate is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { vehicleId, serviceType, preferredDate, serviceCenterId, issueDescription } = req.body;
    const userId = req.user!.userId;
    const user = dbStore.getUserById(userId);

    const vehicle = dbStore.getVehicleById(vehicleId);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    // Customer can only book for their own vehicle
    if (vehicle.ownerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only book service for vehicles you own.' });
      return;
    }

    const booking = dbStore.createBooking({
      vehicleId,
      customerId: userId,
      serviceType: serviceType.trim(),
      preferredDate,
      serviceCenterId,
      issueDescription
    });

    // Notify Customer & Admin
    await notificationService.createNotification({
      userId,
      title: 'Service Booking Submitted',
      message: `Your booking for ${serviceType} (${vehicle.brand} ${vehicle.model}) was scheduled for ${preferredDate}. Initial status: PENDING.`,
      type: 'BOOKING_CREATED',
      link: `/my-bookings`
    });

    await notificationService.notifyRole('ADMIN', {
      title: 'New Service Booking Received',
      message: `${user?.name || 'A customer'} requested ${serviceType} for ${vehicle.brand} ${vehicle.model}. Review & assign technician.`,
      type: 'BOOKING_CREATED',
      link: `/admin/dashboard`
    });

    dbStore.addAuditLog({
      action: 'CREATE_BOOKING',
      performedBy: userId,
      performedByName: user?.name || 'Customer',
      performedByRole: 'CUSTOMER',
      targetType: 'BOOKING',
      targetId: booking.id,
      details: `Customer booked ${booking.serviceType} for ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}). Initial status: PENDING.`,
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: 'Service appointment booked successfully with status PENDING',
      booking: {
        ...booking,
        vehicle,
        customer: user ? { id: user.id, name: user.name, email: user.email } : null
      }
    });
  }
);

// POST /api/customer/reviews - Submit review and rating for completed service
router.post(
  '/reviews',
  [
    body('bookingId').notEmpty().withMessage('bookingId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim()
  ],
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { bookingId, rating, comment } = req.body;
    const userId = req.user!.userId;
    const user = dbStore.getUserById(userId);

    const booking = dbStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only leave feedback for your own service bookings.' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({
        message: `Feedback can only be submitted for COMPLETED bookings. Current booking status is ${booking.status}.`
      });
      return;
    }

    const existingFeedback = dbStore.getFeedbackByBooking(bookingId);
    if (existingFeedback) {
      res.status(409).json({ message: 'Feedback has already been submitted for this service.', feedback: existingFeedback });
      return;
    }

    const feedback = dbStore.createFeedback(bookingId, userId, Number(rating), comment || '');

    dbStore.addAuditLog({
      action: 'SUBMIT_FEEDBACK',
      performedBy: userId,
      performedByName: user?.name || 'Customer',
      performedByRole: 'CUSTOMER',
      targetType: 'FEEDBACK',
      targetId: feedback.id,
      details: `Customer submitted ${rating}-star rating for booking ${bookingId}.`,
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  }
);

// PATCH /api/customer/invoices/:id/pay - Pay invoice for customer's booking
router.patch('/invoices/:id/pay', (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const user = dbStore.getUserById(userId);

  const invoice = dbStore.getInvoiceById(id);
  if (!invoice) {
    res.status(404).json({ message: 'Invoice not found.' });
    return;
  }

  const booking = dbStore.getBookingById(invoice.bookingId);
  if (!booking || booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
    return;
  }

  if (invoice.status === 'PAID') {
    res.status(400).json({ message: 'This invoice is already paid.', invoice });
    return;
  }

  const updatedInvoice = dbStore.payInvoice(id);

  dbStore.addAuditLog({
    action: 'PAY_INVOICE',
    performedBy: userId,
    performedByName: user?.name || 'Customer',
    performedByRole: 'CUSTOMER',
    targetType: 'INVOICE',
    targetId: id,
    details: `Customer settled invoice ${id} for $${invoice.amount.toFixed(2)}.`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    message: 'Invoice paid successfully',
    invoice: updatedInvoice
  });
});

// GET /api/customer/profile - Customer user profile
router.get('/profile', (req: Request, res: Response): void => {
  const userId = req.user!.userId;
  const user = dbStore.getUserById(userId);
  if (!user) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }
  const { password: _, ...safeUser } = user;
  res.status(200).json({ success: true, profile: safeUser, user: safeUser });
});

export const customerRoutes = router;
export default router;


