import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Bookmark,
  Home,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Booking, Destination, Notification } from '../../types';
import { PaymentModal } from '../../components/common/PaymentModal';
import { ReviewModal } from '../../components/common/ReviewModal';

export const TouristDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, savedRes, notifRes] = await Promise.all([
        api.bookings.getMyBookings(),
        api.itineraries.getSaved().catch(() => ({ savedDestinations: [] })),
        api.notifications.getAll().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);
      setBookings(bookingsRes.bookings || []);
      setSavedDestinations(savedRes.savedDestinations || []);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Failed to load tourist dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      await api.bookings.cancel(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      setCancelReason('');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed' || b.status === 'paid';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Awaiting Provider Approval
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" /> Approved — Ready to Pay
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Payment Secured & Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-100 text-forest text-xs font-semibold border border-forest-300">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Declined by Host
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'homestay':
        return <Home className="w-4 h-4 text-forest" />;
      case 'guide':
        return <Users className="w-4 h-4 text-forest" />;
      case 'experience':
        return <Sparkles className="w-4 h-4 text-forest" />;
      default:
        return <MapPin className="w-4 h-4 text-forest" />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header Banner */}
      <section className="bg-forest text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-2">
              Traveller Dashboard
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">
              Namaskara, {user?.full_name || 'Traveller'}
            </h1>
            <p className="text-forest-100 text-xs sm:text-sm mt-1">
              Manage your Karnataka homestay reservations, guided tours, and itinerary bookmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 rounded-xl bg-forest-700 text-white hover:bg-forest-600 text-xs font-semibold border border-forest-500 transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-terracotta" /> Edit Profile
            </Link>
            <Link
              to="/trip-planner"
              className="px-4 py-2 rounded-xl bg-forest-700 text-white hover:bg-forest-600 text-xs font-semibold border border-forest-500 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-terracotta" /> Open Trip Planner
            </Link>
            <Link
              to="/destinations"
              className="px-4 py-2 rounded-xl bg-terracotta text-white hover:bg-terracotta-600 text-xs font-semibold transition"
            >
              Explore Places
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Bookings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ivory-200 pb-4 mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-charcoal">My Reservations</h2>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    {bookings.length} total booking requests made
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-ivory p-1 rounded-xl border border-ivory-200 text-xs font-semibold">
                  {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition ${
                        activeTab === tab ? 'bg-forest text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-32 bg-ivory/50 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 bg-ivory/40 rounded-2xl border border-ivory-200 p-6">
                  <Calendar className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-charcoal">No bookings found in this view</p>
                  <p className="text-xs text-charcoal-400 mt-1 mb-4">
                    Ready to explore Karnataka? Browse authentic homestays or hire certified guides.
                  </p>
                  <Link
                    to="/homestays"
                    className="inline-block px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest-700 transition"
                  >
                    Browse Homestays
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-sm hover:shadow-md transition space-y-4"
                    >
                      {/* Top bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ivory-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-forest-50 border border-forest-100">
                            {getItemIcon(b.booking_type)}
                          </span>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-terracotta tracking-wider">
                              {b.booking_type}
                            </span>
                            <h3 className="font-serif text-base font-bold text-charcoal leading-snug">
                              {b.item_title}
                            </h3>
                          </div>
                        </div>
                        <div>{getStatusBadge(b.status)}</div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Dates</span>
                          <span className="font-semibold text-charcoal">
                            {b.start_date} {b.end_date !== b.start_date ? `to ${b.end_date}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Party</span>
                          <span className="font-semibold text-charcoal">
                            {b.guests_count} {b.guests_count > 1 ? 'Guests' : 'Guest'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Reference</span>
                          <span className="font-mono text-charcoal-600 text-[11px]">{b.booking_code}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Amount</span>
                          <span className="font-serif font-bold text-forest text-sm">
                            ₹{Number(b.total_price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ivory-100">
                        <span className="text-[10px] text-charcoal-400">
                          Requested: {new Date(b.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Cancel action if pending or confirmed */}
                          {(b.status === 'pending' || b.status === 'confirmed') && (
                            <button
                              onClick={() => setCancelModalBooking(b)}
                              className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                            >
                              Cancel Booking
                            </button>
                          )}

                          {/* Pay Now simulation if confirmed and payment pending */}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => setPaymentBooking(b)}
                              className="px-4 py-1.5 rounded-xl bg-forest text-white hover:bg-forest-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay ₹{Number(b.total_price).toLocaleString('en-IN')}
                            </button>
                          )}

                          {/* Write Review if completed */}
                          {b.status === 'completed' && (
                            <button
                              onClick={() => setReviewBooking(b)}
                              className="px-3 py-1.5 rounded-xl bg-terracotta text-white hover:bg-terracotta-600 text-xs font-semibold transition flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5" /> Rate & Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Saved Destinations & Notifications */}
          <div className="space-y-6">
            {/* Saved Destinations Preview */}
            <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-terracotta" /> Saved Places
                </h3>
                <span className="text-xs text-charcoal-400">{savedDestinations.length}</span>
              </div>

              {savedDestinations.length === 0 ? (
                <p className="text-xs text-charcoal-400 italic">No saved places yet.</p>
              ) : (
                <div className="space-y-3">
                  {savedDestinations.slice(0, 4).map((dest) => (
                    <Link
                      key={dest.id}
                      to={`/destinations/${dest.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-ivory/60 transition border border-transparent hover:border-ivory-200 group"
                    >
                      <img
                        src={
                          dest.cover_image ||
                          dest.image_url ||
                          'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={dest.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-charcoal group-hover:text-forest transition truncate">
                          {dest.name}
                        </h4>
                        <p className="text-[10px] text-charcoal-400">{dest.district}, Karnataka</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-charcoal-300 group-hover:text-forest transition" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
              <h3 className="font-serif text-lg font-bold text-forest mb-3">Activity & Updates</h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-charcoal-400 italic">No recent notifications.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        n.is_read ? 'bg-ivory/30 border-ivory-200 text-charcoal-500' : 'bg-forest-50/50 border-forest-200 text-forest-900 font-medium'
                      }`}
                    >
                      <p className="text-[11px]">{n.message}</p>
                      <span className="text-[9px] text-charcoal-400 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          isOpen={!!paymentBooking}
          onClose={() => setPaymentBooking(null)}
          booking={paymentBooking}
          onPaymentSuccess={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          targetType={reviewBooking.booking_type as any}
          targetId={reviewBooking.item_id}
          targetTitle={reviewBooking.item_title || 'Reservation'}
          bookingId={reviewBooking.id}
          onReviewSubmitted={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevated max-w-md w-full p-6 border border-ivory-200 space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal">Cancel Reservation</h3>
            <p className="text-xs text-charcoal-500">
              Are you sure you want to cancel your booking for{' '}
              <strong>{cancelModalBooking.item_title}</strong>?
            </p>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, changed travel dates..."
                className="w-full px-3 py-2 rounded-xl border border-ivory-300 text-xs focus:outline-none focus:border-forest"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-500 hover:bg-ivory rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 shadow-sm"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
