import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Send,
  UserCheck,
  MapPin,
  Maximize2,
  Download,
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import { applicationsAPI } from '../services/api';
import { WORKFLOW_STAGES } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isReviewer } = useAuth();
  const { showToast } = useToast();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stage transition modal
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationsAPI.getById(id);
      setApplication(data);
      // Default target stage to the next stage in line
      const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.id === data.currentStage);
      if (currentIdx !== -1 && currentIdx < WORKFLOW_STAGES.length - 1) {
        setTargetStage(WORKFLOW_STAGES[currentIdx + 1].id);
      } else {
        setTargetStage(WORKFLOW_STAGES[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not locate the requested application record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const handleStageTransition = async (e) => {
    e.preventDefault();
    if (!targetStage) return;

    try {
      setUpdating(true);
      const updated = await applicationsAPI.updateStatus(
        application.id,
        targetStage,
        user?.name || 'Review Committee',
        transitionNotes
      );
      setApplication(updated);
      showToast('Workflow stage updated successfully!', 'success');
      setIsTransitionModalOpen(false);
      setTransitionNotes('');
    } catch (err) {
      showToast('Failed to update stage: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading application lifecycle details..." />;
  }

  if (error || !application) {
    return (
      <div className="py-12">
        <ErrorState
          title="Application Not Found"
          message={error || 'The requested application could not be retrieved.'}
          onRetry={fetchApplicationDetails}
        />
        <div className="text-center mt-4">
          <Link to="/applications">
            <Button variant="outline" size="sm" leftIcon={ArrowLeft}>
              Back to Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStageObj = WORKFLOW_STAGES.find((s) => s.id === application.currentStage);
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === application.currentStage);

  // Check if current user has permission to transition status
  const canTransition = isAdmin || isReviewer;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications List
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="font-mono text-base font-bold text-slate-900">
              {application.applicationNumber}
            </span>
            <Badge size="md">{currentStageObj?.name || application.currentStage}</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-600">{application.applicationType}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{application.institutionName}</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {application.region} • Assigned to:{' '}
            <span className="font-medium text-slate-700">{application.assignedTo}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canTransition ? (
            <Button
              variant="primary"
              leftIcon={Send}
              onClick={() => setIsTransitionModalOpen(true)}
            >
              Update Workflow Stage
            </Button>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
              Read-Only (Institution Access)
            </span>
          )}
        </div>
      </div>

      {/* Visual Workflow Stepper */}
      <Card
        title="AICTE Workflow Lifecycle Stepper"
        subtitle="End-to-end progression across regulatory verification checkpoints"
      >
        <div className="relative py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center min-w-[650px] justify-between">
              {WORKFLOW_STAGES.filter((s) => s.id !== 'REJECTED').map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                let circleClass = 'bg-slate-100 text-slate-400 border-slate-200';
                let textClass = 'text-slate-400 font-normal';

                if (isCurrent) {
                  circleClass = 'bg-blue-600 text-white ring-4 ring-blue-100 border-blue-600 font-bold';
                  textClass = 'text-blue-900 font-bold';
                } else if (isPassed) {
                  circleClass = 'bg-emerald-600 text-white border-emerald-600';
                  textClass = 'text-emerald-900 font-medium';
                }

                return (
                  <div key={stage.id} className="flex-1 flex flex-col items-center text-center relative px-1">
                    {/* Line connector */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-4 -left-1/2 right-1/2 h-0.5 -z-0 ${
                          idx <= currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all ${circleClass}`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] mt-2 line-clamp-2 max-w-[100px] leading-tight ${textClass}`}>
                      {stage.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Details + Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Documents (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institutional Parameters */}
          <Card title="Application Parameters & Infrastructure Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Intake Capacity</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {application.intakeCapacityRequested} Seats
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Built-up Area</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {application.infrastructureAreaSqM?.toLocaleString()} Sq.M
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Land Tenure</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {application.landTenureType}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Submission Date</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {new Date(application.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Target SLA Deadline</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {new Date(application.targetResolutionDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Deficiencies Logged</span>
                <span className="text-sm font-bold text-amber-600 mt-0.5 block">
                  {application.deficiencyCount || 0} Items
                </span>
              </div>
            </div>
          </Card>

          {/* Attached Supporting Documents */}
          <Card
            title="Attached Compliance & Verification Documents"
            subtitle="Verified uploads submitted according to Approval Process Handbook"
            action={
              <Button variant="outline" size="sm" leftIcon={UploadCloud}>
                Upload Addendum
              </Button>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-slate-100">
              {(application.documents || []).map((doc, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {doc.size} • Uploaded {doc.uploadDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge size="sm" variant={doc.status === 'Verified' ? 'success' : doc.status === 'Deficient' ? 'danger' : 'warning'}>
                      {doc.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => showToast(`Downloading ${doc.name}...`, 'info')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Stage Audit Trail (1 col) */}
        <div className="space-y-6">
          <Card title="Stage Movement Audit Log" subtitle="Traceable chronological history">
            <div className="space-y-4 relative pl-4 border-l-2 border-blue-200">
              {(application.stageHistory || []).map((history, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="text-xs font-semibold text-slate-900">{history.action}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{new Date(history.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">{history.actor}</span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                    {history.notes}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Stage Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Advance Workflow Stage"
        subtitle={`Application: ${application.applicationNumber}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStageTransition}
              isLoading={updating}
            >
              Confirm Stage Movement
            </Button>
          </>
        }
      >
        <form onSubmit={handleStageTransition} className="space-y-4">
          <Select
            label="Next Permitted Stage"
            required
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            options={WORKFLOW_STAGES.map((s) => ({ value: s.id, label: s.name }))}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reviewer Observations / Minutes of Decision <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
              placeholder="Record specific grounds, scrutiny remarks, or committee findings..."
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
