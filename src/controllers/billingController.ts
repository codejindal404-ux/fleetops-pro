import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore } from '../services/dbStore.ts';
import { notificationService } from '../services/notificationService.ts';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id: bookingId } = req.params;
  const { serviceCharges, partsCost, tax } = req.body;

  const booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Only allowed if booking is COMPLETED
  if (booking.status !== 'COMPLETED') {
    res.status(400).json({
      message: `Invoice can only be issued for COMPLETED bookings. Current booking status is ${booking.status}.`
    });
    return;
  }

  // Check if invoice already exists
  const existingInvoice = dbStore.getInvoiceByBookingId(bookingId);
  if (existingInvoice) {
    res.status(409).json({ message: 'An invoice already exists for this booking.', invoice: existingInvoice });
    return;
  }

  const invoice = dbStore.createInvoice(
    bookingId,
    Number(serviceCharges),
    Number(partsCost),
    Number(tax)
  );

  // Notify customer of invoice generation
  try {
    await notificationService.createNotification({
      userId: booking.customerId,
      title: 'Invoice Ready for Payment',
      message: `Invoice #${invoice.id.slice(-6)} issued for $${invoice.amount.toFixed(2)}. Please complete payment.`,
      type: 'INVOICE_GENERATED',
      link: '/customer',
      data: { invoiceId: invoice.id, bookingId: booking.id, amount: invoice.amount }
    });
  } catch (err) {
    console.error('Failed to dispatch invoice notification:', err);
  }

  res.status(201).json({ message: 'Invoice created successfully', invoice });
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const invoice = dbStore.getInvoiceById(id);
  if (!invoice) {
    res.status(404).json({ message: 'Invoice not found.' });
    return;
  }

  const booking = dbStore.getBookingById(invoice.bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Associated booking not found.' });
    return;
  }

  // Access check: customer must own the booking, or admin
  if (role === 'CUSTOMER' && booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
    return;
  }

  const vehicle = dbStore.getVehicleById(booking.vehicleId);
  const customer = dbStore.getUserById(booking.customerId);

  res.status(200).json({
    invoice,
    booking,
    vehicle,
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
  });
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.user!;
  const { status } = req.query;

  let allInvoices = dbStore.getInvoices();

  if (role === 'CUSTOMER') {
    const customerBookings = dbStore.getBookingsByCustomer(userId).map((b) => b.id);
    allInvoices = allInvoices.filter((inv) => customerBookings.includes(inv.bookingId));
  }

  if (status && typeof status === 'string') {
    allInvoices = allInvoices.filter((inv) => inv.status === status.toUpperCase());
  }

  // Enrich with booking & vehicle info
  const enriched = allInvoices.map((inv) => {
    const booking = dbStore.getBookingById(inv.bookingId);
    const vehicle = booking ? dbStore.getVehicleById(booking.vehicleId) : null;
    const customer = booking ? dbStore.getUserById(booking.customerId) : null;
    return {
      ...inv,
      booking,
      vehicle,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
    };
  });

  res.status(200).json({ invoices: enriched });
};

export const payInvoice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const invoice = dbStore.getInvoiceById(id);
  if (!invoice) {
    res.status(404).json({ message: 'Invoice not found.' });
    return;
  }

  const booking = dbStore.getBookingById(invoice.bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Associated booking not found.' });
    return;
  }

  // Access check: owner customer or admin
  if (role === 'CUSTOMER' && booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You can only pay your own invoices.' });
    return;
  }

  if (invoice.status === 'PAID') {
    res.status(400).json({ message: 'Invoice is already marked as PAID.', invoice });
    return;
  }

  const paidInvoice = dbStore.payInvoice(id);

  // Real-time notifications for payment
  try {
    // Notify Admin
    await notificationService.notifyRole('ADMIN', {
      title: 'Payment Received',
      message: `Invoice #${paidInvoice?.id.slice(-6)} of $${paidInvoice?.amount.toFixed(2)} was successfully paid.`,
      type: 'PAYMENT_RECEIVED',
      link: '/admin',
      data: { invoiceId: paidInvoice?.id, amount: paidInvoice?.amount }
    });

    // Notify Customer
    if (paidInvoice) {
      await notificationService.createNotification({
        userId: booking.customerId,
        title: 'Payment Receipt Confirmed',
        message: `Your payment of $${paidInvoice.amount.toFixed(2)} for Invoice #${paidInvoice.id.slice(-6)} has been confirmed.`,
        type: 'PAYMENT_RECEIVED',
        link: '/customer',
        data: { invoiceId: paidInvoice.id, amount: paidInvoice.amount }
      });
    }
  } catch (err) {
    console.error('Failed to dispatch payment notification:', err);
  }

  res.status(200).json({
    message: 'Invoice payment simulated successfully. Status set to PAID.',
    invoice: paidInvoice
  });
};
