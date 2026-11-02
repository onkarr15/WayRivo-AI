import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService, paymentService } from '../../services';
import {
  CheckCircle2,
  Printer,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight
} from 'lucide-react';

const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('UPI (Google Pay / PhonePe / Paytm)');

  const fetchBooking = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await bookingService.getById(Number(id));
      setBooking(res.data?.data);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleDemoPayment = async () => {
    setPaying(true);
    try {
      const verifyRes = await paymentService.verifyPayment({
        bookingId: Number(id),
        paymentMethod: selectedMethod,
        notes: 'Verified demo escrow transaction',
      });
      if (verifyRes.data?.success) {
        setPaySuccess(true);
        fetchBooking();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing error');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card p-8 text-center max-w-xl mx-auto">
        <p className="text-text-light">Booking not found.</p>
        <Link to="/traveler/bookings" className="btn-primary mt-4 inline-flex">Go to Bookings</Link>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'PAID' || paySuccess;

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4">
      {/* Success Badge */}
      <div className="text-center my-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> ESCROW SECURED
        </span>
        <h1 className="text-3xl font-extrabold text-navy">WayRivo Booking Confirmed!</h1>
        <p className="text-xs text-text-light mt-1">
          Booking Reference: <span className="font-bold text-navy">{booking.bookingReference}</span>
        </p>
      </div>

      {/* Printable Receipt Card */}
      <div className="card p-6 sm:p-10 border border-border shadow-md bg-white print:border-none print:shadow-none mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
          <div>
            <span className="text-2xl font-black tracking-wider text-navy">WAY<span className="text-orange">RIVO</span></span>
            <p className="text-[11px] text-text-light mt-0.5">Your Trip. Your Budget. Your Way.</p>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-text-light block">Issue Date: {booking.bookingDate || new Date().toISOString().split('T')[0]}</span>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
              isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}>
              Payment: {isPaid ? 'PAID & HELD IN ESCROW' : 'PENDING ESCROW DEPOSIT'}
            </span>
          </div>
        </div>

        {/* Breakdown Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-navy uppercase tracking-wider text-[11px]">Traveler Information</h3>
            <p className="text-text"><span className="text-text-light font-semibold">Name:</span> {booking.travelerName}</p>
            <p className="text-text"><span className="text-text-light font-semibold">Travelers:</span> {booking.travelersCount} Travelers</p>
          </div>
          <div className="space-y-2 sm:text-right">
            <h3 className="font-bold text-navy uppercase tracking-wider text-[11px]">Assigned Specialist Agency</h3>
            <p className="text-text"><span className="text-text-light font-semibold">Specialist:</span> {booking.expertName}</p>
            <p className="text-text"><span className="text-text-light font-semibold">Agency:</span> {booking.organizationName}</p>
          </div>
        </div>

        {/* Trip Logistics Grid */}
        <div className="bg-bg rounded-2xl p-4.5 my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Destination</span>
            <span className="font-bold text-navy text-sm block mt-0.5">{booking.destination}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Travel Dates</span>
            <span className="font-semibold text-text block mt-0.5">{booking.travelStartDate || 'Flexible'} - {booking.travelEndDate || 'Flexible'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Proposal Title</span>
            <span className="font-semibold text-text truncate block mt-0.5">{booking.proposalTitle}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Total Amount</span>
            <span className="font-bold text-emerald-600 text-sm block mt-0.5">₹{Number(booking.totalAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Confirmation Box */}
        {!isPaid ? (
          <div className="border border-orange/30 bg-orange/5 rounded-2xl p-5 my-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-orange" />
              <h4 className="text-xs font-bold text-navy">Complete Secure Escrow Deposit</h4>
            </div>
            <p className="text-[11px] text-text-light mb-4">
              Your funds are held 100% securely in WayRivo Escrow and only disbursed to the specialist when your trip is completed.
            </p>

            <div className="space-y-2 mb-4">
              {['UPI (Google Pay / PhonePe / Paytm)', 'Credit / Debit Card (Visa, Mastercard, RuPay)', 'Net Banking (All Major Banks)'].map(m => (
                <label key={m} className="flex items-center gap-2 p-2.5 bg-white border border-border rounded-xl cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="paymethod"
                    checked={selectedMethod === m}
                    onChange={() => setSelectedMethod(m)}
                    className="accent-orange"
                  />
                  <span className="font-medium text-navy">{m}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleDemoPayment}
              disabled={paying}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              {paying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay ₹{Number(booking.totalAmount).toLocaleString()} (Test Escrow Mode)
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 my-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-950">
              <p className="font-bold">Payment Verified & Escrowed</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Amount of ₹{Number(booking.totalAmount).toLocaleString()} is safely deposited in WayRivo Escrow. The specialist has been notified to finalize your booking vouchers.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border print:hidden">
          <button onClick={handlePrint} className="btn-secondary text-xs flex items-center gap-2 w-full sm:w-auto">
            <Printer className="w-4 h-4" /> Print / Download Receipt
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/traveler/messages" className="btn-outline text-xs flex items-center justify-center gap-2 flex-1 sm:flex-initial">
              <MessageSquare className="w-4 h-4" /> Message Specialist
            </Link>
            <Link to="/traveler/bookings" className="btn-primary text-xs flex items-center justify-center gap-2 flex-1 sm:flex-initial">
              View All Bookings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
