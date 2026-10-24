import mongoose from 'mongoose';

const rescheduleRecordSchema = new mongoose.Schema(
  {
    previousDate: {
      type: Date,
      required: true,
    },
    newDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    rescheduledBy: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const evcVisitSchema = new mongoose.Schema(
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
    visitDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Proposed', 'Scheduled', 'Rescheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    committeeLead: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    committeeMembers: {
      type: [String],
      default: [],
    },
    inspectionScope: {
      type: String,
      default: 'Comprehensive infrastructure, lab facilities, and academic verification',
    },
    venueAddress: {
      type: String,
    },
    reportSubmitted: {
      type: Boolean,
      default: false,
    },
    outcome: {
      type: String,
    },
    rescheduleHistory: [rescheduleRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Conflict detection indexes: prevent team members from being double booked on the same date
evcVisitSchema.index({ committeeLead: 1, visitDate: 1 });
evcVisitSchema.index({ committeeMembers: 1, visitDate: 1 });
evcVisitSchema.index({ institutionId: 1, visitDate: 1 });

export const EVCVisit = mongoose.model('EVCVisit', evcVisitSchema);
export default EVCVisit;
