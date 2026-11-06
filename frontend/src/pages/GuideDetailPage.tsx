import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  MapPin,
  Languages,
  Award,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Clock,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { GuideProfile, Review } from '../types';
import { BookingModal } from '../components/common/BookingModal';

export const GuideDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadGuideDetails(Number(id));
    }
  }, [id]);

  const loadGuideDetails = async (guideId: number) => {
    setIsLoading(true);
    try {
      const [guideRes, reviewsRes] = await Promise.all([
        api.guides.getById(guideId),
        api.reviews.getByItem('guide', guideId).catch(() => ({ reviews: [] })),
      ]);
      setGuide(guideRes.guide);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      console.error('Failed to load guide details', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-serif text-lg text-charcoal">Loading guide profile...</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-ivory-200 text-center max-w-md">
          <ShieldCheck className="w-12 h-12 text-terracotta mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">Guide Not Found</h2>
          <p className="text-sm text-charcoal-400 mb-6">This guide profile is not available or inactive.</p>
          <Link
            to="/guides"
            className="px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-700 transition"
          >
            Back to Guides
          </Link>
        </div>
      </div>
    );
  }

  const languagesList = Array.isArray(guide.languages)
    ? guide.languages
    : typeof guide.languages === 'string'
    ? JSON.parse(guide.languages)
    : ['Kannada', 'English'];

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Back button bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest hover:text-terracotta transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Guides
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guide Profile Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <img
                src={
                  guide.avatar_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
                }
                alt={guide.full_name || 'Guide'}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-forest/20 shadow-md flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-forest-100 text-forest text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-terracotta" />
                    {guide.badge_label || 'Certified Guide'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {Number(guide.rating_avg || 5.0).toFixed(1)} ({guide.reviews_count} reviews)
                  </span>
                </div>
                <h1 className="font-serif text-3xl font-bold text-charcoal">{guide.full_name}</h1>
                <p className="text-sm text-charcoal-400 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-terracotta" />
                  Primary Region: <strong className="text-charcoal-600">{guide.district}, Karnataka</strong>
                </p>
                {guide.license_number && (
                  <p className="text-xs text-charcoal-400 mt-1">
                    Accreditation / Badge ID: <span className="font-mono text-charcoal">{guide.license_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Biography & Storytelling */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-forest">About Your Guide</h2>
              <p className="text-charcoal-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {guide.bio ||
                  'Experienced local certified guide specializing in regional heritage, monument history, local mythology, flora and fauna.'}
              </p>
            </div>

            {/* Languages & Coverage Area */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-forest mb-3 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-terracotta" /> Languages Spoken Fluently
                </h3>
                <div className="flex flex-wrap gap-2">
                  {languagesList.map((lang: string, i: number) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-xl bg-ivory text-forest text-sm font-semibold border border-ivory-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {guide.service_area && (
                <div className="pt-4 border-t border-ivory-200">
                  <h3 className="font-serif text-lg font-bold text-forest mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-terracotta" /> Service Areas & Circuits
                  </h3>
                  <p className="text-sm text-charcoal-500">{guide.service_area}</p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-forest">Verified Traveller Reviews</h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">Reviews submitted by travellers with confirmed bookings</p>
                </div>
                <div className="flex items-center gap-1.5 bg-ivory px-3 py-1.5 rounded-xl text-forest font-bold text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{Number(guide.rating_avg || 5.0).toFixed(1)}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-charcoal-400 italic py-4">
                  No written reviews yet. Be the first to book and share your feedback!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-ivory/50 border border-ivory-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-charcoal">{rev.author_name}</span>
                          {rev.is_verified_booking ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-100 text-forest text-[10px] font-semibold">
                              <CheckCircle className="w-3 h-3 text-forest" /> Verified Booking
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-charcoal-600 leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-charcoal-400 mt-2 block">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-elevated space-y-6">
              <div className="border-b border-ivory-200 pb-6">
                <span className="text-xs font-semibold uppercase text-charcoal-400 tracking-wider">
                  Guiding Fee
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-serif text-3xl font-bold text-forest">
                    ₹{Number(guide.pricing_per_day).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-charcoal-400"> / full day</span>
                </div>
                <p className="text-[11px] text-charcoal-400 mt-1">
                  Includes personalized narrative tour, monument context, and historical interpretation.
                </p>
              </div>

              <div className="space-y-3 text-xs text-charcoal-600">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-forest" />
                  <span>Licensed directly with verified credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-forest" />
                  <span>Standard 8-hour guided day tour</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest" />
                  <span>Safe, secure platform reservation & escrow</span>
                </div>
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-forest text-white font-semibold text-sm hover:bg-forest-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Request Guide Reservation
              </button>

              <p className="text-center text-[11px] text-charcoal-400">
                No immediate payment required until the guide confirms your date availability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {guide && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          bookingType="guide"
          item={guide}
          onBookingSuccess={() => {
            setIsBookingOpen(false);
          }}
        />
      )}
    </div>
  );
};
