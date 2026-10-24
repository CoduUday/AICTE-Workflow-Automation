import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, FileText, ArrowUpDown, ChevronRight, Eye } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // New Application Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    applicationType: 'Extension of Approval (EOA)',
    region: 'Northern (NRO)',
    intakeCapacityRequested: 120,
    infrastructureAreaSqM: 8500,
    landTenureType: 'Owned',
    notes: ''
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationsAPI.getAll({ search, stage: selectedStage });
      setApplications(res.applications || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading applications list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.institutionName.trim()) {
      showToast('Please specify the Institution Name', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await applicationsAPI.create({
        ...formData,
        submittedBy: user?.name || 'Institution Admin'
      });
      showToast(`Application ${created.applicationNumber} created successfully!`, 'success');
      setIsModalOpen(false);
      setFormData({
        institutionName: '',
        applicationType: 'Extension of Approval (EOA)',
        region: 'Northern (NRO)',
        intakeCapacityRequested: 120,
        infrastructureAreaSqM: 8500,
        landTenureType: 'Owned',
        notes: ''
      });
      fetchApplications();
    } catch {
      showToast('Failed to create application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageFilterOptions = [
    { value: 'ALL', label: 'All Workflow Stages' },
    ...WORKFLOW_STAGES.map((s) => ({ value: s.id, label: s.name }))
  ];

  const columns = [
    {
      header: 'Application No & Date',
      render: (row) => (
        <div>
          <div className="font-mono font-semibold text-slate-900">{row.applicationNumber}</div>
          <div className="text-[11px] text-slate-400">
            {new Date(row.submittedAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: 'Institution & Region',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 truncate max-w-xs">{row.institutionName}</div>
          <div className="text-[11px] text-slate-500">{row.region}</div>
        </div>
      )
    },
    {
      header: 'Program / Type',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.applicationType}</span>
      )
    },
    {
      header: 'Current Workflow Stage',
      render: (row) => {
        const stage = WORKFLOW_STAGES.find((s) => s.id === row.currentStage);
        return <Badge size="sm">{stage?.name || row.currentStage.replace(/_/g, ' ')}</Badge>;
      }
    },
    {
      header: 'Assigned Reviewer',
      render: (row) => (
        <div className="text-xs text-slate-600 font-medium">
          {row.assignedTo || 'Unassigned'}
        </div>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Link to={`/applications/${row.id}`}>
          <Button variant="outline" size="sm" rightIcon={ChevronRight}>
            View Stage
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
            Real-time pipeline of all institutional approval submissions, reviews, and committee verdicts.
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

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search by Application No, College name, or Course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              options={stageFilterOptions}
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <Button type="submit" variant="secondary" className="w-full">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Applications Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={applications}
          isLoading={loading}
          emptyMessage="No applications found matching the selected filter."
        />
      </Card>

      {/* New Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Approval Application"
        subtitle="Submit a fresh institutional request into the AICTE workflow pipeline"
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
            onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Application Type"
              value={formData.applicationType}
              onChange={(e) => setFormData({ ...formData, applicationType: e.target.value })}
              options={[
                'Extension of Approval (EOA)',
                'Increase in Sanctioned Intake',
                'New Technical Institution Setup',
                'Introduction of Emerging Areas (AI/ML/Cyber)',
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
              value={formData.intakeCapacityRequested}
              onChange={(e) => setFormData({ ...formData, intakeCapacityRequested: e.target.value })}
            />

            <Input
              label="Built-up Area (Sq. Metres)"
              type="number"
              value={formData.infrastructureAreaSqM}
              onChange={(e) => setFormData({ ...formData, infrastructureAreaSqM: e.target.value })}
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
              Preliminary Disclosure Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
              placeholder="Outline specific approvals or requirements for this academic cycle..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
