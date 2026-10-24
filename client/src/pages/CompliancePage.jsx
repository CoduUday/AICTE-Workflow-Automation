import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  FileText,
  Building
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

export default function CompliancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [complianceItems, setComplianceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');

  // New Obligation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newObligation, setNewObligation] = useState({
    institutionName: 'Delhi Institute of Technology & Management',
    requirementType: '',
    description: '',
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    criticality: 'High'
  });

  // Upload/Verify Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [newStatus, setNewStatus] = useState('Complied');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const data = await complianceAPI.getAll({
        search,
        status: statusFilter,
        criticality: criticalityFilter
      });
      setComplianceItems(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load compliance register', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [statusFilter, criticalityFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newObligation.requirementType || !newObligation.dueDate) {
      showToast('Please fill in all mandatory fields', 'warning');
      return;
    }

    try {
      setIsCreating(true);
      await complianceAPI.create(newObligation);
      showToast('New compliance requirement added!', 'success');
      setIsCreateModalOpen(false);
      setNewObligation({
        institutionName: 'Delhi Institute of Technology & Management',
        requirementType: '',
        description: '',
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        criticality: 'High'
      });
      fetchCompliance();
    } catch {
      showToast('Failed to create obligation', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setIsUpdating(true);
      await complianceAPI.updateStatus(selectedItem.id, newStatus, docName || 'Signed_Undertaking_2026.pdf');
      showToast(`Compliance updated to ${newStatus}!`, 'success');
      setIsUpdateModalOpen(false);
      setSelectedItem(null);
      setDocName('');
      fetchCompliance();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status === 'Complied' ? 'Under Review' : 'Complied');
    setDocName(item.documentReference || '');
    setIsUpdateModalOpen(true);
  };

  const columns = [
    {
      header: 'Obligation / Statutory Requirement',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{row.requirementType}</div>
          <div className="text-[11px] text-slate-500 max-w-sm truncate mt-0.5">{row.description}</div>
        </div>
      )
    },
    {
      header: 'Institution',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800">{row.institutionName}</span>
        </div>
      )
    },
    {
      header: 'Criticality',
      render: (row) => (
        <Badge
          size="sm"
          variant={row.criticality === 'High' ? 'danger' : row.criticality === 'Medium' ? 'warning' : 'neutral'}
        >
          {row.criticality} Priority
        </Badge>
      )
    },
    {
      header: 'Due Deadline',
      render: (row) => {
        const isOverdue = row.status === 'Overdue' || new Date(row.dueDate) < new Date();
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
              {new Date(row.dueDate).toLocaleDateString()}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Compliance Status',
      render: (row) => <Badge size="sm">{row.status}</Badge>
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={Upload}
          onClick={() => openUpdateModal(row)}
        >
          Update Proof
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Register</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mandatory undertakings, land lease renewals, biometric reports, and time-bound regulatory obligations.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Obligation
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search obligations or colleges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Under Review', label: 'Under Review' },
                { value: 'Overdue', label: 'Overdue' },
                { value: 'Complied', label: 'Complied' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              options={[
                { value: 'ALL', label: 'All Criticality' },
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'Normal', label: 'Normal' }
              ]}
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Compliance Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={complianceItems}
          isLoading={loading}
          emptyMessage="No compliance records found for this filter criteria."
        />
      </Card>

      {/* Create Obligation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Mandatory Compliance Obligation"
        subtitle="Mandate a time-bound undertaking or renewal under APH regulations"
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

          <Input
            label="Statutory Requirement Title"
            required
            placeholder="e.g. Fire Safety NOC Renewal / Perpetual Land Lease"
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
              placeholder="Specify the regulatory clause or undertaking details..."
              value={newObligation.description}
              onChange={(e) => setNewObligation({ ...newObligation, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Compliance Due Date"
              type="date"
              required
              value={newObligation.dueDate}
              onChange={(e) => setNewObligation({ ...newObligation, dueDate: e.target.value })}
            />

            <Select
              label="Criticality Level"
              value={newObligation.criticality}
              onChange={(e) => setNewObligation({ ...newObligation, criticality: e.target.value })}
              options={['High', 'Medium', 'Normal']}
            />
          </div>
        </form>
      </Modal>

      {/* Update Proof Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Upload Compliance Undertaking / Update Status"
        subtitle={selectedItem?.requirementType}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateStatus}
              isLoading={isUpdating}
            >
              Update Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Updated Compliance Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={['Pending', 'Under Review', 'Complied', 'Overdue']}
          />

          <Input
            label="Reference Document / Certificate Name"
            placeholder="e.g. Registered_Lease_Deed_Signed.pdf"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />

          <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-blue-600">Click or drag PDF document to attach</span>
            <p className="text-[10px] text-slate-400 mt-1">Accepts digitally signed PDFs up to 25 MB</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
