import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink
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
import { dashboardAPI, applicationsAPI, complianceAPI, alertsAPI } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [urgentAlerts, setUrgentAlerts] = useState([]);
  const [urgentCompliance, setUrgentCompliance] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [dashRes, appsRes, compRes, alertsRes] = await Promise.all([
          dashboardAPI.getSummary(),
          applicationsAPI.getAll(),
          complianceAPI.getAll(),
          alertsAPI.getAll()
        ]);

        setMetrics(dashRes);
        setRecentApps(appsRes.applications.slice(0, 5));
        setUrgentAlerts(alertsRes.filter((a) => a.type === 'CRITICAL' && !a.read));
        setUrgentCompliance(compRes.filter((c) => c.status === 'Overdue' || c.criticality === 'High').slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading AICTE workflow telemetry..." />;
  }

  const kpis = metrics?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {user?.role === 'ADMIN' ? 'HQ Central Administration' : user?.role === 'REVIEWER' ? 'Regional Scrutiny Panel' : 'Institution Dashboard'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Approval Cycle 2026-2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Authorized Official'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time pipeline monitoring, automated compliance tracking, and stage-wise bottleneck visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/applications">
            <Button variant="outline" size="sm" rightIcon={ArrowRight}>
              View Applications
            </Button>
          </Link>
          <Link to="/compliance">
            <Button variant="primary" size="sm" rightIcon={ShieldCheck}>
              Compliance Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Overdue Alert Notice (if any) */}
      {urgentAlerts.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-950">
                Action Required: {urgentAlerts.length} Critical Compliance Deadlines Overdue
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                {urgentAlerts[0]?.message}
              </p>
            </div>
          </div>
          <Link to="/alerts" className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline shrink-0">
            View All Alerts
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalApplications}</h3>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14% vs last cycle
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Scrutiny</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{kpis.pendingScrutiny}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Under official review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">EVC Visits Active</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{kpis.activeEVCs}</h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">On-site inspections</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Compliance</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{kpis.overdueCompliance}</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Requires immediate notice</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics / Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage-wise Application Distribution */}
        <Card
          title="Stage-wise Application Distribution"
          subtitle="Real-time count of applications across approval pipeline"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.stageDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
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

        {/* 5-Month Approval & Compliance Velocity */}
        <Card
          title="Workflow Processing Velocity"
          subtitle="Monthly volume of submitted vs finalized applications"
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

      {/* Two Column Bottom Widgets: Recent Applications & Urgent Compliance Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Applications Movement"
            subtitle="Live status updates from AICTE regional approval bureaus"
            action={
              <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {recentApps.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">{app.applicationNumber}</span>
                      <Badge size="sm">{app.currentStage.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="text-xs font-medium text-slate-800 truncate mt-0.5">{app.institutionName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{app.applicationType} • {app.region}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <Link to={`/applications/${app.id}`}>
                      <Button variant="outline" size="sm" rightIcon={ExternalLink}>
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Priority Compliance Obligations (1 col) */}
        <div>
          <Card
            title="Compliance Deadlines"
            subtitle="Time-sensitive undertakings & renewals"
            action={
              <Link to="/compliance" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Register
              </Link>
            }
            bodyClassName="p-4 space-y-3"
          >
            {urgentCompliance.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 truncate">{item.requirementType}</span>
                  <Badge size="sm" variant={item.status === 'Overdue' ? 'danger' : 'warning'}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{item.institutionName}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                  <span className="font-medium text-slate-600 capitalize">{item.criticality} Priority</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
