import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `ev-${Date.now().toString().slice(-6)}`,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      default: '1.2 MB',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    submittedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
    },
    verificationStatus: {
      type: String,
      enum: ['Submitted', 'Verified', 'Rejected'],
      default: 'Submitted',
    },
    remarks: {
      type: String,
    },
  },
  { _id: true }
);

const complianceItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
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
    requirementType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Due Soon', 'Overdue', 'Expired', 'Complied', 'Completed', 'Under Review'],
      default: 'Pending',
      index: true,
    },
    criticality: {
      type: String,
      enum: ['High', 'Medium', 'Normal'],
      default: 'Medium',
      index: true,
    },
    documentReference: {
      type: String,
    },
    evidence: [evidenceSchema],
    lastNotifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant queries
complianceItemSchema.index({ institutionId: 1, status: 1 });
complianceItemSchema.index({ dueDate: 1, status: 1 });
complianceItemSchema.index({ applicationId: 1, status: 1 });

export const ComplianceItem = mongoose.model('ComplianceItem', complianceItemSchema);
export default ComplianceItem;
