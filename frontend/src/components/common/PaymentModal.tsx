import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Booking } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#174D3A', '#D87955', '#F7F5EF'],
      });
    } catch {
      // ignore
    }
  };

  const handleSimulatePayment = async (shouldSucceed: boolean) => {
    setIsProcessing(true);
    setError(null);
    try {
      await api.payments.simulate(booking.id, shouldSucceed);
      if (shouldSucceed) {
        setIsSuccess(true);
        triggerConfetti();
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1800);
      } else {
        setError('Payment simulation simulated a declined card/gateway failure.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated max-w-md w-full overflow-hidden border border-ivory-200">
        {/* Header */}
        <div className="bg-charcoal px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-lg font-bold">Localora Payment Gateway</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Summary Box */}
          <div className="bg-ivory-50 p-4 rounded-2xl border border-ivory-200 text-xs text-charcoal space-y-2">
            <div className="flex justify-between font-mono text-[11px] text-charcoal-400">
              <span>REFERENCE:</span>
              <span className="font-bold text-forest">{booking.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Details:</span>
              <span className="font-medium">{booking.item_title || 'Reservation'}</span>
            </div>
            <div className="flex justify-between">
              <span>Dates:</span>
              <span>{booking.start_date} to {booking.end_date}</span>
            </div>
            <div className="border-t border-ivory-200 pt-2 flex justify-between font-bold text-sm text-forest">
              <span>Amount Due:</span>
              <span>₹{Number(booking.total_amount || booking.total_price || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Sandbox Notice Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Development Demonstration Sandbox</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Real payment credentials (e.g. Razorpay Key ID & Secret) are configured via environment variables.
                Use the safe simulator below to test successful completion or failure flows.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-emerald-900">Payment Processed!</h4>
              <p className="text-xs text-emerald-700">
                Booking reference {booking.reference_number} is now marked as paid.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSimulatePayment(true)}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Simulation...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simulate Successful Payment (Demo)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSimulatePayment(false)}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl border border-charcoal-300 hover:bg-charcoal-50 text-charcoal font-medium text-xs transition"
              >
                Simulate Gateway Decline / Failure (Demo)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
