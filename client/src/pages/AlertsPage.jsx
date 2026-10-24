import { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  CheckCheck,
  Filter
} from 'lucide-react';
import { alertsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AlertsPage() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CRITICAL'

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsAPI.getAll();
      setAlerts(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await alertsAPI.markAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
      showToast('Alert marked as read', 'success');
    } catch {
      showToast('Failed to update alert', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertsAPI.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      showToast('All alerts marked as read', 'success');
    } catch {
      showToast('Failed to update alerts', 'error');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNREAD') return !a.read;
    if (filter === 'CRITICAL') return a.type === 'CRITICAL';
    return true;
  });

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading deadline telemetry & alerts..." />;
  }

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Alerts & Deadline Management
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated alerts triggered by statutory deadlines, EVC visit proximities, and overdue compliance undertakings.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={CheckCheck}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'ALL'
              ? 'bg-[#0A2540] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'UNREAD'
              ? 'bg-[#0A2540] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'CRITICAL'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Critical Overdue
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">No alerts matching this criteria</h4>
            <p className="text-xs text-slate-500 mt-1">All compliance deadlines and review notifications are up to date.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.type === 'CRITICAL';
            const isWarning = alert.type === 'WARNING';

            let borderClass = 'border-slate-200 bg-white';
            let icon = <Clock className="w-5 h-5 text-blue-500 shrink-0" />;

            if (isCritical) {
              borderClass = alert.read ? 'border-rose-200 bg-rose-50/20' : 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-300';
              icon = <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else if (isWarning) {
              borderClass = alert.read ? 'border-amber-200 bg-amber-50/20' : 'border-amber-300 bg-amber-50/60';
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
                      <span className="font-semibold text-sm text-slate-900">{alert.title}</span>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                      )}
                      <Badge size="sm" variant={isCritical ? 'danger' : isWarning ? 'warning' : 'info'}>
                        {alert.type}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="font-medium text-slate-600">{alert.institutionName}</span>
                      <span>•</span>
                      <span>Triggered: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.dueAt && (
                        <>
                          <span>•</span>
                          <span className={isCritical ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            Deadline: {new Date(alert.dueAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!alert.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
