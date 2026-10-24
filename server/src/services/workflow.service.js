import { TRANSITION_MATRIX, STAGE_METADATA, ROLES } from '../config/workflow.js';
import { AppError } from '../middleware/errorHandler.js';

export const workflowService = {
  /**
   * Validate if a stage transition is permitted and if the user's role is authorized
   */
  validateTransition(currentStage, nextStage, userRole) {
    const allowedTransitions = TRANSITION_MATRIX[currentStage];

    if (!allowedTransitions || allowedTransitions.length === 0) {
      throw new AppError(
        `Application is in stage '${currentStage}', which has no outgoing transitions.`,
        400
      );
    }

    const matchedRule = allowedTransitions.find((rule) => rule.target === nextStage);
    if (!matchedRule) {
      const validTargets = allowedTransitions.map((r) => r.target).join(', ');
      throw new AppError(
        `Invalid workflow transition from '${currentStage}' to '${nextStage}'. Permitted next stages: [${validTargets}].`,
        400
      );
    }

    if (!matchedRule.roles.includes(userRole)) {
      throw new AppError(
        `Forbidden: Role '${userRole}' is not authorized to transition application from '${currentStage}' to '${nextStage}'. Authorized roles: [${matchedRule.roles.join(', ')}].`,
        403
      );
    }

    return matchedRule;
  },

  /**
   * Execute stage transition and record auditable WorkflowEvent
   */
  async executeTransition(application, nextStage, { notes, action, actorUser }) {
    const currentStage = application.currentStage;

    // Validate institution ownership
    if (actorUser.role === ROLES.INSTITUTION && application.institutionId !== actorUser.institutionId) {
      throw new AppError('Forbidden: You can only transition applications belonging to your institution.', 403);
    }

    // Validate transition against state machine
    const rule = this.validateTransition(currentStage, nextStage, actorUser.role);

    const stageMeta = STAGE_METADATA[nextStage] || { name: nextStage };
    const eventAction = action || `Moved to ${stageMeta.name}`;
    const eventNotes = notes || `Application moved from ${currentStage} to ${nextStage}.`;

    // Create auditable WorkflowEvent
    const auditRecord = {
      stage: nextStage,
      previousStage: currentStage,
      nextStage: nextStage,
      action: eventAction,
      actor: actorUser.name || 'Authorized Officer',
      actorId: actorUser._id?.toString() || actorUser.id,
      actorRole: actorUser.role,
      notes: eventNotes,
      timestamp: new Date(),
    };

    // Update application fields
    application.currentStage = nextStage;
    application.status = rule.defaultStatus;
    application.stageHistory.push(auditRecord);

    // If deficiency cleared on resubmission, decrement deficiencyCount if applicable
    if (currentStage === 'RE_SCRUTINY' && nextStage === 'SCRUTINY') {
      application.deficiencyCount = Math.max(0, application.deficiencyCount - 1);
    }

    await application.save();
    return application;
  },
};

export default workflowService;
