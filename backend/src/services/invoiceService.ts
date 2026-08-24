import { firebaseService } from './firebaseService.ts';
import { Invoice } from '../../../src/types.ts';

export interface CreateInvoiceParams {
  bookingId: string;
  serviceCharges: number;
  partsCost: number;
  taxRate?: number;
}

export class InvoiceService {
  public async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const taxRate = params.taxRate ?? 0.1;
    const subtotal = params.serviceCharges + params.partsCost;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = subtotal + tax;
    const now = new Date().toISOString();

    const invoiceId = `INV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return firebaseService.createDocument<Invoice>(
      'invoices',
      {
        bookingId: params.bookingId,
        serviceCharges: params.serviceCharges,
        partsCost: params.partsCost,
        tax,
        amount: total,
        status: 'UNPAID',
        issuedAt: now,
        paidAt: null
      },
      invoiceId
    );
  }

  public async getInvoiceById(id: string): Promise<Invoice | null> {
    return firebaseService.getDocument<Invoice>('invoices', id);
  }

  public async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    return firebaseService.getInvoiceByBooking(bookingId);
  }

  public async getUserInvoices(userId: string): Promise<Invoice[]> {
    const userBookings = await firebaseService.getBookingsByCustomer(userId);
    const userBookingIds = new Set(userBookings.map((b) => b.id));
    const allInvoices = await firebaseService.getCollection<Invoice>('invoices');
    return allInvoices.filter((inv) => userBookingIds.has(inv.bookingId));
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
