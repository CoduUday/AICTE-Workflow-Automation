import { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { evcAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function EVCPage() {
  const { user, isAdmin, isReviewer } = useAuth();
  const { showToast } = useToast();

  const [evcList, setEvcList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    visitDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T10:00',
    committeeLead: 'Prof. R. C. Mathur (IIT Roorkee)',
    committeeMembersText: 'Dr. Meenakshi Iyer (Architectural Expert), Prof. Arvind Srivastav (Subject Expert)',
    inspectionScope: 'Physical AI Lab setup, Classroom acoustic standards, Fire safety infrastructure',
    venueAddress: 'Sector 62, Institutional Area, Knowledge Park, New Delhi'
  });

  const fetchEVC = async () => {
    try {
      setLoading(true);
      const data = await evcAPI.getAll();
      setEvcList(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading EVC schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEVC();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.institutionName || !formData.committeeLead) {
      showToast('Please provide all mandatory committee details', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const members = [
        formData.committeeLead + ' (Chairperson)',
        ...formData.committeeMembersText.split(',').map((m) => m.trim()).filter(Boolean)
      ];

      await evcAPI.scheduleVisit({
        ...formData,
        committeeMembers: members
      });

      showToast('EVC inspection visit scheduled successfully!', 'success');
      setIsModalOpen(false);
      fetchEVC();
    } catch {
      showToast('Failed to schedule EVC visit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading EVC inspections board..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Expert Visit Committee (EVC) Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordination of on-site physical infrastructure verifications, committee composition, and inspection findings.
          </p>
        </div>

        {(isAdmin || isReviewer) && (
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Schedule Committee Visit
          </Button>
        )}
      </div>

      {/* Grid of Scheduled Inspections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evcList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {item.id}
                </span>
                <Badge size="sm" variant={item.status === 'Completed' ? 'success' : item.status === 'Scheduled' ? 'purple' : 'warning'}>
                  {item.status}
                </Badge>
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {item.institutionName}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-700">
                  {new Date(item.visitDate).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.venueAddress}</span>
              </div>

              {/* Committee Members Pill List */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Inspection Committee
                </div>
                <ul className="space-y-1">
                  {(item.committeeMembers || []).map((member, idx) => (
                    <li key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="truncate">{member}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scope */}
              <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700 block mb-0.5">Verification Scope:</span>
                {item.inspectionScope}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Report:{' '}
                <span className={item.reportSubmitted ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {item.reportSubmitted ? 'Submitted & Cleared' : 'Pending Inspection'}
                </span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast(`Inspection details for ${item.id} logged.`, 'info')}
              >
                View Dossier
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule EVC Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Expert Visit Committee (EVC)"
        subtitle="Appoint external academic & architectural experts for physical verification"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleScheduleSubmit}
              isLoading={isSubmitting}
            >
              Confirm Visit Schedule
            </Button>
          </>
        }
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Target Institution"
            required
            value={formData.institutionName}
            onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
          />

          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            required
            value={formData.visitDate}
            onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
          />

          <Input
            label="Committee Chairperson (Senior Academician)"
            required
            placeholder="e.g. Prof. R. C. Mathur (IIT Roorkee)"
            value={formData.committeeLead}
            onChange={(e) => setFormData({ ...formData, committeeLead: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Committee Members (Comma-separated)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Dr. Meenakshi Iyer (Architectural Expert), Prof. Arvind Srivastav (Subject Expert)"
              value={formData.committeeMembersText}
              onChange={(e) => setFormData({ ...formData, committeeMembersText: e.target.value })}
            />
          </div>

          <Input
            label="Campus Address"
            required
            value={formData.venueAddress}
            onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mandatory Verification Scope
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.inspectionScope}
              onChange={(e) => setFormData({ ...formData, inspectionScope: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
