import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle,
  Users,
  Coffee,
  Calendar,
  X,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { BookingModal } from '../components/common/BookingModal';
import { api } from '../services/api';
import { Homestay } from '../types';

export const HomestayDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [homestay, setHomestay] = useState<Homestay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadHomestay(slug);
    }
  }, [slug]);

  const loadHomestay = async (homestaySlug: string) => {
    setIsLoading(true);
    try {
      const res = await api.homestays.getBySlug(homestaySlug);
      setHomestay(res.homestay);
    } catch (err: any) {
      setError(err.message || 'Failed to load property details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 text-center text-xs text-charcoal-400 animate-pulse">
        Loading homestay details...
      </div>
    );
  }

  if (error || !homestay) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-charcoal">Listing Not Available</h2>
        <p className="text-xs text-charcoal-500">{error || 'This homestay property could not be found.'}</p>
        <Link to="/homestays" className="inline-block px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold">
          Browse All Homestays
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title & Host Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-forest-50 text-forest">
              {homestay.property_type}
            </span>
            {homestay.verified === 1 && (
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Host
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">{homestay.title}</h1>
          <p className="text-xs sm:text-sm text-charcoal-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-terracotta" />
            <span>{homestay.address}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1 font-bold text-base text-charcoal justify-end">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{homestay.rating_avg.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-charcoal-400">({homestay.reviews_count} reviews)</span>
          </div>
          <button
            onClick={() => setBookingModalOpen(true)}
            className="py-3 px-6 rounded-2xl bg-forest hover:bg-forest-700 text-white font-semibold text-sm transition shadow-md"
          >
            Book This Stay
          </button>
        </div>
      </div>

      {/* Main Image Banner */}
      <div className="relative aspect-[21/9] min-h-[300px] rounded-3xl overflow-hidden border border-ivory-200 shadow-soft">
        <img
          src={homestay.primary_image}
          alt={homestay.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Description, Rooms, Amenities */}
        <div className="lg:col-span-8 space-y-8">
          {/* Host info banner */}
          <div className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-forest text-white font-bold text-base flex items-center justify-center">
              {homestay.owner_name?.charAt(0) || 'H'}
            </div>
            <div>
              <p className="text-xs text-charcoal-400 uppercase font-bold tracking-wider">Hosted by</p>
              <h3 className="font-serif font-bold text-base text-charcoal">{homestay.owner_name || 'Verified Host'}</h3>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-charcoal">About the Property</h2>
            <p className="text-sm text-charcoal-700 leading-relaxed font-normal">{homestay.description}</p>
          </div>

          {/* Accommodation Highlights */}
          <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl bg-white border border-ivory-200 text-center">
            <div>
              <span className="text-lg font-bold text-forest">{homestay.max_guests}</span>
              <p className="text-[11px] text-charcoal-400 uppercase font-semibold">Max Guests</p>
            </div>
            <div>
              <span className="text-lg font-bold text-forest">{homestay.bedrooms}</span>
              <p className="text-[11px] text-charcoal-400 uppercase font-semibold">Bedrooms</p>
            </div>
            <div>
              <span className="text-lg font-bold text-forest">{homestay.bathrooms}</span>
              <p className="text-[11px] text-charcoal-400 uppercase font-semibold">Bathrooms</p>
            </div>
          </div>

          {/* Separate Rooms if configured */}
          {homestay.rooms && homestay.rooms.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-charcoal">Available Room Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {homestay.rooms.map((room) => (
                  <div key={room.id} className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft space-y-2">
                    <h4 className="font-serif font-bold text-base text-charcoal">{room.room_name}</h4>
                    <p className="text-xs text-charcoal-500">{room.description}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-charcoal-400">Sleeps {room.capacity} guests</span>
                      <span className="font-bold text-forest">₹{room.price_per_night.toLocaleString('en-IN')}/night</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-charcoal">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(homestay.amenities || []).map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs font-medium text-charcoal">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="p-6 rounded-2xl bg-white border border-ivory-200 space-y-3">
            <h3 className="font-serif font-bold text-base text-charcoal">Policies & House Rules</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-charcoal-400 block font-semibold">Check-in</span>
                <span className="font-bold text-charcoal">{homestay.check_in_time}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block font-semibold">Check-out</span>
                <span className="font-bold text-charcoal">{homestay.check_out_time}</span>
              </div>
            </div>
            <p className="text-xs text-charcoal-600 pt-2 border-t border-ivory-100 leading-relaxed">{homestay.rules}</p>
          </div>

          {/* Reviews */}
          {homestay.reviews && homestay.reviews.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-charcoal">Guest Reviews</h2>
              <div className="space-y-3">
                {homestay.reviews.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-white border border-ivory-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-charcoal">{rev.author_name || 'Verified Guest'}</span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span className="text-xs font-bold text-charcoal">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-charcoal-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Booking Box */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-white p-6 rounded-3xl border border-ivory-200 shadow-elevated space-y-5">
            <div className="flex items-baseline justify-between border-b border-ivory-100 pb-4">
              <div>
                <span className="font-serif text-3xl font-bold text-forest">
                  ₹{Number(homestay.price_per_night || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-charcoal-400"> / night</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{homestay.rating_avg.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-charcoal-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Double-booking prevention active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Authentic homemade regional cuisine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Free cancellation up to 48 hours prior</span>
              </div>
            </div>

            <button
              onClick={() => setBookingModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-sm transition shadow-sm"
            >
              Check Dates & Reserve
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        bookingType="homestay"
        item={homestay}
      />
    </div>
  );
};
