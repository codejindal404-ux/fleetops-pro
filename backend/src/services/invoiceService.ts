import { dbStore, InvoiceRecord } from './dbStore.ts';

export interface CreateInvoiceParams {
  bookingId: string;
  serviceCharges: number;
  partsCost: number;
  taxRate?: number;
}

export class InvoiceService {
  public createInvoice(params: CreateInvoiceParams): InvoiceRecord {
    const taxRate = params.taxRate ?? 0.1;
    const subtotal = params.serviceCharges + params.partsCost;
    const tax = Number((subtotal * taxRate).toFixed(2));

    return dbStore.createInvoice(
      params.bookingId,
      params.serviceCharges,
      params.partsCost,
      tax
    );
  }

  public getInvoiceById(id: string): InvoiceRecord | undefined {
    return dbStore.getInvoiceById(id);
  }

  public getInvoiceByBookingId(bookingId: string): InvoiceRecord | undefined {
    return dbStore.getInvoiceByBookingId(bookingId);
  }

  public getUserInvoices(userId: string): InvoiceRecord[] {
    const userBookingIds = dbStore.getBookingsByCustomer(userId).map((b) => b.id);
    return dbStore.getInvoices().filter((inv) => userBookingIds.includes(inv.bookingId));
  }
}

export const invoiceService = new InvoiceService();
