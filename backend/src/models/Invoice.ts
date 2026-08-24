import { InvoiceStatus } from '../types/index.ts';

export interface InvoiceModel {
  id: string;
  bookingId: string;
  serviceCharges: number;
  partsCost: number;
  tax: number;
  amount: number;
  status: InvoiceStatus;
  paymentMethod?: string;
  paidAt?: string | null;
  createdAt: string;
}
