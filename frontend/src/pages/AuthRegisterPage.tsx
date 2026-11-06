import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Home,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthRegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tourist');

  // Provider specific fields
  const [businessName, setBusinessName] = useState('');
  const [district, setDistrict] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
        business_name: businessName.trim() || undefined,
        district: district.trim() || undefined,
      });

      if (role === 'guide' || role === 'homestay_owner' || role === 'business_owner') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: any }[] = [
    {
      role: 'tourist',
      title: 'Traveller / Tourist',
      desc: 'Discover places, reserve homestays, hire guides, book experiences',
      icon: User,
    },
    {
      role: 'homestay_owner',
      title: 'Homestay Host',
      desc: 'List your heritage home, coffee estate, or coastal retreat',
      icon: Home,
    },
    {
      role: 'guide',
      title: 'Certified Guide',
      desc: 'Offer historical commentary, nature trails, and personalized tours',
      icon: Users,
    },
    {
      role: 'business_owner',
      title: 'Cultural Business',
      desc: 'Host pottery workshops, textile weaving, or spice farm walks',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-elevated border border-ivory-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left Hero Sidebar */}
          <div className="lg:col-span-2 bg-forest p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-sm overflow-hidden border border-ivory-300">
                  <img src="/logo.png" alt="LOCALORA Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight">LOCALORA</span>
              </Link>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight mb-3">
                Join the Local Tourism Community
              </h2>
              <p className="text-forest-100 text-xs sm:text-sm leading-relaxed mb-6">
                Connect directly with rural hospitality and heritage guardians across Karnataka.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-forest-800/80 border border-forest-600 text-xs text-ivory-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-terracotta-200">
                <ShieldCheck className="w-4 h-4 text-terracotta-300" />
                <span>Verified Ecosystem</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Homestay hosts and guides undergo administrative review and certification verification before public listing.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3 p-8 sm:p-10">
            <h3 className="font-serif text-2xl font-bold text-charcoal">Create an Account</h3>
            <p className="text-xs text-charcoal-400 mt-1 mb-6">
              Choose your role to get started with the Localora platform
            </p>

            {error && (
              <div className="p-3 mb-6 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection radio pills */}
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-2">Select Account Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = role === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setRole(opt.role)}
                        className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-forest/10 border-forest text-forest shadow-sm'
                            : 'bg-ivory/50 border-ivory-200 text-charcoal hover:bg-ivory'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-forest text-white' : 'bg-ivory-200 text-charcoal-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs block leading-tight">{opt.title}</span>
                          <span className="text-[10px] text-charcoal-400 block mt-0.5 leading-snug">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Gowda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="anand@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  required
                  minLength={6}
                />
              </div>

              {/* Conditional business fields */}
              {role !== 'tourist' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-ivory/60 border border-ivory-200">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      {role === 'homestay_owner' ? 'Homestay Property Name' : 'Business / Trade Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Brahmagiri Estate Stay"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-ivory-300 text-xs focus:outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Primary District</label>
                    <input
                      type="text"
                      placeholder="e.g. Kodagu, Chikkamagaluru"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-ivory-300 text-xs focus:outline-none focus:border-forest"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-forest text-white font-semibold text-sm hover:bg-forest-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-ivory-200 text-center text-xs text-charcoal-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-forest hover:text-terracotta">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
