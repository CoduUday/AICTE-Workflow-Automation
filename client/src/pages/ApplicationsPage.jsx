import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  FileText,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { applicationsAPI } from '../services/api';
import { WORKFLOW_STAGES } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Sorting State
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Validated Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const initialForm = {
    institutionName: '',
    institutionId: '',
    academicYear: '2026-2027',
    applicationType: 'Extension of Approval (EOA)',
    region: 'Northern (NRO)',
    intakeCapacityRequested: 120,
    infrastructureAreaSqM: 8500,
    landTenureType: 'Owned Freehold',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationsAPI.getAll({
        search,
        stage: selectedStage,
        status: selectedStatus,
        academicYear: selectedYear,
        applicationType: selectedType,
        sortBy,
        sortOrder,
        page,
        limit
      });

      setApplications(res.applications || []);
      if (res.pagination) {
        setPaginationMeta(res.pagination);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading applications list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStage, selectedStatus, selectedYear, selectedType, sortBy, sortOrder, page, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStage('ALL');
    setSelectedStatus('ALL');
    setSelectedYear('ALL');
    setSelectedType('ALL');
    setSortBy('submittedAt');
    setSortOrder('desc');
    setPage(1);
    showToast('Filters reset', 'info');
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Validation function
  const validateForm = () => {
    const errs = {};
    if (!formData.institutionName.trim() || formData.institutionName.trim().length < 4) {
      errs.institutionName = 'Institution name must be at least 4 characters long';
    }
    if (!formData.institutionId.trim()) {
      errs.institutionId = 'Institution AISHE/AICTE ID is required (e.g. INST-2026-091)';
    }
    if (!formData.intakeCapacityRequested || Number(formData.intakeCapacityRequested) < 30) {
      errs.intakeCapacityRequested = 'Proposed intake must be a valid number of at least 30 seats';
    }
    if (!formData.infrastructureAreaSqM || Number(formData.infrastructureAreaSqM) < 500) {
      errs.infrastructureAreaSqM = 'Built-up area must be at least 500 Sq. Metres per APH guidelines';
    }
    if (!formData.notes.trim()) {
      errs.notes = 'Preliminary disclosure remarks are required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors before submitting.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await applicationsAPI.create({
        ...formData,
        submittedBy: user?.name || 'Institution Signatory'
      });
      showToast(`Application ${created.applicationNumber} registered successfully!`, 'success');
      setIsModalOpen(false);
      setFormData(initialForm);
      setErrors({});
      setPage(1);
      fetchApplications();
    } catch {
      showToast('Failed to create application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter option arrays
  const stageFilterOptions = [
    { value: 'ALL', label: 'All Stages' },
    ...WORKFLOW_STAGES.map((s) => ({ value: s.id, label: s.name }))
  ];

  const statusFilterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Deficient', label: 'Deficient' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const yearFilterOptions = [
    { value: 'ALL', label: 'All Academic Years' },
    { value: '2026-2027', label: 'AY 2026-2027 (Current)' },
    { value: '2025-2026', label: 'AY 2025-2026' },
    { value: '2024-2025', label: 'AY 2024-2025' }
  ];

  const typeFilterOptions = [
    { value: 'ALL', label: 'All Application Types' },
    { value: 'Extension of Approval', label: 'Extension of Approval (EOA)' },
    { value: 'New Technical Institution', label: 'New Institution Setup' },
    { value: 'Increase in Sanctioned Intake', label: 'Increase in Intake' },
    { value: 'Closure of Non-Viable Course', label: 'Course Closure' },
    { value: 'Introduction of Emerging Areas', label: 'Emerging Areas (AI/IoT)' }
  ];

  const columns = [
    {
      header: (
        <button
          type="button"
          onClick={() => toggleSort('applicationNumber')}
          className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors uppercase tracking-wider text-xs"
        >
          <span>Application No</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      render: (row) => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
            {row.applicationNumber}
          </div>
          <div className="text-[11px] text-slate-400">
            Submitted: {new Date(row.submittedAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: (
        <button
          type="button"
          onClick={() => toggleSort('institutionName')}
          className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors uppercase tracking-wider text-xs"
        >
          <span>Institution & Region</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      render: (row) => (
        <div className="max-w-xs">
          <div className="font-medium text-slate-900 truncate text-xs sm:text-sm">
            {row.institutionName}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{row.region}</span>
            <span>•</span>
            <span className="font-mono text-slate-400">{row.academicYear}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Program / Type',
      render: (row) => (
        <div className="text-xs text-slate-700 max-w-[200px] leading-tight">
          <span className="font-medium">{row.applicationType}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {row.intakeCapacityRequested} seats requested
          </span>
        </div>
      )
    },
    {
      header: (
        <button
          type="button"
          onClick={() => toggleSort('currentStage')}
          className="flex items-center gap-1 font-semibold hover:text-blue-600 transition-colors uppercase tracking-wider text-xs"
        >
          <span>Current Stage</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      render: (row) => {
        const stage = WORKFLOW_STAGES.find((s) => s.id === row.currentStage);
        return <Badge size="sm">{stage?.name || row.currentStage.replace(/_/g, ' ')}</Badge>;
      }
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge
          size="sm"
          variant={
            row.status === 'Approved'
              ? 'success'
              : row.status === 'Rejected'
              ? 'danger'
              : row.status === 'Deficient'
              ? 'warning'
              : 'info'
          }
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Link to={`/applications/${row.id}`}>
          <Button variant="outline" size="sm" rightIcon={ChevronRight}>
            Inspect
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applications Tracking</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized pipeline of all institutional approval submissions across technical institutions.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          New Application
        </Button>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <Card bodyClassName="p-4 space-y-3">
        {/* Row 1: Search and reset */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by Application No, College name, or Course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" variant="primary" className="flex-1 sm:flex-initial">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={RotateCcw}
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset
            </Button>
          </div>
        </form>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <Select
              label="Stage"
              options={stageFilterOptions}
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              label="Status"
              options={statusFilterOptions}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              label="Academic Year"
              options={yearFilterOptions}
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              label="Application Type"
              options={typeFilterOptions}
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Applications Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={applications}
          isLoading={loading}
          emptyMessage="No applications found matching the selected filter criteria."
        />

        {/* Pagination Toolbar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {paginationMeta.total === 0 ? 0 : (page - 1) * limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(page * limit, paginationMeta.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{paginationMeta.total}</span> applications
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!paginationMeta.hasPrevPage}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>

              <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {page} of {paginationMeta.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!paginationMeta.hasNextPage}
                onClick={() => setPage((p) => Math.min(p + 1, paginationMeta.totalPages))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Validated New Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lodge New AICTE Approval Application"
        subtitle="Mandatory self-disclosure and proposal registration for technical programs"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Institution Name"
            required
            placeholder="e.g. National Institute of Technology & Science"
            value={formData.institutionName}
            error={errors.institutionName}
            onChange={(e) => {
              setFormData({ ...formData, institutionName: e.target.value });
              if (errors.institutionName) setErrors({ ...errors, institutionName: null });
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Institution Code / AISHE ID"
              required
              placeholder="e.g. INST-2026-DEL-089"
              value={formData.institutionId}
              error={errors.institutionId}
              onChange={(e) => {
                setFormData({ ...formData, institutionId: e.target.value });
                if (errors.institutionId) setErrors({ ...errors, institutionId: null });
              }}
            />

            <Select
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              options={['2026-2027', '2025-2026', '2024-2025']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Application Type"
              value={formData.applicationType}
              onChange={(e) => setFormData({ ...formData, applicationType: e.target.value })}
              options={[
                'Extension of Approval (EOA)',
                'Increase in Sanctioned Intake',
                'New Technical Institution Setup',
                'Introduction of Emerging Areas',
                'Closure of Non-Viable Course'
              ]}
            />

            <Select
              label="AICTE Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              options={[
                'Northern (NRO)',
                'Western (WRO)',
                'South-Western (SWRO)',
                'Eastern (ERO)',
                'Central (CRO)',
                'North-West (NWRO)'
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proposed Intake Capacity"
              type="number"
              required
              min={30}
              value={formData.intakeCapacityRequested}
              error={errors.intakeCapacityRequested}
              onChange={(e) => {
                setFormData({ ...formData, intakeCapacityRequested: e.target.value });
                if (errors.intakeCapacityRequested) setErrors({ ...errors, intakeCapacityRequested: null });
              }}
            />

            <Input
              label="Built-up Area (Sq. Metres)"
              type="number"
              required
              min={500}
              value={formData.infrastructureAreaSqM}
              error={errors.infrastructureAreaSqM}
              onChange={(e) => {
                setFormData({ ...formData, infrastructureAreaSqM: e.target.value });
                if (errors.infrastructureAreaSqM) setErrors({ ...errors, infrastructureAreaSqM: null });
              }}
            />
          </div>

          <Select
            label="Land Tenure Document Status"
            value={formData.landTenureType}
            onChange={(e) => setFormData({ ...formData, landTenureType: e.target.value })}
            options={['Owned Freehold', 'Registered Lease (33+ Years)', 'Government Allotment']}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Preliminary Disclosure Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              className={`w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 ${
                errors.notes ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
              }`}
              placeholder="Outline specific approvals, laboratory expansion, or statutory prerequisites..."
              value={formData.notes}
              onChange={(e) => {
                setFormData({ ...formData, notes: e.target.value });
                if (errors.notes) setErrors({ ...errors, notes: null });
              }}
            />
            {errors.notes && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.notes}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
