import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  FileText,
  Building,
  Check,
  X,
  FileCheck,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { complianceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function CompliancePage() {
  const { user, canReview, isInstitution, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [complianceItems, setComplianceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');

  // Add Obligation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newObligation, setNewObligation] = useState({
    institutionName: 'Delhi Institute of Technology & Management',
    applicationId: 'APP-2026-0041',
    requirementType: '',
    description: '',
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    criticality: 'High'
  });

  // Evidence Submission Modal (Institution)
  const [selectedForEvidence, setSelectedForEvidence] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceData, setEvidenceData] = useState({
    documentReference: '',
    certificateNumber: '',
    expiryDate: '',
    evidenceNotes: ''
  });

  // Evidence Verification Modal (Officer)
  const [selectedForVerification, setSelectedForVerification] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState('Completed');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Confirmation Dialog
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complianceAPI.getAll({
        search,
        status: statusFilter,
        criticality: criticalityFilter
      });
      setComplianceItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load compliance register. Please try again.');
      showToast('Failed to load compliance register', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [statusFilter, criticalityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompliance();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCriticalityFilter('ALL');
    fetchCompliance();
  };

  // Add Obligation Form Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newObligation.requirementType.trim() || !newObligation.dueDate) {
      showToast('Please specify requirement title and compliance due date', 'warning');
      return;
    }

    try {
      setIsCreating(true);
      await complianceAPI.create(newObligation);
      showToast('Mandatory compliance obligation registered!', 'success');
      setIsCreateModalOpen(false);
      setNewObligation({
        institutionName: 'Delhi Institute of Technology & Management',
        applicationId: 'APP-2026-0041',
        requirementType: '',
        description: '',
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        criticality: 'High'
      });
      fetchCompliance();
    } catch {
      showToast('Failed to register obligation', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Open Evidence Submission Modal
  const openEvidenceModal = (item) => {
    setSelectedForEvidence(item);
    setEvidenceData({
      documentReference: item.documentReference || `${item.requirementType.replace(/\s+/g, '_')}_Evidence.pdf`,
      certificateNumber: item.certificateNumber || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      evidenceNotes: item.evidenceNotes || ''
    });
    setIsEvidenceModalOpen(true);
  };

  // Submit Evidence with Confirmation
  const submitEvidenceWithConfirmation = (e) => {
    e.preventDefault();
    if (!evidenceData.documentReference.trim()) {
      showToast('Document reference name is required', 'warning');
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: 'Confirm Evidence Submission',
      message: `Are you sure you want to lodge compliance proof for "${selectedForEvidence.requirementType}"? This will be forwarded to the Scrutiny Committee for review.`,
      onConfirm: executeEvidenceSubmission
    });
  };

  const executeEvidenceSubmission = async () => {
    setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    try {
      setIsSubmittingEvidence(true);
      await complianceAPI.submitEvidence(selectedForEvidence.id, {
        ...evidenceData,
        submittedBy: user?.name || 'Institution Signatory'
      });
      showToast('Compliance evidence uploaded and submitted for review!', 'success');
      setIsEvidenceModalOpen(false);
      fetchCompliance();
    } catch {
      showToast('Failed to submit evidence', 'error');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Open Verification Modal
  const openVerificationModal = (item) => {
    setSelectedForVerification(item);
    setVerificationOutcome('Completed');
    setVerificationNotes(item.verificationNotes || 'Verified authentic following scrutiny check.');
    setIsVerifyModalOpen(true);
  };

  // Verify Evidence with Confirmation
  const submitVerificationWithConfirmation = (e) => {
    e.preventDefault();
    const isApproved = verificationOutcome === 'Completed';

    setConfirmationDialog({
      isOpen: true,
      title: isApproved ? 'Approve Compliance Verification' : 'Reject / Flag Deficiencies',
      message: isApproved
        ? `Confirm that the submitted evidence for "${selectedForVerification.requirementType}" satisfies AICTE APH standards?`
        : `Flag deficiencies on "${selectedForVerification.requirementType}" and require institution to re-submit?`,
      onConfirm: executeVerification
    });
  };

  const executeVerification = async () => {
    setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    try {
      setIsVerifying(true);
      await complianceAPI.verifyEvidence(selectedForVerification.id, {
        outcome: verificationOutcome,
        verificationNotes,
        verifiedBy: user?.name || 'Scrutiny Officer'
      });
      showToast(
        verificationOutcome === 'Completed'
          ? 'Compliance verified and marked as Completed!'
          : 'Evidence rejected. Deficiencies logged for institution.',
        verificationOutcome === 'Completed' ? 'success' : 'warning'
      );
      setIsVerifyModalOpen(false);
      fetchCompliance();
    } catch {
      showToast('Failed to verify compliance', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: 'Obligation / Statutory Title',
      render: (row) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug">
            {row.requirementType}
          </div>
          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.description}</div>
          {row.certificateNumber && (
            <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              Cert #{row.certificateNumber}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Institution & Application',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block truncate max-w-[200px]">
            {row.institutionName}
          </span>
          <span className="text-[11px] font-mono text-blue-600 font-medium">
            {row.applicationId || 'APP-2026-0041'}
          </span>
        </div>
      )
    },
    {
      header: 'Criticality',
      render: (row) => (
        <Badge
          size="sm"
          variant={
            row.criticality === 'Critical'
              ? 'danger'
              : row.criticality === 'High'
              ? 'danger'
              : row.criticality === 'Medium'
              ? 'warning'
              : 'neutral'
          }
        >
          {row.criticality}
        </Badge>
      )
    },
    {
      header: 'Due & Expiry Dates',
      render: (row) => {
        const isOverdue = row.computedStatus === 'Overdue' || row.status === 'Overdue';
        const isExpired = row.computedStatus === 'Expired' || row.status === 'Expired';
        const isDueSoon = row.computedStatus === 'Due Soon';

        return (
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className={isOverdue ? 'text-rose-600 font-bold' : isDueSoon ? 'text-amber-600 font-semibold' : 'text-slate-700'}>
                Due: {new Date(row.dueDate).toLocaleDateString()}
              </span>
            </div>
            {row.expiryDate && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Exp:</span>
                <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                  {new Date(row.expiryDate).toLocaleDateString()}
                </span>
                {isExpired && (
                  <span className="text-[10px] text-rose-600 font-semibold px-1 rounded bg-rose-50 border border-rose-200">
                    Lapsed
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Compliance Status',
      render: (row) => {
        const current = row.computedStatus || row.status;
        let variant = 'neutral';
        if (current === 'Completed') variant = 'success';
        else if (current === 'Overdue' || current === 'Expired') variant = 'danger';
        else if (current === 'Due Soon' || current === 'Under Review') variant = 'warning';

        return <Badge size="sm" variant={variant}>{current}</Badge>;
      }
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => {
        const isCompleted = row.status === 'Completed' || row.computedStatus === 'Completed';

        return (
          <div className="flex items-center justify-end gap-2">
            {/* Institution evidence submission */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={Upload}
              onClick={() => openEvidenceModal(row)}
              title="Submit compliance proof document"
            >
              {row.documentReference ? 'Update Proof' : 'Submit Evidence'}
            </Button>

            {/* Officer review & verification */}
            {canReview && (
              <Button
                variant={row.status === 'Under Review' ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={FileCheck}
                onClick={() => openVerificationModal(row)}
                title="Verify submitted evidence"
              >
                Verify
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Monitoring Register</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mandatory undertakings, statutory certificates, land lease renewals, and time-bound regulatory disclosures.
          </p>
        </div>

        {canReview && (
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Obligation
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card bodyClassName="p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by Requirement title, Institution, or Application ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={RotateCcw}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>
        </form>

        {/* Status Tab Filters per Prompt: pending, due soon, overdue, expired, completed */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Status Filter:
          </span>
          {[
            { value: 'ALL', label: 'All Obligations' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Due Soon', label: 'Due Soon (≤ 14 Days)' },
            { value: 'Under Review', label: 'Under Review' },
            { value: 'Overdue', label: 'Overdue' },
            { value: 'Expired', label: 'Expired' },
            { value: 'Completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Criticality selector */}
          <div className="ml-auto w-40">
            <Select
              options={[
                { value: 'ALL', label: 'All Criticalities' },
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Normal', label: 'Normal' }
              ]}
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {error ? (
        <ErrorState
          title="Compliance Data Error"
          message={error}
          onRetry={fetchCompliance}
        />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={complianceItems}
            isLoading={loading}
            emptyMessage="No statutory compliance obligations found matching your filter criteria."
          />
        </Card>
      )}

      {/* Modal 1: Add Obligation (Officers/Admin) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Mandatory Compliance Obligation"
        subtitle="Mandate statutory certificates, lease renewals, or undertakings under AICTE APH"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={isCreating}
            >
              Save Obligation
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Institution Name"
            required
            value={newObligation.institutionName}
            onChange={(e) => setNewObligation({ ...newObligation, institutionName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Related Application ID"
              value={newObligation.applicationId}
              onChange={(e) => setNewObligation({ ...newObligation, applicationId: e.target.value })}
            />

            <Select
              label="Criticality Level"
              value={newObligation.criticality}
              onChange={(e) => setNewObligation({ ...newObligation, criticality: e.target.value })}
              options={['Critical', 'High', 'Medium', 'Normal']}
            />
          </div>

          <Input
            label="Statutory Requirement Title"
            required
            placeholder="e.g. Fire Safety Certificate & NOC Renewal"
            value={newObligation.requirementType}
            onChange={(e) => setNewObligation({ ...newObligation, requirementType: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Legal / APH Clause Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="State explicit compliance directives, regulatory clauses, and submission conditions..."
              value={newObligation.description}
              onChange={(e) => setNewObligation({ ...newObligation, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Submission Due Date"
              type="date"
              required
              value={newObligation.dueDate}
              onChange={(e) => setNewObligation({ ...newObligation, dueDate: e.target.value })}
            />

            <Input
              label="Certificate Validity Expiry Date"
              type="date"
              required
              value={newObligation.expiryDate}
              onChange={(e) => setNewObligation({ ...newObligation, expiryDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Evidence Submission Interface (Institution) */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Submit Compliance Evidence & Documentation"
        subtitle={selectedForEvidence?.requirementType}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitEvidenceWithConfirmation}
              isLoading={isSubmittingEvidence}
            >
              Submit Evidence for Scrutiny
            </Button>
          </>
        }
      >
        <form onSubmit={submitEvidenceWithConfirmation} className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
            <span className="font-semibold block">Statutory Requirement:</span>
            {selectedForEvidence?.description}
          </div>

          <Input
            label="Document / Certificate File Name"
            required
            placeholder="e.g. Signed_Fire_NOC_2026.pdf"
            value={evidenceData.documentReference}
            onChange={(e) => setEvidenceData({ ...evidenceData, documentReference: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Certificate / Registration Number"
              placeholder="e.g. DFS/2026/CERT-890"
              value={evidenceData.certificateNumber}
              onChange={(e) => setEvidenceData({ ...evidenceData, certificateNumber: e.target.value })}
            />

            <Input
              label="Certificate Validity Expiry Date"
              type="date"
              value={evidenceData.expiryDate}
              onChange={(e) => setEvidenceData({ ...evidenceData, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Institution Submission Remarks
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Provide context regarding inspection clearance, issuing authority, or validity endorsements..."
              value={evidenceData.evidenceNotes}
              onChange={(e) => setEvidenceData({ ...evidenceData, evidenceNotes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: Verification Interface (Officers) */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify Compliance Evidence"
        subtitle={`Institution: ${selectedForVerification?.institutionName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={verificationOutcome === 'Completed' ? 'primary' : 'danger'}
              onClick={submitVerificationWithConfirmation}
              isLoading={isVerifying}
            >
              {verificationOutcome === 'Completed' ? 'Authorize & Mark Completed' : 'Issue Deficiency Notice'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitVerificationWithConfirmation} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Requirement:</span>
              <span className="font-semibold text-slate-800">{selectedForVerification?.requirementType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Evidence File:</span>
              <span className="font-mono text-blue-600 font-medium">
                {selectedForVerification?.documentReference || 'No file attached'}
              </span>
            </div>
            {selectedForVerification?.certificateNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Certificate No:</span>
                <span className="font-mono text-slate-700">{selectedForVerification?.certificateNumber}</span>
              </div>
            )}
            {selectedForVerification?.evidenceNotes && (
              <div className="pt-1.5 border-t border-slate-200 text-slate-600">
                <span className="font-medium text-slate-700 block">Institution Notes:</span>
                {selectedForVerification?.evidenceNotes}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Verification Determination <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  verificationOutcome === 'Completed'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="Completed"
                  checked={verificationOutcome === 'Completed'}
                  onChange={() => setVerificationOutcome('Completed')}
                  className="text-emerald-600"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verify & Complete</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  verificationOutcome === 'Deficient'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold ring-1 ring-rose-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="Deficient"
                  checked={verificationOutcome === 'Deficient'}
                  onChange={() => setVerificationOutcome('Deficient')}
                  className="text-rose-600"
                />
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Flag Deficient</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Scrutiny Remarks / Assessment Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="State grounds of verification, statutory clause compliance, or deficiencies..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog Modal */}
      <Modal
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
        title={confirmationDialog.title}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmationDialog.onConfirm}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">{confirmationDialog.message}</p>
      </Modal>
    </div>
  );
}
