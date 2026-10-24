import { EVCVisit } from '../models/EVCVisit.js';
import { Application } from '../models/Application.js';
import { ROLES, WORKFLOW_STAGES } from '../config/workflow.js';
import { AppError } from '../middleware/errorHandler.js';
import { workflowService } from './workflow.service.js';

export const evcService = {
  /**
   * Check for scheduling conflicts on the target date for committee lead, members, or institution
   */
  async checkConflicts(visitDate, committeeLead, committeeMembers = [], institutionId, excludeVisitId = null) {
    const targetDate = new Date(visitDate);
    // Standardize to start and end of that day in UTC
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const baseQuery = {
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled'] },
    };

    if (excludeVisitId) {
      baseQuery.id = { $ne: excludeVisitId };
    }

    // 1. Committee Lead conflict
    const leadConflict = await EVCVisit.findOne({
      ...baseQuery,
      $or: [{ committeeLead }, { committeeMembers: committeeLead }],
    });

    if (leadConflict) {
      throw new AppError(
        `Scheduling Conflict: Committee Lead '${committeeLead}' is already assigned to inspection at '${leadConflict.institutionName}' on ${startOfDay.toISOString().split('T')[0]}.`,
        409
      );
    }

    // 2. Committee Members conflict
    if (committeeMembers && committeeMembers.length > 0) {
      const memberConflict = await EVCVisit.findOne({
        ...baseQuery,
        $or: [
          { committeeLead: { $in: committeeMembers } },
          { committeeMembers: { $in: committeeMembers } },
        ],
      });

      if (memberConflict) {
        const conflictingMember = committeeMembers.find(
          (m) => memberConflict.committeeMembers.includes(m) || memberConflict.committeeLead === m
        );
        throw new AppError(
          `Scheduling Conflict: Committee Member '${conflictingMember}' is already assigned to visit at '${memberConflict.institutionName}' on ${startOfDay.toISOString().split('T')[0]}.`,
          409
        );
      }
    }

    // 3. Institution conflict (already booked on same date)
    if (institutionId) {
      const instConflict = await EVCVisit.findOne({
        ...baseQuery,
        institutionId,
      });

      if (instConflict) {
        throw new AppError(
          `Scheduling Conflict: Institution '${instConflict.institutionName}' already has an inspection scheduled on ${startOfDay.toISOString().split('T')[0]}.`,
          409
        );
      }
    }
  },

  /**
   * List EVC visits with role-based scoping
   */
  async getVisits(query = {}, actorUser) {
    const filter = {};

    if (actorUser.role === ROLES.INSTITUTION) {
      filter.institutionId = actorUser.institutionId;
    } else if (query.institutionId) {
      filter.institutionId = query.institutionId;
    }

    if (query.applicationId) {
      filter.applicationId = query.applicationId;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    return EVCVisit.find(filter).sort({ visitDate: 1 });
  },

  /**
   * Schedule a new EVC inspection visit
   */
  async scheduleVisit(data, actorUser) {
    if (!data.visitDate) throw new AppError('Visit date is required', 400);
    if (!data.committeeLead) throw new AppError('Committee lead is required', 400);

    let institutionId = data.institutionId;
    let institutionName = data.institutionName;
    let application = null;

    if (data.applicationId) {
      application = await Application.findOne({
        $or: [{ id: data.applicationId }, { applicationNumber: data.applicationId }],
      });
      if (application) {
        institutionId = institutionId || application.institutionId;
        institutionName = institutionName || application.institutionName;
      }
    }

    if (!institutionId) {
      throw new AppError('Institution ID is required', 400);
    }

    // Run conflict detection
    await this.checkConflicts(
      data.visitDate,
      data.committeeLead,
      data.committeeMembers || [],
      institutionId
    );

    let id = data.id;
    if (!id) {
      let candidateId;
      let exists = true;
      let counter = 0;
      while (exists && counter < 10) {
        candidateId = `EVC-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
        exists = await EVCVisit.exists({ id: candidateId });
        counter++;
      }
      id = candidateId;
    }

    const newVisit = new EVCVisit({
      id,
      applicationId: data.applicationId || 'APP-2026-0041',
      institutionId,
      institutionName: institutionName || 'Technical Institution',
      visitDate: new Date(data.visitDate),
      status: data.status || 'Scheduled',
      committeeLead: data.committeeLead,
      committeeMembers: data.committeeMembers || [data.committeeLead],
      inspectionScope: data.inspectionScope || 'Physical infrastructure and laboratory equipment validation',
      venueAddress: data.venueAddress || 'Campus Premises',
      reportSubmitted: false,
    });

    await newVisit.save();

    // Advance application stage to EVC_SCHEDULED if applicable
    if (application && application.currentStage === WORKFLOW_STAGES.SCRUTINY) {
      try {
        await workflowService.executeTransition(application, WORKFLOW_STAGES.EVC_SCHEDULED, {
          notes: `EVC on-site inspection visit scheduled for ${new Date(data.visitDate).toISOString().split('T')[0]}. Lead: ${data.committeeLead}`,
          action: 'EVC Visit Scheduled',
          actorUser,
        });
      } catch (err) {
        console.warn(`[EVC] Could not auto-advance application stage: ${err.message}`);
      }
    }

    return newVisit;
  },

  /**
   * Reschedule an existing EVC visit
   */
  async rescheduleVisit(id, { newVisitDate, reason }, actorUser) {
    if (!newVisitDate) throw new AppError('New visit date is required', 400);
    if (!reason) throw new AppError('Reason for rescheduling is required', 400);

    const visit = await EVCVisit.findOne({ id });
    if (!visit) throw new AppError(`EVC visit not found: ${id}`, 404);

    // Check conflicts for the new date
    await this.checkConflicts(
      newVisitDate,
      visit.committeeLead,
      visit.committeeMembers,
      visit.institutionId,
      visit.id
    );

    const previousDate = visit.visitDate;
    visit.visitDate = new Date(newVisitDate);
    visit.status = 'Rescheduled';
    visit.rescheduleHistory.push({
      previousDate,
      newDate: new Date(newVisitDate),
      reason,
      rescheduledBy: actorUser.name || 'EVC Coordinator',
      timestamp: new Date(),
    });

    await visit.save();
    return visit;
  },

  /**
   * Submit EVC inspection report and outcome
   */
  async submitReport(id, { outcome, inspectionNotes }, actorUser) {
    const visit = await EVCVisit.findOne({ id });
    if (!visit) throw new AppError(`EVC visit not found: ${id}`, 404);

    visit.reportSubmitted = true;
    visit.outcome = outcome || 'Satisfactory - Full compliance documented';
    visit.status = 'Completed';
    await visit.save();

    // Optionally advance application stage to EVC_COMPLETED
    if (visit.applicationId) {
      const app = await Application.findOne({
        $or: [{ id: visit.applicationId }, { applicationNumber: visit.applicationId }],
      });
      if (app && app.currentStage === WORKFLOW_STAGES.EVC_SCHEDULED) {
        try {
          await workflowService.executeTransition(app, WORKFLOW_STAGES.EVC_COMPLETED, {
            notes: `EVC inspection completed. Outcome: ${visit.outcome}. ${inspectionNotes || ''}`,
            action: 'EVC Inspection Completed',
            actorUser,
          });
        } catch (err) {
          console.warn(`[EVC] Could not auto-advance application to EVC_COMPLETED: ${err.message}`);
        }
      }
    }

    return visit;
  },
};

export default evcService;
