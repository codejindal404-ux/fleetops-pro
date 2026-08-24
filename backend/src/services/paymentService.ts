import { dbStore } from './dbStore.ts';

export interface PaymentProcessingResult {
  success: boolean;
  transactionId?: string;
  message: string;
  paidAt?: string;
}

export class PaymentService {
  public async processInvoicePayment(invoiceId: string, amount: number, paymentMethod: string): Promise<PaymentProcessingResult> {
    const invoice = dbStore.getInvoiceById(invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      return { success: false, message: 'Invoice is already paid' };
    }

    const transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paidInvoice = dbStore.payInvoice(invoiceId);

    if (!paidInvoice) {
      return { success: false, message: 'Failed to update invoice payment status' };
    }

    return {
      success: true,
      transactionId,
      paidAt: paidInvoice.paidAt || new Date().toISOString(),
      message: `Payment of $${amount} via ${paymentMethod} successfully processed.`
    };
  }
}

export const paymentService = new PaymentService();
