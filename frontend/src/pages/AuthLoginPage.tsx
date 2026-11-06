import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-elevated border border-ivory-200 overflow-hidden">
        {/* Left Branding Panel */}
        <div className="bg-forest p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F5EF_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-sm overflow-hidden border border-ivory-300">
                <img src="/logo.png" alt="LOCALORA Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight">LOCALORA</span>
            </Link>

            <h2 className="font-serif text-3xl font-bold leading-tight mb-4">
              Welcome Back to Karnataka's Local Network
            </h2>
            <p className="text-forest-100 text-xs sm:text-sm leading-relaxed mb-6">
              Manage your bookings, explore authentic homestay stays, coordinate with licensed guides, and preserve local community heritage.
            </p>
          </div>

          {/* Member Features Badge */}
          <div className="relative z-10 pt-6 border-t border-forest-600/80 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-forest-100">
              <CheckCircle2 className="w-4 h-4 text-terracotta flex-shrink-0" />
              <span>Direct inquiries and transparent communication</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-forest-100">
              <CheckCircle2 className="w-4 h-4 text-terracotta flex-shrink-0" />
              <span>Certified local guides & licensed heritage homestays</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-forest-100">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Encrypted authentication & protected personal data</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold text-charcoal">Sign In</h3>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="p-3 mb-6 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-charcoal">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-forest text-white font-semibold text-sm hover:bg-forest-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ivory-200 text-center text-xs text-charcoal-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-forest hover:text-terracotta">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
