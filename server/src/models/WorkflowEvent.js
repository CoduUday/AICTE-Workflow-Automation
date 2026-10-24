import mongoose from 'mongoose';

export const workflowEventSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: String,
      required: true,
    },
    actorId: {
      type: String,
    },
    actorRole: {
      type: String,
    },
    previousStage: {
      type: String,
    },
    nextStage: {
      type: String,
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

export const WorkflowEvent = mongoose.model('WorkflowEvent', workflowEventSchema);
export default WorkflowEvent;
