import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  CheckCheck,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  Info,
  RotateCcw
} from 'lucide-react';
import { alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function AlertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters per prompt: unread/overdue/compliance/all
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'OVERDUE' | 'COMPLIANCE'
  const [search, setSearch] = useState('');

  // Confirmation modal for Acknowledge All
  const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertsAPI.getAll({ filter: activeFilter });
      setAlerts(data);
    } catch (err) {
      console.error(err);
      setError('Unable to retrieve notifications feed.');
      showToast('Error loading alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeFilter]);

  const handleAcknowledge = async (id) => {
    try {
      await alertsAPI.acknowledge(id, user?.name || 'Authorized Officer');
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                read: true,
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: user?.name || 'Authorized Officer'
              }
            : a
        )
      );
      showToast('Notification acknowledged and recorded.', 'success');
    } catch {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      setIsProcessingAll(true);
      await alertsAPI.markAllAsRead(user?.name || 'Authorized Officer');
      const now = new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) => ({
          ...a,
          read: true,
          acknowledged: true,
          acknowledgedAt: now,
          acknowledgedBy: user?.name || 'Authorized Officer'
        }))
      );
      setIsConfirmAllModalOpen(false);
      showToast('All pending alerts marked as acknowledged.', 'success');
    } catch {
      showToast('Failed to acknowledge alerts', 'error');
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Client-side text filter
  const filteredAlerts = alerts.filter((alert) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      alert.title.toLowerCase().includes(q) ||
      alert.message.toLowerCase().includes(q) ||
      alert.institutionName.toLowerCase().includes(q) ||
      (alert.applicationId && alert.applicationId.toLowerCase().includes(q))
    );
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged && !a.read).length;

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading deadline telemetry & notification queues..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts & Deadline Management</h1>
            {unacknowledgedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {unacknowledgedCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated notifications triggered by statutory deadlines, EVC visit proximities, and compliance undertakings.
          </p>
        </div>

        {unacknowledgedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={CheckCheck}
            onClick={() => setIsConfirmAllModalOpen(true)}
          >
            Acknowledge All ({unacknowledgedCount})
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search notifications by keyword, college, or application number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>
          <Button variant="outline" leftIcon={RotateCcw} onClick={() => { setSearch(''); setActiveFilter('ALL'); }}>
            Reset
          </Button>
        </div>

        {/* Tab Filters per Prompt: unread, overdue, compliance */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Filter View:
          </span>
          {[
            { id: 'ALL', label: 'All Notifications' },
            { id: 'UNREAD', label: 'Unread / Unacknowledged' },
            { id: 'OVERDUE', label: 'Overdue Deadlines' },
            { id: 'COMPLIANCE', label: 'Compliance Alerts' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Alerts Feed */}
      {error ? (
        <ErrorState title="Telemetry Error" message={error} onRetry={fetchAlerts} />
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-800 text-sm">No notifications found</h4>
          <p className="text-xs text-slate-500 mt-1">All compliance deadlines, scrutiny alerts, and inspection agendas are acknowledged.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.type === 'CRITICAL';
            const isWarning = alert.type === 'WARNING';
            const isOverdue = alert.dueAt && new Date(alert.dueAt) < new Date();

            let borderClass = 'border-slate-200 bg-white';
            let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

            if (isCritical) {
              borderClass = alert.acknowledged
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-300';
              icon = <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else if (isWarning) {
              borderClass = alert.acknowledged
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-amber-300 bg-amber-50/60';
              icon = <Clock className="w-5 h-5 text-amber-600 shrink-0" />;
            }

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderClass}`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5">{icon}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{alert.title}</span>
                      {!alert.acknowledged && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unacknowledged" />
                      )}
                      <Badge size="sm" variant={isCritical ? 'danger' : isWarning ? 'warning' : 'info'}>
                        {alert.type}
                      </Badge>
                      {alert.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {alert.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{alert.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="font-semibold text-slate-700">{alert.institutionName}</span>
                      <span>•</span>
                      {alert.applicationId && (
                        <>
                          <Link
                            to={`/applications/${alert.applicationId}`}
                            className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            {alert.applicationId} <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span>•</span>
                        </>
                      )}
                      <span>Triggered: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.dueAt && (
                        <>
                          <span>•</span>
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            Deadline: {new Date(alert.dueAt).toLocaleDateString()}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </>
                      )}
                    </div>

                    {alert.acknowledged && alert.acknowledgedAt && (
                      <div className="text-[10px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Acknowledged on {new Date(alert.acknowledgedAt).toLocaleString()} by {alert.acknowledgedBy}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!alert.acknowledged ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1 rounded bg-slate-100">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog: Acknowledge All */}
      <Modal
        isOpen={isConfirmAllModalOpen}
        onClose={() => setIsConfirmAllModalOpen(false)}
        title="Acknowledge All Unread Notifications"
        subtitle="Batch acknowledgement protocol"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsConfirmAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAcknowledgeAll}
              isLoading={isProcessingAll}
            >
              Confirm Acknowledge All
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to mark all {unacknowledgedCount} pending notifications as acknowledged?
          This records your authorization and clears active unread counters across the dashboard.
        </p>
      </Modal>
    </div>
  );
}
