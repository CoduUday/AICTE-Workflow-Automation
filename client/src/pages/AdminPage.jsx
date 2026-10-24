import { useState } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Users,
  Clock,
  RotateCcw,
  CheckCircle,
  Save,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WORKFLOW_STAGES } from '../services/mockData';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [stages, setStages] = useState(
    WORKFLOW_STAGES.map((s) => ({
      ...s,
      slaDays: s.id === 'SCRUTINY' ? 14 : s.id === 'RE_SCRUTINY' ? 7 : s.id === 'EVC_SCHEDULED' ? 10 : 21,
      mandatoryRole: s.id === 'SCRUTINY' || s.id === 'RE_SCRUTINY' ? 'Scrutiny Officer' : 'HQ Admin Director'
    }))
  );

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const handleSaveSLA = (e) => {
    e.preventDefault();
    showToast('Workflow SLA configuration saved successfully!', 'success');
  };

  const handleResetDemoData = () => {
    localStorage.removeItem('aicte_applications');
    localStorage.removeItem('aicte_compliance');
    localStorage.removeItem('aicte_alerts');
    localStorage.removeItem('aicte_evc');
    showToast('Demo dataset restored to initial seed. Refresh to see defaults.', 'info');
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Admin Access</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You are currently signed in as a non-admin role. Please switch to "Administrator" using the header pill to access workflow configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workflow Configuration & Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage stage SLAs, role permissions, notification dispatch rules, and system seed data.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={RotateCcw}
          onClick={handleResetDemoData}
        >
          Reset Demo Data
        </Button>
      </div>

      {/* Stage SLA Configurator */}
      <Card
        title="Approval Process Workflow Stages & SLAs"
        subtitle="Configure turnaround timers (SLAs) enforced across AICTE stages"
        action={
          <Button variant="primary" size="sm" leftIcon={Save} onClick={handleSaveSLA}>
            Save SLA Rules
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-slate-600">Stage Name</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Stage Key</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Max Permitted SLA</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Authorized Role</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stages.map((stage, idx) => (
                <tr key={stage.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{stage.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{stage.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
                        value={stage.slaDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setStages((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, slaDays: val } : s))
                          );
                        }}
                      />
                      <span className="text-slate-400">days</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{stage.mandatoryRole}</td>
                  <td className="py-3 px-4">
                    <Badge size="sm" variant="success">
                      Active
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notification and Channel Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Automated Alert Dispatch Settings" subtitle="Configure proactive notifications">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div>
                <span className="font-semibold text-slate-900 block">Email Reminders</span>
                <span className="text-slate-500 text-[11px]">
                  Send email notifications 7 days and 48 hours before compliance deadlines.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div>
                <span className="font-semibold text-slate-900 block">SMS Urgent Alerts</span>
                <span className="text-slate-500 text-[11px]">
                  Dispatch high-priority SMS alerts to Institution Authorized Signatories.
                </span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        <Card title="Regional Office Review Quotas" subtitle="Regional Scrutiny Panel Capacity">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-700">North-West (NWRO) - Chandigarh</span>
              <span className="font-semibold text-slate-900">18 Applications Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-700">Western (WRO) - Mumbai</span>
              <span className="font-semibold text-slate-900">24 Applications Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-700">South-Western (SWRO) - Bangalore</span>
              <span className="font-semibold text-slate-900">31 Applications Active</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-slate-700">Eastern (ERO) - Kolkata</span>
              <span className="font-semibold text-slate-900">15 Applications Active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
