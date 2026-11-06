import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, X, AlertCircle, CheckCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BookingType, Homestay, GuideProfile, Experience } from '../../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: BookingType;
  item: Homestay | GuideProfile | Experience;
  onBookingSuccess?: (bookingId: number) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  bookingType,
  item,
  onBookingSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<{ available: boolean; reason?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default initial dates: Tomorrow & Day after tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 3);

      const toISO = (d: Date) => d.toISOString().split('T')[0];
      setStartDate(toISO(tomorrow));
      setEndDate(bookingType === 'experience' ? toISO(tomorrow) : toISO(dayAfter));
      setError(null);
      setAvailResult(null);
    }
  }, [isOpen, bookingType]);

  // Check availability on date change
  useEffect(() => {
    if (isOpen && startDate && endDate) {
      checkAvailability();
    }
  }, [startDate, endDate, selectedRoomId, guestsCount]);

  const checkAvailability = async () => {
    setIsCheckingAvail(true);
    setAvailResult(null);
    try {
      const res = await api.bookings.checkAvailability({
        booking_type: bookingType,
        item_id: item.id,
        room_id: selectedRoomId,
        start_date: startDate,
        end_date: endDate,
        guests_count: guestsCount,
      });
      setAvailResult(res);
    } catch (err: any) {
      setAvailResult({ available: false, reason: err.message });
    } finally {
      setIsCheckingAvail(false);
    }
  };

  if (!isOpen) return null;

  // Calculation helpers
  const getItemTitle = () => {
    if ('title' in item) return item.title;
    if ('full_name' in item) return `Local Guide ${item.full_name}`;
    return 'Tourism Service';
  };

  const getUnitPrice = (): number => {
    if (bookingType === 'homestay') {
      const h = item as Homestay;
      if (selectedRoomId && h.rooms) {
        const r = h.rooms.find((rm) => rm.id === selectedRoomId);
        if (r) return r.price_per_night || 0;
      }
      return h.price_per_night || 0;
    }
    if (bookingType === 'guide') {
      return (item as GuideProfile).pricing_per_day || 0;
    }
    return (item as Experience).price_per_person || 0;
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (bookingType === 'homestay') return Math.max(1, diffDays);
    if (bookingType === 'guide') return Math.max(1, diffDays + 1);
    return guestsCount; // For experience, unit is guests
  };

  const units = calculateDuration();
  const unitPrice = getUnitPrice();
  const totalAmount = unitPrice * units;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=back');
      return;
    }

    if (availResult && !availResult.available) {
      setError(availResult.reason || 'Requested dates are unavailable.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.bookings.create({
        booking_type: bookingType,
        item_id: item.id,
        room_id: selectedRoomId,
        start_date: startDate,
        end_date: endDate,
        guests_count: guestsCount,
        notes,
      });

      onClose();
      if (onBookingSuccess) {
        onBookingSuccess(res.booking.id);
      } else {
        navigate(`/dashboard/bookings`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated max-w-lg w-full overflow-hidden border border-ivory-200">
        {/* Header */}
        <div className="bg-forest px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta bg-white/10 px-2 py-0.5 rounded-full inline-block mb-1">
              {bookingType.toUpperCase()} RESERVATION
            </span>
            <h3 className="font-serif text-xl font-bold leading-tight">{getItemTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dates Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                {bookingType === 'homestay' ? 'Check-in Date' : 'Start Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                {bookingType === 'homestay' ? 'Check-out Date' : bookingType === 'experience' ? 'Session Date' : 'End Date'}
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              />
            </div>
          </div>

          {/* Room Selection for Homestay */}
          {bookingType === 'homestay' && (item as Homestay).rooms && (item as Homestay).rooms!.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Accommodation Unit</label>
              <select
                value={selectedRoomId || ''}
                onChange={(e) => setSelectedRoomId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              >
                <option value="">Whole Homestay (Default)</option>
                {(item as Homestay).rooms!.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name} (Up to {room.capacity} guests) — ₹{room.price_per_night.toLocaleString('en-IN')}/night
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Guest Count */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Number of Travellers</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={bookingType === 'homestay' ? (item as Homestay).max_guests : 20}
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              />
              <span className="text-xs text-charcoal-400">
                {bookingType === 'homestay'
                  ? `Max capacity: ${(item as Homestay).max_guests} guests`
                  : 'Total participants'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Notes for Host or Guide (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Arrival time, dietary preferences, special requirements..."
              className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
            />
          </div>

          {/* Availability Status Banner */}
          {isCheckingAvail ? (
            <div className="p-3 bg-ivory-50 rounded-xl text-xs text-charcoal-500 animate-pulse flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest" />
              <span>Checking real-time calendar availability...</span>
            </div>
          ) : availResult ? (
            availResult.available ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Selected dates are available for reservation!</span>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{availResult.reason}</span>
              </div>
            )
          ) : null}

          {/* Price Breakdown Preview */}
          <div className="bg-ivory-50 p-4 rounded-2xl border border-ivory-200 space-y-2 text-xs text-charcoal">
            <div className="flex justify-between">
              <span>
                ₹{unitPrice.toLocaleString('en-IN')}{' '}
                {bookingType === 'homestay'
                  ? '× ' + units + ' nights'
                  : bookingType === 'guide'
                  ? '× ' + units + ' days'
                  : '× ' + guestsCount + ' guests'}
              </span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-charcoal-400 text-[11px]">
              <span>Taxes & Community Platform Fee</span>
              <span className="text-emerald-700 font-medium">Included</span>
            </div>
            <div className="border-t border-ivory-200 pt-2 flex justify-between font-bold text-sm text-forest">
              <span>Total Payable</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || (availResult !== null && !availResult.available)}
            className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Submitting Request...'
            ) : !isAuthenticated ? (
              'Sign In to Request Booking'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Booking Request</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
