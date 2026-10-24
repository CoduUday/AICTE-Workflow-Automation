import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardAPI, applicationsAPI, complianceAPI, alertsAPI } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [deadlinesAlerts, setDeadlinesAlerts] = useState([]);
  const [urgentCompliance, setUrgentCompliance] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, appsRes, compRes, alertsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        applicationsAPI.getAll({ limit: 5, sortBy: 'submittedAt', sortOrder: 'desc' }),
        complianceAPI.getAll(),
        alertsAPI.getAll()
      ]);

      setMetrics(dashRes);
      setRecentApps(appsRes.applications || []);
      setDeadlinesAlerts(alertsRes);
      setUrgentCompliance(
        compRes.filter((c) => c.status === 'Overdue' || c.criticality === 'High').slice(0, 4)
      );
    } catch (err) {
      console.error('Failed to load dashboard telemetry', err);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAcknowledgeAlert = async (id) => {
    try {
      await alertsAPI.markAsRead(id);
      setDeadlinesAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
      showToast('Alert acknowledged', 'success');
    } catch {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await alertsAPI.markAllAsRead();
      setDeadlinesAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      showToast('All alerts acknowledged', 'success');
    } catch {
      showToast('Failed to acknowledge alerts', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading AICTE workflow telemetry & analytics..." />;
  }

  const kpis = metrics?.kpis || {};
  const unreadAlerts = deadlinesAlerts.filter((a) => !a.read);
  const criticalOverdue = deadlinesAlerts.find((a) => a.type === 'CRITICAL' && !a.read);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
              {user?.role ? user.role.replace(/_/g, ' ') : 'Central Bureau'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Academic Approval Cycle 2026-2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Authorized Official'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Stage-wise workflow automation, statutory compliance tracking, and bottleneck visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RotateCcw}
            onClick={loadDashboardData}
          >
            Refresh Data
          </Button>
          <Link to="/applications">
            <Button variant="primary" size="sm" rightIcon={ArrowRight}>
              Applications Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Overdue Notice (if any) */}
      {criticalOverdue && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-950">
                Action Required: {criticalOverdue.title}
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">{criticalOverdue.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAcknowledgeAlert(criticalOverdue.id)}
            >
              Acknowledge
            </Button>
            <Link to="/alerts">
              <Button variant="danger" size="sm">
                View All Alerts
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 4 Core KPI Cards required by Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-blue-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalApplications ?? 0}</h3>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Nationwide cycle active
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Scrutiny */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-amber-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Scrutiny</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{kpis.pendingScrutiny ?? 0}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Scrutiny & Re-Scrutiny</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Applications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-rose-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Applications</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{kpis.overdueApplications ?? 0}</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Passed target SLA date</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Compliance Obligations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Compliance</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{kpis.pendingCompliance ?? 0}</h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">Undertakings & NOCs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Stage Chart & Workflow Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage-wise Application Distribution */}
        <Card
          title="Stage-wise Application Distribution"
          subtitle="Real-time count of applications in each approval stage"
          action={
            <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              View All
            </Link>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.stageDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(metrics?.stageDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workflow Processing Velocity */}
        <Card
          title="Monthly Approval & Submission Trend"
          subtitle="Application intake vs approvals over the last 5 months"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="submitted" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" name="Submitted" />
                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorApp)" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Recent Applications and Deadlines & Alerts Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Applications Movement"
            subtitle="Real-time pipeline updates from AICTE regional approval bureaus"
            action={
              <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {recentApps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No applications found.</div>
              ) : (
                recentApps.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{app.applicationNumber}</span>
                        <Badge size="sm">{app.currentStage.replace(/_/g, ' ')}</Badge>
                        <span className="text-[11px] text-slate-400 font-medium">AY {app.academicYear}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-1">{app.institutionName}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {app.applicationType} • {app.region}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <Link to={`/applications/${app.id}`}>
                        <Button variant="outline" size="sm" rightIcon={ExternalLink}>
                          Inspect Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Deadlines and Alerts Widget (1 col) */}
        <div>
          <Card
            title="Deadlines & Alerts"
            subtitle={`${unreadAlerts.length} unread notifications pending`}
            action={
              unreadAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={handleAcknowledgeAll}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
                </button>
              )
            }
            bodyClassName="p-4 space-y-3"
          >
            {deadlinesAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No alerts found.</div>
            ) : (
              deadlinesAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition-all ${
                    alert.type === 'CRITICAL'
                      ? alert.read
                        ? 'border-rose-100 bg-rose-50/20'
                        : 'border-rose-200 bg-rose-50/70'
                      : alert.read
                      ? 'border-slate-100 bg-slate-50/30'
                      : 'border-amber-200 bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 truncate">{alert.title}</span>
                        {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{alert.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Due: {alert.dueAt ? new Date(alert.dueAt).toLocaleDateString() : 'N/A'}</span>
                        {!alert.read && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 text-center">
              <Link to="/alerts">
                <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600">
                  Open Alerts Management Center <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
