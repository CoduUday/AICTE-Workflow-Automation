import { ComplianceItem } from '../models/ComplianceItem.js';
import { Application } from '../models/Application.js';
import { Alert } from '../models/Alert.js';
import { alertService } from '../services/alert.service.js';
import { ROLES } from '../config/workflow.js';

/**
 * Scheduled Reminder & Deadline Monitoring Job
 * Handles:
 * 1. Due-soon reminders (< 7 days)
 * 2. Overdue compliance & application deadlines
 * 3. Overdue escalations (> 3 days past due)
 * 4. Deduplication via stable dedupKey
 * 5. Server restart recovery
 */
export const runScheduledReminderCheck = async () => {
  const now = new Date();
  console.log(`[ReminderJob] Running deadline check at ${now.toISOString()}...`);

  let generatedAlerts = 0;
  let escalatedAlerts = 0;

  try {
    // 1. Process Compliance Deadlines
    const complianceItems = await ComplianceItem.find({
      status: { $in: ['Pending', 'Due Soon', 'Overdue'] },
    });

    for (const item of complianceItems) {
      const dueDate = new Date(item.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Overdue Check
      if (diffDays < 0) {
        const daysOverdue = Math.abs(diffDays);
        if (item.status !== 'Overdue') {
          item.status = 'Overdue';
          await item.save();
        }

        const dedupKey = `OVERDUE_COMP_${item.id}_${item.dueDate.toISOString().split('T')[0]}`;
        const { isDuplicate, alert } = await alertService.createAlert({
          recipientRole: ROLES.INSTITUTION,
          institutionId: item.institutionId,
          institutionName: item.institutionName,
          applicationId: item.applicationId,
          complianceId: item.id,
          type: 'CRITICAL',
          title: `Overdue Compliance: ${item.requirementType}`,
          message: `${item.institutionName} is ${daysOverdue} day(s) overdue for '${item.requirementType}'. Immediate submission required.`,
          severity: 'danger',
          dueAt: item.dueDate,
          dedupKey,
        });

        if (!isDuplicate) generatedAlerts++;

        // Escalation Check (> 3 days overdue)
        if (daysOverdue >= 3 && alert && !alert.escalated) {
          await alertService.escalateOverdueAlert(alert);
          escalatedAlerts++;
        }
      }
      // Due Soon Check (<= 7 days remaining)
      else if (diffDays <= 7) {
        if (item.status === 'Pending') {
          item.status = 'Due Soon';
          await item.save();
        }

        const dedupKey = `DUESOON_COMP_${item.id}_${item.dueDate.toISOString().split('T')[0]}`;
        const { isDuplicate } = await alertService.createAlert({
          recipientRole: ROLES.INSTITUTION,
          institutionId: item.institutionId,
          institutionName: item.institutionName,
          applicationId: item.applicationId,
          complianceId: item.id,
          type: 'WARNING',
          title: `Upcoming Deadline: ${item.requirementType}`,
          message: `'${item.requirementType}' is due in ${diffDays} day(s) for ${item.institutionName}.`,
          severity: 'warning',
          dueAt: item.dueDate,
          dedupKey,
        });

        if (!isDuplicate) generatedAlerts++;
      }
    }

    // 2. Process Application Resolution SLA Deadlines
    const activeApplications = await Application.find({
      currentStage: { $nin: ['APPROVED', 'REJECTED'] },
      targetResolutionDate: { $exists: true, $ne: null },
    });

    for (const app of activeApplications) {
      const targetDate = new Date(app.targetResolutionDate);
      if (now > targetDate) {
        const dedupKey = `OVERDUE_APP_SLA_${app.id}_${app.targetResolutionDate.toISOString().split('T')[0]}`;
        const { isDuplicate, alert } = await alertService.createAlert({
          recipientRole: ROLES.SCRUTINY_OFFICER,
          institutionId: app.institutionId,
          institutionName: app.institutionName,
          applicationId: app.id,
          type: 'CRITICAL',
          title: `SLA Overdue: Application ${app.applicationNumber}`,
          message: `Application ${app.applicationNumber} has breached the resolution SLA threshold of ${app.targetResolutionDate.toISOString().split('T')[0]}.`,
          severity: 'danger',
          dueAt: app.targetResolutionDate,
          dedupKey,
        });

        if (!isDuplicate) generatedAlerts++;

        const daysOverdue = Math.ceil((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue >= 3 && alert && !alert.escalated) {
          await alertService.escalateOverdueAlert(alert);
          escalatedAlerts++;
        }
      }
    }

    console.log(
      `[ReminderJob] Completed. Generated: ${generatedAlerts} alerts, Escalations: ${escalatedAlerts}.`
    );
  } catch (error) {
    console.error(`[ReminderJob] Error executing reminder job: ${error.message}`);
  }
};

let reminderInterval = null;

/**
 * Initialize reminder scheduler and execute restart recovery
 */
export const initReminderScheduler = (intervalMs = 60 * 60 * 1000) => {
  // Restart recovery: immediate run on startup
  runScheduledReminderCheck();

  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  reminderInterval = setInterval(runScheduledReminderCheck, intervalMs);
  return reminderInterval;
};

export const stopReminderScheduler = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
};
