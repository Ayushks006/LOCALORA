import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Home,
  Users,
  Sparkles,
  Map as MapIcon,
  Gem,
  Calendar,
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Notification } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      // ignore
    }
  };

  const navLinks = [
    { label: 'Destinations', path: '/destinations', icon: Compass },
    { label: 'Homestays', path: '/homestays', icon: Home },
    { label: 'Local Guides', path: '/guides', icon: Users },
    { label: 'Experiences', path: '/experiences', icon: Sparkles },
    { label: 'Map Explorer', path: '/map', icon: MapIcon },
    { label: 'Hidden Gems', path: '/discover-hidden-gems', icon: Gem },
    { label: 'Trip Planner', path: '/trip-planner', icon: Calendar },
  ];

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'guide' || user.role === 'homestay_owner' || user.role === 'business_owner') {
      return '/provider';
    }
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-ivory-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-ivory-300 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-0.5">
              <img src="/logo.png" alt="LOCALORA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-forest block leading-none">
                LOCALORA
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-terracotta block mt-0.5">
                Karnataka • India
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-forest bg-forest-50 font-semibold'
                      : 'text-charcoal-700 hover:text-forest hover:bg-ivory-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-forest' : 'text-charcoal-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-full text-charcoal-600 hover:text-forest hover:bg-ivory-100 transition relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-ivory-200 py-3 z-50">
                    <div className="px-4 py-2 border-b border-ivory-200 flex items-center justify-between">
                      <div className="font-semibold text-charcoal text-sm flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-forest-50 text-forest text-xs px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-terracotta hover:underline font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-ivory-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-charcoal-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            to={n.link_url || '#'}
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (!n.is_read) api.notifications.markRead(n.id);
                            }}
                            className={`block px-4 py-3 hover:bg-ivory-50 transition ${
                              !n.is_read ? 'bg-forest-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-charcoal">{n.title}</p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-terracotta flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-charcoal-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-charcoal-400 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Authentication Buttons or Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-full border border-ivory-200 hover:border-forest/40 transition bg-ivory-50"
                >
                  <span className="text-xs font-semibold text-charcoal hidden sm:inline max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-forest/20">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      user.full_name.charAt(0)
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-ivory-200 py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-ivory-200">
                      <p className="font-semibold text-charcoal text-xs truncate">{user.full_name}</p>
                      <p className="text-[11px] text-charcoal-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-forest-50 text-forest">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-forest hover:bg-forest-50/50 font-semibold border-b border-ivory-100"
                    >
                      <UserIcon className="w-4 h-4 text-forest" />
                      <span>My Profile & Settings</span>
                    </Link>

                    <Link
                      to={getDashboardLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50 font-medium"
                    >
                      Dashboard Overview
                    </Link>

                    {user.role === 'admin' ? (
                      <>
                        <Link
                          to="/admin/verification"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          Provider Verification
                        </Link>
                        <Link
                          to="/admin/community"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          Community Moderation
                        </Link>
                      </>
                    ) : user.role === 'tourist' ? (
                      <>
                        <Link
                          to="/dashboard/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          My Reservations
                        </Link>
                        <Link
                          to="/trip-planner"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          Saved & Itineraries
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/provider/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          Incoming Bookings
                        </Link>
                        <Link
                          to="/provider/listings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-charcoal hover:bg-ivory-50"
                        >
                          My Listings
                        </Link>
                      </>
                    )}

                    <div className="border-t border-ivory-200 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-forest hover:bg-forest-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-forest text-white hover:bg-forest-700 shadow-sm transition"
                >
                  Join Localora
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-charcoal xl:hidden hover:bg-ivory-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-ivory-200 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-forest-50 text-forest font-semibold' : 'text-charcoal hover:bg-ivory-100'
                }`}
              >
                <Icon className="w-5 h-5 text-forest" />
                {link.label}
              </Link>
            );
          })}

          {isAuthenticated && user && (
            <div className="pt-3 border-t border-ivory-200 mt-2 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-forest bg-forest-50/60"
              >
                <UserIcon className="w-5 h-5 text-forest" />
                <span>My Profile ({user.full_name})</span>
              </Link>
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-ivory-100"
              >
                <Compass className="w-5 h-5 text-forest" />
                <span>Dashboard Overview</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
