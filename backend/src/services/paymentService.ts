import { firebaseService } from './firebaseService.ts';
import { Invoice } from '../../../src/types.ts';

export interface PaymentProcessingResult {
  success: boolean;
  transactionId?: string;
  message: string;
  paidAt?: string;
}

export class PaymentService {
  public async processInvoicePayment(invoiceId: string, amount: number, paymentMethod: string): Promise<PaymentProcessingResult> {
    const invoice = await firebaseService.getDocument<Invoice>('invoices', invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      return { success: false, message: 'Invoice is already paid' };
    }

    const transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paidAt = new Date().toISOString();
    const paidInvoice = await firebaseService.updateDocument<Invoice>('invoices', invoiceId, {
      status: 'PAID',
      paidAt
    });

    if (!paidInvoice) {
      return { success: false, message: 'Failed to update invoice payment status' };
    }

    return {
      success: true,
      transactionId,
      paidAt,
      message: `Payment of $${amount} via ${paymentMethod} successfully processed.`
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
