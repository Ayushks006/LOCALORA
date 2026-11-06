import React, { useState } from 'react';
import { X, Gem, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface SuggestPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SuggestPlaceModal: React.FC<SuggestPlaceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    contributor_name: user?.full_name || '',
    contributor_email: user?.email || '',
    destination_name: '',
    region_code: 'KA',
    district: '',
    locality: '',
    category_slug: 'heritage',
    description: '',
    best_time: '',
    latitude: '',
    longitude: '',
    image_url: '',
    image_attribution: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.community.suggest(formData);
      setSuccessMessage(res.message);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit place suggestion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated max-w-xl w-full overflow-hidden border border-ivory-200">
        {/* Header */}
        <div className="bg-forest px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
              <Gem className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Suggest a Hidden Gem</h3>
              <p className="text-xs text-ivory-100">Help the community discover lesser-known treasures</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successMessage ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-xl font-bold text-forest">Thank You, Explorer!</h4>
              <p className="text-xs text-charcoal-600 max-w-md mx-auto">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Contributor Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contributor_name}
                    onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="E.g. Ayush Sah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contributor_email}
                    onChange={(e) => setFormData({ ...formData, contributor_email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Destination Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Place Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination_name}
                    onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="E.g. Kavaledurga Fort"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Category *</label>
                  <select
                    value={formData.category_slug}
                    onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  >
                    <option value="heritage">Heritage & History</option>
                    <option value="hills-nature">Hills & Nature</option>
                    <option value="wildlife">Wildlife & Sanctuaries</option>
                    <option value="coastal">Beaches & Coastal</option>
                    <option value="waterfalls">Waterfalls & Gorges</option>
                    <option value="spiritual">Spiritual Destinations</option>
                    <option value="culture-cities">Culture & Cities</option>
                  </select>
                </div>
              </div>

              {/* Geography */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">District in Karnataka *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="E.g. Shivamogga, Uttara Kannada"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Nearest Locality or Town</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="E.g. Thirthahalli"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Description & What Makes It Special *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  placeholder="Historical background, landscape features, how to reach safely..."
                />
              </div>

              {/* Best time & Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Best Time to Visit</label>
                  <input
                    type="text"
                    value={formData.best_time}
                    onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="E.g. Post-monsoon, Oct - Feb"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <p className="text-[11px] text-charcoal-400">
                🔒 All community submissions are reviewed by editorial moderators before being published to protect sensitive ecosystems and historical sites.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Suggestion...' : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit for Editorial Review</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
