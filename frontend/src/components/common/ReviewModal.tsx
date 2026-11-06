import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'destination' | 'homestay' | 'guide' | 'experience';
  targetId: number;
  targetTitle: string;
  bookingId?: number;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  bookingId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.reviews.submit({
        target_type: targetType,
        target_id: targetId,
        rating,
        comment: comment.trim(),
        booking_id: bookingId,
      });

      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated max-w-md w-full overflow-hidden border border-ivory-200">
        <div className="bg-forest px-6 py-4 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta">SHARE FEEDBACK</span>
            <h3 className="font-serif text-lg font-bold truncate max-w-xs">{targetTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-charcoal-600 mb-2">Overall Rating</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        active ? 'text-amber-400 fill-amber-400' : 'text-ivory-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-medium text-forest mt-1 block">
              {rating === 5 ? 'Exceptional Experience' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Could be Better'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Your Detailed Experience</label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you enjoy most? How was the hospitality, guide knowledge, or amenities?"
              className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
