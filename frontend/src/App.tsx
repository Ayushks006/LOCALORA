import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { DestinationDetailPage } from './pages/DestinationDetailPage';
import { HomestaysPage } from './pages/HomestaysPage';
import { HomestayDetailPage } from './pages/HomestayDetailPage';
import { GuidesPage } from './pages/GuidesPage';
import { GuideDetailPage } from './pages/GuideDetailPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage';
import { InteractiveMapPage } from './pages/InteractiveMapPage';
import { DiscoverHiddenGemsPage } from './pages/DiscoverHiddenGemsPage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthRegisterPage } from './pages/AuthRegisterPage';
import { TouristDashboardPage } from './pages/dashboard/TouristDashboardPage';
import { ProviderDashboardPage } from './pages/dashboard/ProviderDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage, PoliciesPage, AttributionsPage } from './pages/StaticPages';
import { useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-serif text-lg text-charcoal">Loading LOCALORA Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
          <Route path="/homestays" element={<HomestaysPage />} />
          <Route path="/homestays/:slug" element={<HomestayDetailPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:id" element={<GuideDetailPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/experiences/:slug" element={<ExperienceDetailPage />} />
          <Route path="/map" element={<InteractiveMapPage />} />
          <Route path="/discover-hidden-gems" element={<DiscoverHiddenGemsPage />} />
          <Route path="/trip-planner" element={<TripPlannerPage />} />

          {/* Authentication */}
          <Route path="/login" element={<AuthLoginPage />} />
          <Route path="/register" element={<AuthRegisterPage />} />

          {/* Portals, Profile & Dashboards */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<TouristDashboardPage />} />
          <Route path="/provider" element={<ProviderDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Institutional & Static Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/terms" element={<PoliciesPage />} />
          <Route path="/privacy" element={<PoliciesPage />} />
          <Route path="/image-manifest" element={<AttributionsPage />} />
          <Route path="/attributions" element={<AttributionsPage />} />

          {/* Fallback 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl border border-ivory-200 shadow-soft max-w-md">
                  <h2 className="font-serif text-3xl font-bold text-forest mb-2">404</h2>
                  <p className="font-bold text-charcoal mb-1">Destination Not Found</p>
                  <p className="text-xs text-charcoal-400 mb-6">
                    The trail you followed does not seem to lead anywhere. Let's return to known territory.
                  </p>
                  <a
                    href="/"
                    className="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest-700 transition"
                  >
                    Return to Homepage
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};
