/**
 * AICTE Approval Workflow Configuration
 * Configurable stages, role permissions, and transition matrix
 * aligned with AICTE Approval Process Handbook (APH).
 */

export const WORKFLOW_STAGES = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  SCRUTINY: 'SCRUTINY',
  RE_SCRUTINY: 'RE_SCRUTINY',
  EVC_SCHEDULED: 'EVC_SCHEDULED',
  EVC_COMPLETED: 'EVC_COMPLETED',
  SAC_REVIEW: 'SAC_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

export const STAGE_METADATA = Object.freeze({
  SUBMITTED: { name: 'Application Submitted', order: 1, color: 'blue' },
  SCRUTINY: { name: 'Scrutiny Committee Review', order: 2, color: 'indigo' },
  RE_SCRUTINY: { name: 'Re-Scrutiny (Deficiencies)', order: 3, color: 'amber' },
  EVC_SCHEDULED: { name: 'EVC Visit Scheduled', order: 4, color: 'purple' },
  EVC_COMPLETED: { name: 'EVC Inspection Completed', order: 5, color: 'teal' },
  SAC_REVIEW: { name: 'Standing Appeals Review', order: 6, color: 'orange' },
  APPROVED: { name: 'Executive Approval Granted', order: 7, color: 'emerald' },
  REJECTED: { name: 'Application Rejected', order: 8, color: 'rose' },
});

export const ROLES = Object.freeze({
  INSTITUTION: 'institution',
  SCRUTINY_OFFICER: 'scrutiny_officer',
  EVC_COORDINATOR: 'evc_coordinator',
  COMMITTEE_OFFICER: 'committee_officer',
  ADMIN: 'admin',
});

/**
 * Configurable transition matrix defining allowed next stages and required roles.
 */
export const TRANSITION_MATRIX = Object.freeze({
  SUBMITTED: [
    { target: 'SCRUTINY', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'Under Scrutiny' },
    { target: 'REJECTED', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'Rejected' },
  ],
  SCRUTINY: [
    { target: 'RE_SCRUTINY', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'Deficiencies Pending' },
    { target: 'EVC_SCHEDULED', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'EVC Pending' },
    { target: 'APPROVED', roles: ['admin'], defaultStatus: 'Approved' },
    { target: 'REJECTED', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'Rejected' },
  ],
  RE_SCRUTINY: [
    // Institution is allowed to resubmit clarified application back to SCRUTINY
    { target: 'SCRUTINY', roles: ['institution', 'scrutiny_officer', 'admin'], defaultStatus: 'Resubmitted / Under Review' },
    { target: 'EVC_SCHEDULED', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'EVC Pending' },
    { target: 'REJECTED', roles: ['scrutiny_officer', 'admin'], defaultStatus: 'Rejected' },
  ],
  EVC_SCHEDULED: [
    { target: 'EVC_COMPLETED', roles: ['evc_coordinator', 'admin'], defaultStatus: 'Inspection Done' },
    { target: 'RE_SCRUTINY', roles: ['evc_coordinator', 'admin'], defaultStatus: 'Deficiencies Pending' },
    { target: 'REJECTED', roles: ['admin'], defaultStatus: 'Rejected' },
  ],
  EVC_COMPLETED: [
    { target: 'SAC_REVIEW', roles: ['committee_officer', 'admin'], defaultStatus: 'Under SAC Hearing' },
    { target: 'APPROVED', roles: ['committee_officer', 'admin'], defaultStatus: 'Approved' },
    { target: 'REJECTED', roles: ['committee_officer', 'admin'], defaultStatus: 'Rejected' },
  ],
  SAC_REVIEW: [
    { target: 'APPROVED', roles: ['committee_officer', 'admin'], defaultStatus: 'Approved' },
    { target: 'REJECTED', roles: ['committee_officer', 'admin'], defaultStatus: 'Rejected' },
    { target: 'SCRUTINY', roles: ['committee_officer', 'admin'], defaultStatus: 'Remanded for Re-Scrutiny' },
  ],
  APPROVED: [
    // Terminal state, only admin can revoke or remand if needed
    { target: 'RE_SCRUTINY', roles: ['admin'], defaultStatus: 'Approval Under Review' },
  ],
  REJECTED: [
    // On formal appeal, application can be referred to SAC review
    { target: 'SAC_REVIEW', roles: ['committee_officer', 'admin'], defaultStatus: 'Under Appeal Hearing' },
  ],
});
