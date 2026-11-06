import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Users,
  Sparkles,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Phone,
  Mail,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Booking, Homestay, GuideProfile, Experience } from '../../types';

export const ProviderDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [homestayListings, setHomestayListings] = useState<Homestay[]>([]);
  const [guideProfile, setGuideProfile] = useState<GuideProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');

  // Reject modal
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProviderData();
  }, [isAuthenticated, user?.role]);

  const loadProviderData = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'homestay_owner') {
        const [bookRes, listRes] = await Promise.all([
          api.homestays.getMyBookings().catch(() => ({ bookings: [] })),
          api.homestays.getMyListings().catch(() => ({ listings: [] })),
        ]);
        setIncomingBookings(bookRes.bookings || []);
        setHomestayListings(listRes.listings || []);
      } else if (user?.role === 'guide') {
        const [bookRes, profRes] = await Promise.all([
          api.guides.getMyBookings().catch(() => ({ bookings: [] })),
          api.guides.getMyProfile().catch(() => ({ guide: null as any })),
        ]);
        setIncomingBookings(bookRes.bookings || []);
        setGuideProfile(profRes.guide || null);
      } else if (user?.role === 'business_owner') {
        const [bookRes, expRes] = await Promise.all([
          api.experiences.getMyBookings().catch(() => ({ bookings: [] })),
          api.experiences.getMyExperiences().catch(() => ({ experiences: [] })),
        ]);
        setIncomingBookings(bookRes.bookings || []);
        setExperiences(expRes.experiences || []);
      }
    } catch (err) {
      console.error('Failed to load provider data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: number, newStatus: string, reason?: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.bookings.updateStatus(bookingId, newStatus, reason);
      setRejectModalBooking(null);
      setRejectReason('');
      await loadProviderData();
    } catch (err: any) {
      alert(err.message || `Failed to update booking to ${newStatus}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredBookings = incomingBookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed' || b.status === 'paid';
    return true;
  });

  const totalRevenue = incomingBookings
    .filter((b) => b.status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const pendingRequestsCount = incomingBookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header Banner */}
      <section className="bg-forest text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-terracotta" />
              Provider Portal: {user?.role?.replace('_', ' ').toUpperCase()}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">
              {user?.full_name || 'Business Partner'}
            </h1>
            <p className="text-forest-100 text-xs sm:text-sm mt-1">
              Review reservation inquiries, accept dates, and manage your local hospitality listings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Edit Provider Profile</span>
            </Link>
            <div className="flex items-center gap-2 bg-forest-800/90 border border-forest-600 px-4 py-2 rounded-2xl text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Verified Partner Status</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Pending Requests
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-charcoal mt-3">
              {pendingRequestsCount}
            </p>
            <p className="text-xs text-charcoal-400 mt-1">Requires your prompt confirmation</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Total Bookings
              </span>
              <div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center text-forest">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-charcoal mt-3">
              {incomingBookings.length}
            </p>
            <p className="text-xs text-charcoal-400 mt-1">All-time customer reservations</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Secured Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-forest mt-3">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-charcoal-400 mt-1">Paid / completed reservations</p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ivory-200 pb-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-charcoal">Incoming Inquiries & Bookings</h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Review dates, check guest counts, and accept or reject reservations
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-ivory p-1 rounded-xl border border-ivory-200 text-xs font-semibold">
              {(['pending', 'confirmed', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg capitalize transition ${
                    activeTab === tab ? 'bg-forest text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal'
                  }`}
                >
                  {tab === 'pending' ? `Pending (${pendingRequestsCount})` : tab}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-28 bg-ivory/50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-ivory/30 rounded-2xl border border-ivory-200 p-6">
              <CheckCircle className="w-10 h-10 text-forest-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-charcoal">No bookings in this tab</p>
              <p className="text-xs text-charcoal-400 mt-1">
                When travellers request dates, their inquiries appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-ivory/30 border border-ivory-200 hover:border-forest/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal">{b.tourist_name || 'Traveller'}</span>
                      <span className="text-xs text-charcoal-400">({b.tourist_email})</span>
                      <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest text-[10px] font-semibold uppercase">
                        {b.booking_code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-terracotta" />
                        <strong>{b.start_date}</strong> to <strong>{b.end_date}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-terracotta" />
                        {b.guests_count} Guests
                      </span>
                      {b.room_name && (
                        <span className="flex items-center gap-1 font-semibold text-forest">
                          Room: {b.room_name}
                        </span>
                      )}
                      <span className="font-serif font-bold text-forest text-sm">
                        ₹{Number(b.total_price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-xs text-charcoal-500 italic bg-white/70 p-2 rounded-lg border border-ivory-200">
                        "{b.notes}"
                      </p>
                    )}
                  </div>

                  {/* Provider Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                    {b.status === 'pending' && (
                      <>
                        <button
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusChange(b.id, 'confirmed')}
                          className="px-4 py-2 rounded-xl bg-forest text-white hover:bg-forest-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Accept Dates
                        </button>
                        <button
                          disabled={isUpdatingStatus}
                          onClick={() => setRejectModalBooking(b)}
                          className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </>
                    )}

                    {b.status === 'confirmed' && (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Tourist Payment
                      </span>
                    )}

                    {b.status === 'paid' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Paid & Confirmed
                        </span>
                        <button
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusChange(b.id, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-forest-600 text-white hover:bg-forest-700 text-xs font-semibold transition"
                        >
                          Mark Completed
                        </button>
                      </div>
                    )}

                    {b.status === 'completed' && (
                      <span className="text-xs font-semibold text-forest bg-forest-100 px-3 py-1.5 rounded-xl border border-forest-300">
                        Stay Completed ✓
                      </span>
                    )}

                    {b.status === 'rejected' && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listing Overview for Homestay Owners */}
        {user?.role === 'homestay_owner' && homestayListings.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft">
            <h3 className="font-serif text-xl font-bold text-charcoal mb-4">Your Property Listings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homestayListings.map((h) => (
                <div key={h.id} className="p-4 rounded-2xl bg-ivory/50 border border-ivory-200 flex gap-4">
                  <img
                    src={h.cover_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80'}
                    alt={h.name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-forest">{h.property_type}</span>
                    <h4 className="font-serif font-bold text-base text-charcoal truncate">{h.name}</h4>
                    <p className="text-xs text-charcoal-400">{h.district}, Karnataka</p>
                    <p className="text-xs font-bold text-forest mt-2">
                      Starting ₹{Number(h.price_per_night_min).toLocaleString('en-IN')}/night
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevated max-w-md w-full p-6 border border-ivory-200 space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal">Decline Reservation Request</h3>
            <p className="text-xs text-charcoal-500">
              Provide a brief explanation for declining dates requested by {rejectModalBooking.tourist_name}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Reason for Declining</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Dates already booked offline, property under maintenance..."
                className="w-full px-3 py-2 rounded-xl border border-ivory-300 text-xs focus:outline-none focus:border-forest"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-500 hover:bg-ivory rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange(rejectModalBooking.id, 'rejected', rejectReason)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 shadow-sm"
              >
                {isUpdatingStatus ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
