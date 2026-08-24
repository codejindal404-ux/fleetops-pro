import React, { useState } from 'react';
import { Invoice } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { X, CreditCard, QrCode, Building2, CheckCircle2, ShieldCheck, Download, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, isOpen, onClose, onPaymentSuccess }) => {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'RAZORPAY' | 'NET_BANKING'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [completedTx, setCompletedTx] = useState<any>(null);

  if (!isOpen) return null;

  const baseTotal = invoice.amount || (invoice.serviceCharges + invoice.partsCost + (invoice.tax || 0));
  const finalAmount = Math.max(0, baseTotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await apiClient.redeemCustomerCoupon(couponCode.trim());
      if (res.success) {
        setDiscount(res.discountAmount);
        setCouponMsg(`✓ ${res.message}`);
      }
    } catch (err: any) {
      setCouponMsg(`✗ ${err.message || 'Invalid coupon'}`);
    }
  };

  const handleExecutePayment = async () => {
    try {
      setProcessing(true);
      const res = await apiClient.processCustomerPayment({
        invoiceId: invoice.id,
        amount: finalAmount,
        paymentMethod: method
      });

      setCompletedTx(res.transaction);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      alert(err.message || 'Payment execution failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Secure Checkout & Settlement</h3>
              <p className="text-xs text-slate-400">Invoice #{invoice.id} • FleetOps Pro Gateway</p>
            </div>
          </div>

          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedTx ? (
          /* Payment Success State */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Payment Successfully Verified!</h3>
              <p className="text-xs text-slate-500 mt-1">Transaction Ref: <span className="font-mono font-bold text-slate-700">{completedTx.transactionRef}</span></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900">${finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-800">{completedTx.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Timestamp:</span>
                <span>{new Date(completedTx.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1 font-medium"><Sparkles className="w-3.5 h-3.5" /> Loyalty Earned:</span>
                <span className="font-bold">+{Math.max(10, Math.floor(finalAmount / 10))} pts</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                id="download-pdf-invoice-btn"
                href={`/api/customer/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" /> Download Official Tax Invoice (PDF)
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold text-xs text-slate-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="p-6 space-y-5">
            {/* Invoice Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Certified Technician Labor:</span>
                <span className="font-semibold text-slate-900">${invoice.serviceCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>OEM Replacement Hardware & Fluids:</span>
                <span className="font-semibold text-slate-900">${invoice.partsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable Taxes (GST):</span>
                <span className="font-semibold text-slate-900">${(invoice.tax || 0).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold pt-1 border-t border-slate-200">
                  <span>Loyalty Coupon Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-sm font-black text-slate-900">
                <span>Total Payable:</span>
                <span className="text-lg text-emerald-600">${finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Code Redemption */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" /> Apply Fleet Loyalty Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLEET10, FLEET25"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className={`text-[11px] font-medium ${couponMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponMsg}
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Select Gateway Method</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    method === 'UPI'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">UPI / QR Code</div>
                    <div className={`text-[10px] ${method === 'UPI' ? 'text-slate-300' : 'text-slate-500'}`}>GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    method === 'CARD'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Credit / Debit Card</div>
                    <div className={`text-[10px] ${method === 'CARD' ? 'text-slate-300' : 'text-slate-500'}`}>Visa, MasterCard, Amex</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('RAZORPAY')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    method === 'RAZORPAY'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Razorpay Express</div>
                    <div className={`text-[10px] ${method === 'RAZORPAY' ? 'text-slate-300' : 'text-slate-500'}`}>Instant 1-Click Pay</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('NET_BANKING')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    method === 'NET_BANKING'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Net Banking</div>
                    <div className={`text-[10px] ${method === 'NET_BANKING' ? 'text-slate-300' : 'text-slate-500'}`}>All Indian Banks</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit SSL Encrypted • PCI-DSS Level 1 Certified Gateway</span>
            </div>

            {/* Execute Payment Button */}
            <button
              id="confirm-pay-btn"
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {processing ? (
                <span>Authorizing with Bank...</span>
              ) : (
                <>
                  <span>Authorize & Pay ${finalAmount.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
