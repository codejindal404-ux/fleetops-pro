import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Invoice, Booking, Vehicle, User } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { notificationService } from '../services/notificationService.ts';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id: bookingId } = req.params;
    const { serviceCharges, partsCost, tax } = req.body;

    const booking = await firebaseService.getDocument<Booking>('bookings', bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({
        message: `Invoice can only be issued for COMPLETED bookings. Current booking status is ${booking.status}.`
      });
      return;
    }

    const existingInvoice = await firebaseService.getInvoiceByBooking(bookingId);
    if (existingInvoice) {
      res.status(409).json({ message: 'An invoice already exists for this booking.', invoice: existingInvoice });
      return;
    }

    const sCharges = Number(serviceCharges) || 0;
    const pCost = Number(partsCost) || 0;
    const tAmount = Number(tax) || 0;
    const total = sCharges + pCost + tAmount;
    const now = new Date().toISOString();

    const invoiceId = `INV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoice = await firebaseService.createDocument<Invoice>(
      'invoices',
      {
        bookingId,
        serviceCharges: sCharges,
        partsCost: pCost,
        tax: tAmount,
        amount: total,
        status: 'UNPAID',
        issuedAt: now,
        paidAt: null
      },
      invoiceId
    );

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
  } catch (error: any) {
    console.error('createInvoice error:', error);
    res.status(500).json({ message: 'Server error creating invoice', error: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const invoice = await firebaseService.getDocument<Invoice>('invoices', id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const booking = await firebaseService.getDocument<Booking>('bookings', invoice.bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Associated booking not found.' });
      return;
    }

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not own this invoice.' });
      return;
    }

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId);
    const customer = await firebaseService.getDocument<User>('users', booking.customerId);

    res.status(200).json({
      invoice,
      booking,
      vehicle,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
    });
  } catch (error: any) {
    console.error('getInvoiceById error:', error);
    res.status(500).json({ message: 'Server error fetching invoice', error: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    const { status } = req.query;

    let allInvoices: Invoice[] = [];

    if (role === 'CUSTOMER') {
      const customerBookings = await firebaseService.getBookingsByCustomer(userId);
      const bookingIds = new Set(customerBookings.map((b) => b.id));
      const invoices = await firebaseService.getCollection<Invoice>('invoices');
      allInvoices = invoices.filter((inv) => bookingIds.has(inv.bookingId));
    } else {
      allInvoices = await firebaseService.getCollection<Invoice>('invoices');
    }

    if (status && typeof status === 'string') {
      allInvoices = allInvoices.filter((inv) => inv.status === status.toUpperCase());
    }

    const enriched = await Promise.all(
      allInvoices.map(async (inv) => {
        const booking = await firebaseService.getDocument<Booking>('bookings', inv.bookingId);
        const vehicle = booking ? await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId) : null;
        const customer = booking ? await firebaseService.getDocument<User>('users', booking.customerId) : null;
        return {
          ...inv,
          booking,
          vehicle,
          customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
        };
      })
    );

    res.status(200).json({ invoices: enriched });
  } catch (error: any) {
    console.error('getInvoices error:', error);
    res.status(500).json({ message: 'Server error fetching invoices', error: error.message });
  }
};

export const payInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const invoice = await firebaseService.getDocument<Invoice>('invoices', id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const booking = await firebaseService.getDocument<Booking>('bookings', invoice.bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Associated booking not found.' });
      return;
    }

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only pay your own invoices.' });
      return;
    }

    if (invoice.status === 'PAID') {
      res.status(400).json({ message: 'Invoice is already marked as PAID.', invoice });
      return;
    }

    const paidInvoice = await firebaseService.updateDocument<Invoice>('invoices', id, {
      status: 'PAID',
      paidAt: new Date().toISOString()
    });

    try {
      await notificationService.notifyRole('ADMIN', {
        title: 'Payment Received',
        message: `Invoice #${paidInvoice?.id.slice(-6)} of $${paidInvoice?.amount.toFixed(2)} was successfully paid.`,
        type: 'PAYMENT_RECEIVED',
        link: '/admin',
        data: { invoiceId: paidInvoice?.id, amount: paidInvoice?.amount }
      });

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
  } catch (error: any) {
    console.error('payInvoice error:', error);
    res.status(500).json({ message: 'Server error paying invoice', error: error.message });
  }
};
