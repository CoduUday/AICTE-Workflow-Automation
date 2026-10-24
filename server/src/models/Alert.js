import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipientId: {
      type: String,
      index: true,
    },
    recipientRole: {
      type: String,
      index: true,
    },
    institutionId: {
      type: String,
      index: true,
    },
    institutionName: {
      type: String,
    },
    applicationId: {
      type: String,
      index: true,
    },
    complianceId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'INFO', 'ESCALATION'],
      default: 'INFO',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['danger', 'warning', 'info'],
      default: 'info',
    },
    dueAt: {
      type: Date,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    dedupKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user alerts feed
alertSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
alertSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });
alertSchema.index({ institutionId: 1, read: 1, createdAt: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
