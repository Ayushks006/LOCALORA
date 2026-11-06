import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Star,
  ArrowLeft,
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Experience, Review } from '../types';
import { BookingModal } from '../components/common/BookingModal';

export const ExperienceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadExperience(slug);
    }
  }, [slug]);

  const loadExperience = async (expSlug: string) => {
    setIsLoading(true);
    try {
      const res = await api.experiences.getBySlug(expSlug);
      setExperience(res.experience);

      if (res.experience?.id) {
        const revRes = await api.reviews
          .getByItem('experience', res.experience.id)
          .catch(() => ({ reviews: [] }));
        setReviews(revRes.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load experience', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-serif text-lg text-charcoal">Loading cultural experience...</p>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-ivory-200 text-center max-w-md">
          <Sparkles className="w-12 h-12 text-terracotta mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">Experience Not Found</h2>
          <p className="text-sm text-charcoal-400 mb-6">This experience might be unavailable or removed.</p>
          <Link
            to="/experiences"
            className="px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-700 transition"
          >
            Back to Experiences
          </Link>
        </div>
      </div>
    );
  }

  const inclusionsList = Array.isArray(experience.includes)
    ? experience.includes
    : typeof experience.includes === 'string'
    ? JSON.parse(experience.includes)
    : [];

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/experiences"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest hover:text-terracotta transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Experiences
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Photo Banner */}
        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden mb-10 shadow-elevated border border-ivory-200">
          <img
            src={
              experience.image_url ||
              'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80'
            }
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-forest text-white text-xs font-semibold">
                {experience.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-terracotta" /> {experience.duration_hours} hours
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-terracotta" /> Up to {experience.max_participants || 10} people
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
              {experience.title}
            </h1>
            <p className="text-sm text-ivory-200 flex items-center gap-1.5 mt-2">
              <MapPin className="w-4 h-4 text-terracotta" />
              {experience.locality ? `${experience.locality}, ` : ''}{experience.district}, Karnataka
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-forest">Experience Overview</h2>
              <p className="text-charcoal-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {experience.description}
              </p>
            </div>

            {/* Inclusions */}
            {inclusionsList.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-4">
                <h3 className="font-serif text-xl font-bold text-forest">What is Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inclusionsList.map((inc: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-ivory/60 border border-ivory-200 text-xs sm:text-sm text-charcoal">
                      <CheckCircle className="w-4 h-4 text-forest flex-shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hosted By Cultural Business */}
            {experience.business_name && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-forest-100 flex items-center justify-center flex-shrink-0">
                  <Building className="w-7 h-7 text-forest" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block">
                    Hosted By Local Collective
                  </span>
                  <h3 className="font-serif text-xl font-bold text-charcoal">{experience.business_name}</h3>
                  {experience.business_bio && (
                    <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                      {experience.business_bio}
                    </p>
                  )}
                  {experience.business_address && (
                    <p className="text-xs text-charcoal-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta" />
                      {experience.business_address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-forest">Verified Reviews</h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">Feedback from participants who attended this experience</p>
                </div>
                <div className="flex items-center gap-1.5 bg-ivory px-3 py-1.5 rounded-xl text-forest font-bold text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{Number(experience.rating_avg || 5.0).toFixed(1)}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-charcoal-400 italic py-4">
                  No written reviews yet. Be the first to participate and share your experience!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-ivory/50 border border-ivory-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-charcoal">{rev.author_name}</span>
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

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-elevated space-y-6">
              <div className="border-b border-ivory-200 pb-6">
                <span className="text-xs font-semibold uppercase text-charcoal-400 tracking-wider">
                  Ticket Price
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-serif text-3xl font-bold text-forest">
                    ₹{Number(experience.price_per_person).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-charcoal-400"> / participant</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-charcoal-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-forest" />
                  <span>Duration: {experience.duration_hours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-forest" />
                  <span>Small intimate group (Max {experience.max_participants || 10})</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest" />
                  <span>100% verified grassroots local business</span>
                </div>
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-forest text-white font-semibold text-sm hover:bg-forest-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Book This Experience
              </button>

              <p className="text-center text-[11px] text-charcoal-400">
                Host confirms availability before any payment is collected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {experience && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          bookingType="experience"
          item={experience}
          onBookingSuccess={() => {
            setIsBookingOpen(false);
          }}
        />
      )}
    </div>
  );
};
