import mongoose from 'mongoose';
import { WORKFLOW_STAGES } from '../config/workflow.js';
import { workflowEventSchema } from './WorkflowEvent.js';

const documentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `doc-${Date.now().toString().slice(-6)}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      default: '1.0 MB',
    },
    documentType: {
      type: String,
      default: 'General Document',
    },
    documentUrl: {
      type: String,
    },
    uploadDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    status: {
      type: String,
      enum: ['Verified', 'Pending Review', 'Deficient', 'Under Review'],
      default: 'Pending Review',
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
    },
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    institutionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    institutionName: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    applicationType: {
      type: String,
      required: true,
      trim: true,
    },
    currentStage: {
      type: String,
      enum: Object.values(WORKFLOW_STAGES),
      default: WORKFLOW_STAGES.SUBMITTED,
      index: true,
    },
    status: {
      type: String,
      default: 'Submitted',
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
    },
    assignedToId: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    targetResolutionDate: {
      type: Date,
    },
    intakeCapacityRequested: {
      type: Number,
      default: 120,
    },
    infrastructureAreaSqM: {
      type: Number,
      default: 10000,
    },
    landTenureType: {
      type: String,
      default: 'Owned',
    },
    deficiencyCount: {
      type: Number,
      default: 0,
    },
    stageHistory: [workflowEventSchema],
    documents: [documentSchema],
  },
  {
    timestamps: true,
  }
);

// Auto-populate `id` if not set before save
applicationSchema.pre('save', function (next) {
  if (!this.id && this.applicationNumber) {
    const cleanNum = this.applicationNumber.replace(/[^0-9]/g, '');
    this.id = `APP-2026-${cleanNum.slice(-4) || Date.now().toString().slice(-4)}`;
  }
  next();
});

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
