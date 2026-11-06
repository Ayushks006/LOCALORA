import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Gem,
  Home,
  Users,
  Sparkles,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Compass,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CommunitySubmission } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'community' | 'homestays' | 'guides' | 'logs'>('community');
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [homestays, setHomestays] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Moderation state
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, user?.role]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, commRes, homeRes, guideRes, logRes] = await Promise.all([
        api.admin.getStats().catch(() => ({ stats: {} })),
        api.admin.getCommunity().catch(() => ({ submissions: [] })),
        api.admin.getHomestays().catch(() => ({ homestays: [] })),
        api.admin.getGuides().catch(() => ({ guides: [] })),
        api.admin.getAuditLogs().catch(() => ({ logs: [] })),
      ]);

      setStats(statsRes.stats || {});
      setSubmissions(commRes.submissions || []);
      setHomestays(homeRes.homestays || []);
      setGuides(guideRes.guides || []);
      setAuditLogs(logRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerateCommunity = async (
    submissionId: number,
    status: 'approved' | 'rejected',
    publishAsDest = true
  ) => {
    setProcessingId(submissionId);
    try {
      await api.admin.moderateCommunity(submissionId, {
        status,
        publish_as_destination: status === 'approved' && publishAsDest,
        admin_notes: `Processed via Admin Portal on ${new Date().toISOString()}`,
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate submission.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleGuideVerification = async (guideId: number, currentStatus: boolean) => {
    setProcessingId(guideId);
    try {
      await api.admin.verifyGuide(guideId, !currentStatus);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update guide verification.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleHomestayVerification = async (homestayId: number, currentStatus: boolean) => {
    setProcessingId(homestayId);
    try {
      await api.admin.verifyHomestay(homestayId, !currentStatus);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update homestay verification.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Admin Header */}
      <section className="bg-charcoal text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-charcoal-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-700 text-xs font-semibold uppercase text-terracotta mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-terracotta" />
              Super Administrator Console
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">
              LOCALORA Governance & Moderation
            </h1>
            <p className="text-charcoal-300 text-xs sm:text-sm mt-1">
              Oversee destination catalog integrity, community hidden gems review, and partner credentials.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-forest text-white hover:bg-forest-600 text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-3xl p-5 border border-ivory-200 shadow-soft">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
              Official Destinations
            </span>
            <p className="font-serif text-3xl font-bold text-forest mt-2">
              {stats?.destinations_count || 30}
            </p>
            <span className="text-[10px] text-charcoal-400">Karnataka Master Catalog</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-ivory-200 shadow-soft">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
              Pending Hidden Gems
            </span>
            <p className="font-serif text-3xl font-bold text-terracotta mt-2">
              {pendingSubmissions.length}
            </p>
            <span className="text-[10px] text-charcoal-400">Requires editorial review</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-ivory-200 shadow-soft">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
              Registered Homestays
            </span>
            <p className="font-serif text-3xl font-bold text-charcoal mt-2">
              {homestays.length}
            </p>
            <span className="text-[10px] text-charcoal-400">Properties across districts</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-ivory-200 shadow-soft">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
              Licensed Guides
            </span>
            <p className="font-serif text-3xl font-bold text-charcoal mt-2">
              {guides.length}
            </p>
            <span className="text-[10px] text-charcoal-400">Certified local storytellers</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-ivory-200 shadow-soft mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-forest text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-ivory'
            }`}
          >
            <Gem className="w-4 h-4" /> Community Moderation Queue ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('homestays')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'homestays'
                ? 'bg-forest text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-ivory'
            }`}
          >
            <Home className="w-4 h-4" /> Homestay Verifications ({homestays.length})
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guides'
                ? 'bg-forest text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-ivory'
            }`}
          >
            <Users className="w-4 h-4" /> Guide Credentials ({guides.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-forest text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-ivory'
            }`}
          >
            <FileText className="w-4 h-4" /> Audit Log Trail
          </button>
        </div>

        {/* Tab 1: Community Moderation Queue */}
        {activeTab === 'community' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft">
            <div className="border-b border-ivory-200 pb-4 mb-6">
              <h2 className="font-serif text-2xl font-bold text-charcoal">
                Community Destination Suggestions
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Review submissions from locals and travellers. Approved gems are automatically published to the catalog.
              </p>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12 bg-ivory/30 rounded-2xl border border-ivory-200">
                <CheckCircle className="w-10 h-10 text-forest-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-charcoal">Moderation Queue is Clean</p>
                <p className="text-xs text-charcoal-400 mt-1">No community suggestions awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-6 rounded-2xl bg-ivory/30 border border-ivory-200 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-ivory-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-charcoal">
                            {sub.destination_name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              sub.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : sub.status === 'approved'
                                ? 'bg-forest-100 text-forest'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-500 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-terracotta" />
                          {sub.locality ? `${sub.locality}, ` : ''}{sub.district}, Karnataka
                        </p>
                      </div>

                      <div className="text-right text-xs text-charcoal-400">
                        <span>Submitted by: <strong>{sub.contributor_name}</strong></span>
                        <span className="block text-[10px]">{sub.contributor_email}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                      {sub.description}
                    </p>

                    {sub.best_time && (
                      <p className="text-xs text-charcoal-500">
                        <strong>Best season:</strong> {sub.best_time}
                      </p>
                    )}

                    {sub.image_url && (
                      <div className="mt-2">
                        <img
                          src={sub.image_url}
                          alt={sub.destination_name}
                          className="h-32 w-56 rounded-xl object-cover border border-ivory-300"
                        />
                        {sub.image_attribution && (
                          <span className="text-[10px] text-charcoal-400 block mt-1">
                            Attribution: {sub.image_attribution}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons if pending */}
                    {sub.status === 'pending' && (
                      <div className="pt-3 border-t border-ivory-200 flex items-center justify-end gap-3">
                        <button
                          disabled={processingId === sub.id}
                          onClick={() => handleModerateCommunity(sub.id, 'rejected')}
                          className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          disabled={processingId === sub.id}
                          onClick={() => handleModerateCommunity(sub.id, 'approved', true)}
                          className="px-5 py-2 rounded-xl bg-forest text-white hover:bg-forest-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve & Publish to Catalog
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Homestays Verification */}
        {activeTab === 'homestays' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">Homestay Properties</h2>
            <div className="space-y-3">
              {homestays.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-ivory/30 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-charcoal">{h.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-forest bg-forest-50 px-2 py-0.5 rounded-md">
                        {h.property_type}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-400 mt-0.5">{h.district}, Karnataka • Host: {h.owner_name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        h.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {h.verified ? 'Verified Active' : 'Unverified'}
                    </span>
                    <button
                      disabled={processingId === h.id}
                      onClick={() => handleToggleHomestayVerification(h.id, !!h.verified)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        h.verified
                          ? 'border border-red-300 text-red-600 hover:bg-red-50'
                          : 'bg-forest text-white hover:bg-forest-700'
                      }`}
                    >
                      {h.verified ? 'Revoke' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Guides Credentials */}
        {activeTab === 'guides' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">Local Guides Accreditation</h2>
            <div className="space-y-3">
              {guides.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-ivory/30 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-serif font-bold text-base text-charcoal">{g.full_name}</h4>
                    <p className="text-xs text-charcoal-400 mt-0.5">
                      {g.district}, Karnataka • Badge: {g.badge_label || 'Guide'} • License: {g.license_number || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        g.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {g.verified ? 'Certified' : 'Pending Review'}
                    </span>
                    <button
                      disabled={processingId === g.id}
                      onClick={() => handleToggleGuideVerification(g.id, !!g.verified)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        g.verified
                          ? 'border border-red-300 text-red-600 hover:bg-red-50'
                          : 'bg-forest text-white hover:bg-forest-700'
                      }`}
                    >
                      {g.verified ? 'Deactivate' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">Security & Action Audit Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ivory-200 text-charcoal-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-100 font-mono text-[11px]">
                  {auditLogs.slice(0, 15).map((log, i) => (
                    <tr key={i} className="hover:bg-ivory/50">
                      <td className="py-2.5 px-3 text-charcoal-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-forest font-semibold">{log.user_email || 'System'}</td>
                      <td className="py-2.5 px-3 font-semibold text-charcoal">{log.action}</td>
                      <td className="py-2.5 px-3 text-charcoal-500">{log.entity_type} #{log.entity_id}</td>
                      <td className="py-2.5 px-3 text-charcoal-400 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
