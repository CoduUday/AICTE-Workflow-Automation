import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Plus,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  FileCheck,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldAlert,
  AlertOctagon,
  CalendarDays,
  List,
  Edit,
  Eye,
  FileText
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
import ErrorState from '../components/common/ErrorState';

export default function EVCPage() {
  const { user, canReview, isAdmin, isEVCCoordinator } = useAuth();
  const { showToast } = useToast();

  const [evcList, setEvcList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View toggle: Agenda vs Cards
  const [viewMode, setViewMode] = useState('agenda'); // 'agenda' | 'cards'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Schedule New Visit Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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
  const [formErrors, setFormErrors] = useState({});

  // Conflict Confirmation Dialog
  const [conflictDialog, setConflictDialog] = useState({
    isOpen: false,
    message: '',
    onProceed: () => {}
  });

  // Reschedule Modal
  const [selectedForReschedule, setSelectedForReschedule] = useState(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', reason: '' });
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Complete / Inspection Findings Modal
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeData, setCompleteData] = useState({ reportSummary: '', outcome: 'Satisfactory' });
  const [isCompleting, setIsCompleting] = useState(false);

  // Dossier Modal
  const [selectedForDossier, setSelectedForDossier] = useState(null);

  const fetchEVC = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await evcAPI.getAll();
      setEvcList(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load Expert Visit Committee schedule.');
      showToast('Error loading EVC schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEVC();
  }, []);

  // Form Validation
  const validateScheduleForm = () => {
    const errs = {};
    if (!formData.institutionName.trim()) {
      errs.institutionName = 'Target institution name is required';
    }
    if (!formData.visitDate) {
      errs.visitDate = 'Visit date and time are required';
    } else if (new Date(formData.visitDate) < new Date()) {
      errs.visitDate = 'Scheduled inspection date cannot be in the past';
    }
    if (!formData.committeeLead.trim()) {
      errs.committeeLead = 'Committee Chairperson must be appointed';
    }
    if (!formData.venueAddress.trim()) {
      errs.venueAddress = 'Campus venue address is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Check for potential conflicts before scheduling
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) {
      showToast('Please fix schedule form errors before proceeding', 'warning');
      return;
    }

    // Check conflict: does this expert or institution already have a visit on the same day?
    const targetDay = new Date(formData.visitDate).toISOString().split('T')[0];
    const conflict = evcList.find((existing) => {
      const existingDay = new Date(existing.visitDate).toISOString().split('T')[0];
      if (existingDay !== targetDay) return false;
      return (
        existing.committeeLead?.toLowerCase() === formData.committeeLead?.toLowerCase() ||
        existing.institutionName?.toLowerCase() === formData.institutionName?.toLowerCase()
      );
    });

    if (conflict) {
      setConflictDialog({
        isOpen: true,
        message: `Conflict Warning: An on-site visit is already scheduled on ${targetDay} involving "${conflict.committeeLead}" at "${conflict.institutionName}". Assigning concurrent visits may result in logistical failure. Do you wish to proceed and record this overlap?`,
        onProceed: executeSchedule
      });
      return;
    }

    executeSchedule();
  };

  const executeSchedule = async () => {
    setConflictDialog((prev) => ({ ...prev, isOpen: false }));
    try {
      setIsSubmitting(true);
      await evcAPI.scheduleVisit(formData);
      showToast('EVC Inspection visit scheduled successfully!', 'success');
      setIsScheduleModalOpen(false);
      fetchEVC();
    } catch {
      showToast('Failed to schedule visit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleData.newDate) {
      showToast('Please provide a new inspection date and time', 'warning');
      return;
    }
    if (new Date(rescheduleData.newDate) < new Date()) {
      showToast('New date cannot be in the past', 'warning');
      return;
    }

    try {
      setIsRescheduling(true);
      await evcAPI.rescheduleVisit(selectedForReschedule.id, {
        newVisitDate: rescheduleData.newDate,
        reason: rescheduleData.reason || 'Logistical coordination & committee travel rescheduling',
        rescheduledBy: user?.name || 'EVC Cell Coordinator'
      });
      showToast('EVC Visit rescheduled successfully!', 'success');
      setIsRescheduleModalOpen(false);
      setSelectedForReschedule(null);
      fetchEVC();
    } catch {
      showToast('Failed to reschedule visit', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Execute Complete Inspection
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeData.reportSummary.trim()) {
      showToast('Inspection report summary is required', 'warning');
      return;
    }

    try {
      setIsCompleting(true);
      await evcAPI.completeInspection(selectedForComplete.id, {
        reportSummary: completeData.reportSummary,
        outcome: completeData.outcome,
        completedBy: user?.name || 'Committee Lead'
      });
      showToast('EVC findings recorded and inspection marked Completed!', 'success');
      setIsCompleteModalOpen(false);
      setSelectedForComplete(null);
      fetchEVC();
    } catch {
      showToast('Failed to complete inspection', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Filtered EVC items
  const filteredList = evcList.filter((item) => {
    if (statusFilter !== 'ALL' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.institutionName.toLowerCase().includes(q) ||
        item.committeeLead.toLowerCase().includes(q) ||
        item.applicationId.toLowerCase().includes(q) ||
        item.venueAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading EVC agendas & inspection schedules..." />;
  }

  const conflictsCount = evcList.filter((e) => e.conflictWarning).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Expert Visit Committee (EVC) Scheduling
            </h1>
            {conflictsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {conflictsCount} Conflict Warning
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordination of on-site academic inspections, committee panel appointments, conflict detection, and findings.
          </p>
        </div>

        {(canReview || isEVCCoordinator || isAdmin) && (
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsScheduleModalOpen(true)}
          >
            Schedule Committee Visit
          </Button>
        )}
      </div>

      {/* Filter and View Switcher Bar */}
      <Card bodyClassName="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by college, committee expert, application, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle: Agenda / Cards */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Agenda Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Roster Cards
              </button>
            </div>

            <Button variant="outline" leftIcon={RotateCcw} onClick={() => { setSearch(''); setStatusFilter('ALL'); }}>
              Reset
            </Button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { id: 'ALL', label: 'All Inspections' },
            { id: 'Scheduled', label: 'Scheduled' },
            { id: 'Proposed', label: 'Proposed' },
            { id: 'Rescheduled', label: 'Rescheduled' },
            { id: 'Completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Content Area */}
      {error ? (
        <ErrorState title="EVC Board Error" message={error} onRetry={fetchEVC} />
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <CalendarCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-800 text-sm">No inspections found</h4>
          <p className="text-xs text-slate-500 mt-1">There are no physical committee inspections matching this filter criteria.</p>
        </div>
      ) : viewMode === 'agenda' ? (
        /* AGENDA TIMELINE VIEW */
        <div className="space-y-4">
          {filteredList.map((item, idx) => {
            const visit = new Date(item.visitDate);
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs hover:border-blue-300 ${
                  item.conflictWarning ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
                }`}
              >
                {/* Conflict Notice if present */}
                {item.conflictWarning && (
                  <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-medium animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{item.conflictWarning}</span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Date & Details */}
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">
                        {visit.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-extrabold text-[#0A2540] leading-none">
                        {visit.getDate()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                        {visit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Inspection Metadata */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900">{item.id}</span>
                        <Badge size="sm" variant={isCompleted ? 'success' : item.status === 'Scheduled' ? 'purple' : 'warning'}>
                          {item.status}
                        </Badge>
                        <Link
                          to={`/applications/${item.applicationId}`}
                          className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {item.applicationId} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <h3 className="font-bold text-base text-slate-900">{item.institutionName}</h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.venueAddress}</span>
                      </div>

                      {/* Committee Lead */}
                      <div className="mt-2 text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Lead: <strong className="text-slate-900">{item.committeeLead}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Eye}
                      onClick={() => setSelectedForDossier(item)}
                    >
                      Dossier
                    </Button>

                    {!isCompleted && canReview && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={Clock}
                          onClick={() => {
                            setSelectedForReschedule(item);
                            setRescheduleData({
                              newDate: item.visitDate.slice(0, 16),
                              reason: ''
                            });
                            setIsRescheduleModalOpen(true);
                          }}
                        >
                          Reschedule
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={FileCheck}
                          onClick={() => {
                            setSelectedForComplete(item);
                            setCompleteData({
                              reportSummary: 'All laboratories, CAD facilities, and fire clearances inspected.',
                              outcome: 'Satisfactory'
                            });
                            setIsCompleteModalOpen(true);
                          }}
                        >
                          Complete Inspection
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CARDS / ROSTER VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow ${
                item.conflictWarning ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
              }`}
            >
              <div>
                {item.conflictWarning && (
                  <div className="mb-3 p-2 rounded bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-[11px] text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="line-clamp-1">{item.conflictWarning}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.id}
                  </span>
                  <Badge size="sm" variant={item.status === 'Completed' ? 'success' : 'purple'}>
                    {item.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.institutionName}</h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700">
                    {new Date(item.visitDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.venueAddress}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Committee Roster
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
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedForDossier(item)}
                >
                  View Dossier
                </Button>

                {item.status !== 'Completed' && canReview && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedForComplete(item);
                      setCompleteData({
                        reportSummary: 'All laboratories inspected.',
                        outcome: 'Satisfactory'
                      });
                      setIsCompleteModalOpen(true);
                    }}
                  >
                    Finish
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Schedule Committee Visit */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Expert Visit Committee (EVC)"
        subtitle="Appoint external academic & architectural experts for physical verification"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
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
            error={formErrors.institutionName}
            onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Related Application ID"
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            />

            <Input
              label="Visit Date & Time"
              type="datetime-local"
              required
              value={formData.visitDate}
              error={formErrors.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
            />
          </div>

          <Input
            label="Committee Chairperson (Senior Academician)"
            required
            placeholder="e.g. Prof. R. C. Mathur (IIT Roorkee)"
            value={formData.committeeLead}
            error={formErrors.committeeLead}
            onChange={(e) => setFormData({ ...formData, committeeLead: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Committee Members (Comma-separated)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Dr. Meenakshi Iyer (Architectural Expert), Prof. Arvind Srivastav (Subject Expert)"
              value={formData.committeeMembersText}
              onChange={(e) => setFormData({ ...formData, committeeMembersText: e.target.value })}
            />
          </div>

          <Input
            label="Campus Address / Inspection Venue"
            required
            value={formData.venueAddress}
            error={formErrors.venueAddress}
            onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mandatory Verification Scope
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              value={formData.inspectionScope}
              onChange={(e) => setFormData({ ...formData, inspectionScope: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Reschedule Visit Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Committee Visit"
        subtitle={`Visit: ${selectedForReschedule?.id} - ${selectedForReschedule?.institutionName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRescheduleSubmit}
              isLoading={isRescheduling}
            >
              Confirm Rescheduling
            </Button>
          </>
        }
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <Input
            label="Revised Inspection Date & Time"
            type="datetime-local"
            required
            value={rescheduleData.newDate}
            onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reschedule Justification & Notification Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="State logistical reasons, flight delays, committee availability, or administrative grounds..."
              value={rescheduleData.reason}
              onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: Complete Inspection Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Submit Inspection Findings & Complete EVC"
        subtitle={`Inspection Dossier: ${selectedForComplete?.id}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteSubmit}
              isLoading={isCompleting}
            >
              Submit Report & Complete
            </Button>
          </>
        }
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <Select
            label="Committee Recommendation / Outcome"
            value={completeData.outcome}
            onChange={(e) => setCompleteData({ ...completeData, outcome: e.target.value })}
            options={['Satisfactory - Full compliance documented', 'Deficiencies Noted - Re-scrutiny required', 'Adverse Recommendation']}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Executive Inspection Findings Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Record explicit verification of laboratories, student seating, barrier-free access, and fire safety..."
              value={completeData.reportSummary}
              onChange={(e) => setCompleteData({ ...completeData, reportSummary: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 4: Dossier Overview Modal */}
      {selectedForDossier && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForDossier(null)}
          title={`Inspection Dossier - ${selectedForDossier.id}`}
          subtitle={selectedForDossier.institutionName}
          footer={
            <Button variant="outline" onClick={() => setSelectedForDossier(null)}>
              Close Dossier
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedForDossier.visitDate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge size="sm">{selectedForDossier.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application Number:</span>
                <span className="font-mono text-blue-600">{selectedForDossier.applicationId}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Campus Address
              </span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedForDossier.venueAddress}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Appointed Committee Members
              </span>
              <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {(selectedForDossier.committeeMembers || []).map((m, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Inspection Scope
              </span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedForDossier.inspectionScope}
              </p>
            </div>

            {selectedForDossier.reportSubmitted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-950 block mb-1">Inspection Findings:</span>
                <p className="text-emerald-900">{selectedForDossier.reportSummary || selectedForDossier.outcome}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal 5: Conflict Confirmation Warning Dialog */}
      <Modal
        isOpen={conflictDialog.isOpen}
        onClose={() => setConflictDialog((prev) => ({ ...prev, isOpen: false }))}
        title="Schedule Conflict Detected"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConflictDialog((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel & Modify
            </Button>
            <Button variant="danger" onClick={conflictDialog.onProceed}>
              Proceed Despite Warning
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed">{conflictDialog.message}</p>
        </div>
      </Modal>
    </div>
  );
}
