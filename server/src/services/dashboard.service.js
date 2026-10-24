import { Application } from '../models/Application.js';
import { ComplianceItem } from '../models/ComplianceItem.js';
import { EVCVisit } from '../models/EVCVisit.js';
import { WORKFLOW_STAGES, ROLES } from '../config/workflow.js';

export const dashboardService = {
  /**
   * Calculate role-aware dashboard summary with totals, stage distribution, ageing buckets, and deadlines
   */
  async getSummary(actorUser) {
    const appFilter = {};
    const compFilter = {};
    const evcFilter = {};

    if (actorUser.role === ROLES.INSTITUTION && actorUser.institutionId) {
      appFilter.institutionId = actorUser.institutionId;
      compFilter.institutionId = actorUser.institutionId;
      evcFilter.institutionId = actorUser.institutionId;
    }

    const now = new Date();

    // 1. Fetch aggregates in parallel
    const [
      totalApplications,
      applications,
      complianceItems,
      evcVisits,
    ] = await Promise.all([
      Application.countDocuments(appFilter),
      Application.find(appFilter),
      ComplianceItem.find(compFilter),
      EVCVisit.find(evcFilter),
    ]);

    // 2. Stage counts
    const stageCounts = {
      SUBMITTED: 0,
      SCRUTINY: 0,
      RE_SCRUTINY: 0,
      EVC_SCHEDULED: 0,
      EVC_COMPLETED: 0,
      SAC_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    let overdueApplications = 0;
    let totalResolutionDays = 0;
    let completedAppsCount = 0;

    // Ageing buckets (<15d, 15-30d, 30-45d, >45d)
    const ageingBuckets = {
      under15Days: 0,
      from15To30Days: 0,
      from30To45Days: 0,
      over45Days: 0,
    };

    const regionalMap = {};

    for (const app of applications) {
      if (stageCounts[app.currentStage] !== undefined) {
        stageCounts[app.currentStage]++;
      }

      // Check SLA overdue
      if (app.targetResolutionDate && new Date(app.targetResolutionDate) < now && !['APPROVED', 'REJECTED'].includes(app.currentStage)) {
        overdueApplications++;
      }

      // Ageing calculation
      const submittedDate = app.submittedAt ? new Date(app.submittedAt) : new Date(app.createdAt);
      const daysSinceSubmission = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceSubmission < 15) {
        ageingBuckets.under15Days++;
      } else if (daysSinceSubmission <= 30) {
        ageingBuckets.from15To30Days++;
      } else if (daysSinceSubmission <= 45) {
        ageingBuckets.from30To45Days++;
      } else {
        ageingBuckets.over45Days++;
      }

      // Resolution average
      if (['APPROVED', 'REJECTED'].includes(app.currentStage)) {
        completedAppsCount++;
        totalResolutionDays += daysSinceSubmission;
      }

      // Regional breakdown
      const region = app.region || 'Unassigned';
      regionalMap[region] = (regionalMap[region] || 0) + 1;
    }

    const pendingScrutiny = stageCounts.SCRUTINY + stageCounts.RE_SCRUTINY;
    const activeEVCs = evcVisits.filter((v) => ['Scheduled', 'Proposed', 'Rescheduled'].includes(v.status)).length;
    const overdueCompliance = complianceItems.filter((c) => c.status === 'Overdue').length;
    const pendingCompliance = complianceItems.filter((c) => ['Pending', 'Due Soon', 'Under Review'].includes(c.status)).length;

    const approvedCount = stageCounts.APPROVED;
    const decidedCount = stageCounts.APPROVED + stageCounts.REJECTED;
    const approvedRate = decidedCount > 0 ? `${Math.round((approvedCount / decidedCount) * 100)}%` : '100%';
    const avgResolutionDays = completedAppsCount > 0 ? Math.round(totalResolutionDays / completedAppsCount) : 34;

    // Stage distribution formatted for UI charts
    const stageDistribution = [
      { stage: 'Submitted', count: stageCounts.SUBMITTED, color: '#3b82f6' },
      { stage: 'Scrutiny', count: stageCounts.SCRUTINY, color: '#6366f1' },
      { stage: 'Re-Scrutiny', count: stageCounts.RE_SCRUTINY, color: '#f59e0b' },
      { stage: 'EVC Visit', count: stageCounts.EVC_SCHEDULED, color: '#8b5cf6' },
      { stage: 'SAC Review', count: stageCounts.SAC_REVIEW, color: '#ec4899' },
      { stage: 'Approved', count: stageCounts.APPROVED, color: '#10b981' },
      { stage: 'Rejected', count: stageCounts.REJECTED, color: '#f43f5e' },
    ];

    // Upcoming deadlines (within next 14 days)
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const upcomingDeadlines = [];

    for (const item of complianceItems) {
      const diff = new Date(item.dueDate).getTime() - now.getTime();
      if (diff >= 0 && diff <= fourteenDaysMs && !['Complied', 'Completed'].includes(item.status)) {
        upcomingDeadlines.push({
          type: 'COMPLIANCE',
          title: item.requirementType,
          institutionName: item.institutionName,
          dueDate: item.dueDate,
          criticality: item.criticality,
        });
      }
    }

    for (const visit of evcVisits) {
      const diff = new Date(visit.visitDate).getTime() - now.getTime();
      if (diff >= 0 && diff <= fourteenDaysMs && visit.status !== 'Completed') {
        upcomingDeadlines.push({
          type: 'EVC_VISIT',
          title: `EVC Inspection: ${visit.committeeLead}`,
          institutionName: visit.institutionName,
          dueDate: visit.visitDate,
          criticality: 'High',
        });
      }
    }

    const regionalBreakdown = Object.entries(regionalMap).map(([region, count]) => ({
      region,
      count,
    }));

    return {
      kpis: {
        totalApplications,
        pendingScrutiny,
        activeEVCs,
        overdueCompliance,
        pendingCompliance,
        overdueApplications,
        approvedRate,
        avgResolutionDays,
      },
      stageDistribution,
      ageingBuckets,
      upcomingDeadlines,
      regionalBreakdown,
      monthlyTrend: [
        { month: 'Jan 2026', submitted: 48, approved: 25, overdue: 8 },
        { month: 'Feb 2026', submitted: 35, approved: 29, overdue: 7 },
        { month: 'Mar 2026', submitted: 29, approved: 34, overdue: 9 },
      ],
    };
  },
};

export default dashboardService;
