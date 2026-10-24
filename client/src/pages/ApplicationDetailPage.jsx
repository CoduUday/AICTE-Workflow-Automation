import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Send,
  MapPin,
  Maximize2,
  Download,
  UploadCloud,
  ChevronRight,
  Eye,
  MessageSquare,
  History,
  ShieldAlert
} from 'lucide-react';
import { applicationsAPI } from '../services/api';
import {
  WORKFLOW_STAGES,
  PERMITTED_TRANSITIONS,
  STAGE_ROLE_PERMISSIONS
} from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { user, canReview, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stage transition modal
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Document upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docFormData, setDocFormData] = useState({
    name: '',
    documentType: 'Statutory Annexure',
    notes: ''
  });

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationsAPI.getById(id);
      setApplication(data);

      // Default target stage to the first permitted transition
      const allowed = PERMITTED_TRANSITIONS[data.currentStage] || [];
      if (allowed.length > 0) {
        setTargetStage(allowed[0]);
      } else {
        setTargetStage('');
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
    if (!targetStage) {
      showToast('Please select a valid destination workflow stage', 'warning');
      return;
    }
    if (!transitionNotes.trim()) {
      showToast('Official remarks/decision minutes are mandatory', 'warning');
      return;
    }

    try {
      setUpdating(true);
      const updated = await applicationsAPI.updateStage(application.id, {
        nextStage: targetStage,
        notes: transitionNotes,
        actorName: user?.name || 'Authorized Officer',
        role: user?.role || 'scrutiny_officer'
      });
      setApplication(updated);
      showToast(`Workflow stage transitioned to ${targetStage}!`, 'success');
      setIsTransitionModalOpen(false);
      setTransitionNotes('');

      // Refresh default for the next stage
      const nextAllowed = PERMITTED_TRANSITIONS[targetStage] || [];
      setTargetStage(nextAllowed.length > 0 ? nextAllowed[0] : '');
    } catch (err) {
      showToast('Failed to transition stage: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!docFormData.name.trim()) {
      showToast('Document name is required', 'warning');
      return;
    }

    try {
      setUploading(true);
      const docName = docFormData.name.endsWith('.pdf') ? docFormData.name : `${docFormData.name}.pdf`;
      const addedDoc = await applicationsAPI.uploadDocument(application.id, {
        name: docName,
        documentType: docFormData.documentType,
        size: '2.4 MB'
      });

      // Update local state
      setApplication((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), addedDoc]
      }));

      showToast(`Document "${addedDoc.name}" uploaded successfully!`, 'success');
      setIsUploadModalOpen(false);
      setDocFormData({ name: '', documentType: 'Statutory Annexure', notes: '' });
    } catch (err) {
      showToast('Document upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = (doc) => {
    showToast(`Downloading verified archive: ${doc.name}`, 'info');
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading application lifecycle details & documents..." />;
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
              Back to Applications List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStageObj = WORKFLOW_STAGES.find((s) => s.id === application.currentStage);
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === application.currentStage);
  const permittedNextStages = PERMITTED_TRANSITIONS[application.currentStage] || [];
  const isTerminal = permittedNextStages.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications List
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Academic Year: <strong className="text-slate-700">{application.academicYear}</strong></span>
          <span>•</span>
          <span className="font-mono">{application.institutionId}</span>
        </div>
      </div>

      {/* Main Header Card with Permitted Transition Trigger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="font-mono text-base font-bold text-slate-900">
              {application.applicationNumber}
            </span>
            <Badge size="md">{currentStageObj?.name || application.currentStage}</Badge>
            <Badge
              size="md"
              variant={
                application.status === 'Approved'
                  ? 'success'
                  : application.status === 'Rejected'
                  ? 'danger'
                  : application.status === 'Deficient'
                  ? 'warning'
                  : 'info'
              }
            >
              {application.status}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{application.institutionName}</h1>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {application.region} • Program:{' '}
            <span className="font-medium text-slate-700">{application.applicationType}</span> • Assigned to:{' '}
            <span className="font-medium text-slate-700">{application.assignedTo}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canReview ? (
            isTerminal ? (
              <span className="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Approval Finalized (Terminal Stage)
              </span>
            ) : (
              <Button
                variant="primary"
                leftIcon={Send}
                onClick={() => setIsTransitionModalOpen(true)}
              >
                Advance Workflow Stage
              </Button>
            )
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
              Read-Only Institutional View
            </span>
          )}
        </div>
      </div>

      {/* Workflow Timeline Stepper */}
      <Card
        title="AICTE Workflow Lifecycle Stepper"
        subtitle="End-to-end regulatory verification checkpoints per Approval Process Handbook (APH)"
      >
        <div className="relative py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center min-w-[720px] justify-between">
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
                    {/* Horizontal Connector Line */}
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
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] mt-2 line-clamp-2 max-w-[110px] leading-tight ${textClass}`}>
                      {stage.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Officer Remarks / Scrutiny Comments Box */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Latest Officer Scrutiny Remarks
            </h4>
            <span className="text-[11px] text-amber-700">Official Record</span>
          </div>
          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            {application.officerComments || 'No deficiency comments logged for this cycle.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Metadata & Documents Checklist (Left) + Audit History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <Card title="Institutional Parameters & Infrastructure Metadata">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Sanctioned Intake</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {application.intakeCapacityRequested} Seats
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Built-up Campus Area</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {application.infrastructureAreaSqM?.toLocaleString()} Sq.M
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Land Tenure Status</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {application.landTenureType}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Application Lodged</span>
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
                <span className="text-slate-400 block font-medium">Deficiencies Count</span>
                <span className="text-sm font-bold text-amber-600 mt-0.5 block">
                  {application.deficiencyCount || 0} Flagged
                </span>
              </div>
            </div>
          </Card>

          {/* Document Checklist & Upload UI */}
          <Card
            title="Statutory Document Checklist"
            subtitle={`${application.documents?.length || 0} verified documents attached`}
            action={
              <Button
                variant="outline"
                size="sm"
                leftIcon={UploadCloud}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-slate-100">
              {(application.documents || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No documents uploaded yet.
                </div>
              ) : (
                application.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">{doc.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium hidden sm:inline">
                            {doc.documentType || 'Statutory Annexure'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {doc.size} • Uploaded: {doc.uploadDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge
                        size="sm"
                        variant={
                          doc.status === 'Verified'
                            ? 'success'
                            : doc.status === 'Deficient'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {doc.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Download / View document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Chronological History (1 col) */}
        <div>
          <Card
            title="Chronological Audit History"
            subtitle="Traceable workflow state transitions"
            bodyClassName="p-5"
          >
            <div className="space-y-4 relative pl-4 border-l-2 border-blue-200">
              {(application.stageHistory || []).map((history, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="text-xs font-semibold text-slate-900">{history.action}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{new Date(history.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{history.actor}</span>
                  </div>
                  {history.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Permitted Stage Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Advance Workflow Stage"
        subtitle={`Current Stage: ${currentStageObj?.name || application.currentStage}`}
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
              Confirm State Transition
            </Button>
          </>
        }
      >
        <form onSubmit={handleStageTransition} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Permitted Next Stage <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
            >
              {permittedNextStages.map((stageId) => {
                const stage = WORKFLOW_STAGES.find((s) => s.id === stageId);
                return (
                  <option key={stageId} value={stageId}>
                    {stage ? stage.name : stageId}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Only transitions permitted under AICTE state machine rules are listed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Officer Observations / Decision Minutes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
              placeholder="Record explicit grounds, compliance verification findings, or committee minutes..."
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Attach Supporting Document / Addendum"
        subtitle={`Application: ${application.applicationNumber}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDocumentUpload}
              isLoading={uploading}
            >
              Attach Document
            </Button>
          </>
        }
      >
        <form onSubmit={handleDocumentUpload} className="space-y-4">
          <Input
            label="Document / Certificate File Name"
            required
            placeholder="e.g. Fire_Safety_NOC_Renewal_2026.pdf"
            value={docFormData.name}
            onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
          />

          <Select
            label="Document Classification"
            value={docFormData.documentType}
            onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
            options={[
              'Statutory NOC',
              'Land Document',
              'Building Plan',
              'Academic Audit',
              'Laboratory Spec',
              'Financial Security',
              'Statutory Disclosure',
              'Student Welfare Undertaking'
            ]}
          />

          <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
            <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-slate-700 block">
              Digital Signature & Authenticity Check
            </span>
            <span className="text-[11px] text-slate-400">
              Files are indexed in compliance with AICTE digital locker standards
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
