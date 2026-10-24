// Fictional realistic dataset for AICTE Workflow Automation System
// Used as default seed and local fallback when backend is not connected.
// Perfectly aligned with docs/API_CONTRACT.md

export const MOCK_ROLES = {
  ADMIN: 'admin',
  SCRUTINY_OFFICER: 'scrutiny_officer',
  EVC_COORDINATOR: 'evc_coordinator',
  COMMITTEE_OFFICER: 'committee_officer',
  INSTITUTION: 'institution'
};

export const MOCK_USERS = [
  {
    id: 'usr-1',
    name: 'Dr. Rajesh Sharma',
    email: 'admin.rajesh@aicte-india.org',
    role: MOCK_ROLES.ADMIN,
    designation: 'Member Secretary & Admin Director',
    department: 'Approval Bureau, AICTE HQ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'usr-2',
    name: 'Prof. Ananya Sen',
    email: 'reviewer.sen@aicte-india.org',
    role: MOCK_ROLES.SCRUTINY_OFFICER,
    designation: 'Senior Scrutiny Officer',
    department: 'Western Regional Office (WRO)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'usr-3',
    name: 'Dr. Meenakshi Iyer',
    email: 'evc.iyer@aicte-india.org',
    role: MOCK_ROLES.EVC_COORDINATOR,
    designation: 'Inspection Cell Coordinator',
    department: 'Expert Committee Operations',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'usr-4',
    name: 'Justice (Retd.) V. K. Rao',
    email: 'sac.rao@aicte-india.org',
    role: MOCK_ROLES.COMMITTEE_OFFICER,
    designation: 'Standing Appellate Committee Chair',
    department: 'Appeals & Executive Bureau',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'usr-5',
    name: 'Dr. K. S. Sundaram',
    email: 'principal@dit-edu.in',
    role: MOCK_ROLES.INSTITUTION,
    designation: 'Principal & Authorized Signatory',
    institutionName: 'Delhi Institute of Technology & Management',
    institutionId: 'INST-2024-DEL-089',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
  }
];

export const WORKFLOW_STAGES = [
  { id: 'SUBMITTED', name: 'Application Submitted', order: 1, color: '#3b82f6' },
  { id: 'SCRUTINY', name: 'Scrutiny Committee Review', order: 2, color: '#6366f1' },
  { id: 'RE_SCRUTINY', name: 'Re-Scrutiny (Deficiencies)', order: 3, color: '#f59e0b' },
  { id: 'EVC_SCHEDULED', name: 'EVC Visit Scheduled', order: 4, color: '#8b5cf6' },
  { id: 'EVC_COMPLETED', name: 'EVC Inspection Completed', order: 5, color: '#0d9488' },
  { id: 'SAC_REVIEW', name: 'Standing Appeals Review', order: 6, color: '#ec4899' },
  { id: 'APPROVED', name: 'Executive Approval Granted', order: 7, color: '#10b981' },
  { id: 'REJECTED', name: 'Application Rejected', order: 8, color: '#ef4444' }
];

// Permitted stage transition state machine per API_CONTRACT.md
export const PERMITTED_TRANSITIONS = {
  SUBMITTED: ['SCRUTINY', 'REJECTED'],
  SCRUTINY: ['RE_SCRUTINY', 'EVC_SCHEDULED', 'APPROVED', 'REJECTED'],
  RE_SCRUTINY: ['SCRUTINY', 'EVC_SCHEDULED', 'REJECTED'],
  EVC_SCHEDULED: ['EVC_COMPLETED', 'RE_SCRUTINY'],
  EVC_COMPLETED: ['SAC_REVIEW', 'APPROVED', 'REJECTED'],
  SAC_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: ['SAC_REVIEW']
};

export const STAGE_ROLE_PERMISSIONS = {
  SUBMITTED: ['scrutiny_officer', 'admin'],
  SCRUTINY: ['scrutiny_officer', 'admin'],
  RE_SCRUTINY: ['scrutiny_officer', 'admin'],
  EVC_SCHEDULED: ['evc_coordinator', 'admin'],
  EVC_COMPLETED: ['committee_officer', 'admin'],
  SAC_REVIEW: ['committee_officer', 'admin'],
  APPROVED: ['admin'],
  REJECTED: ['committee_officer', 'admin']
};

export const INITIAL_APPLICATIONS = [
  {
    id: 'APP-2026-0041',
    applicationNumber: 'AICTE/2026/0041',
    institutionId: 'INST-2024-DEL-089',
    institutionName: 'Delhi Institute of Technology & Management',
    region: 'North-West (NWRO)',
    academicYear: '2026-2027',
    applicationType: 'Extension of Approval (EOA) + New Course (AI & DS)',
    currentStage: 'EVC_SCHEDULED',
    status: 'In Progress',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: '2026-02-10T10:30:00Z',
    targetResolutionDate: '2026-04-15T00:00:00Z',
    intakeCapacityRequested: 180,
    infrastructureAreaSqM: 14200,
    landTenureType: 'Owned (Perpetual Lease)',
    deficiencyCount: 1,
    officerComments: 'Scrutiny deficiencies addressed. Physical verification scheduled for laboratory infrastructure.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Application Submitted Online',
        actor: 'Dr. K. S. Sundaram',
        role: 'institution',
        timestamp: '2026-02-10T10:30:00Z',
        notes: 'Submitted initial self-disclosure and affidavit forms along with portal fee receipt.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Deficiency Notice Issued',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2026-02-22T14:15:00Z',
        notes: 'Fire safety certificate renewal copy was past 3-year threshold; re-scrutiny requested.'
      },
      {
        stage: 'RE_SCRUTINY',
        action: 'Deficiencies Cleared',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2026-03-05T11:00:00Z',
        notes: 'Institution uploaded renewed Fire Safety NOC and updated building occupancy certificate.'
      },
      {
        stage: 'EVC_SCHEDULED',
        action: 'Expert Visit Committee Scheduled',
        actor: 'Dr. Meenakshi Iyer',
        role: 'evc_coordinator',
        timestamp: '2026-03-12T16:00:00Z',
        notes: '3-member inspection team scheduled for on-site physical infrastructure verification.'
      }
    ],
    documents: [
      { id: 'doc-001', name: 'Fire Safety NOC Renewal.pdf', size: '2.4 MB', uploadDate: '2026-03-04', status: 'Verified', documentType: 'Statutory NOC', url: '#' },
      { id: 'doc-002', name: 'Land Registration & Title Deed.pdf', size: '14.1 MB', uploadDate: '2026-02-09', status: 'Verified', documentType: 'Land Document', url: '#' },
      { id: 'doc-003', name: 'Faculty Cadre Ratio Declaration.xlsx', size: '890 KB', uploadDate: '2026-02-09', status: 'Pending Review', documentType: 'Academic Audit', url: '#' },
      { id: 'doc-004', name: 'AI_DS_Lab_Equipment_Invoice.pdf', size: '5.2 MB', uploadDate: '2026-02-10', status: 'Verified', documentType: 'Laboratory Spec', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0042',
    applicationNumber: 'AICTE/2026/0042',
    institutionId: 'INST-2024-BLR-012',
    institutionName: 'Karnataka Institute of Advanced Robotics & AI',
    region: 'South-West (SWRO)',
    academicYear: '2026-2027',
    applicationType: 'New Technical Institution Setup',
    currentStage: 'SCRUTINY',
    status: 'In Progress',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: '2026-03-01T09:15:00Z',
    targetResolutionDate: '2026-05-01T00:00:00Z',
    intakeCapacityRequested: 300,
    infrastructureAreaSqM: 22000,
    landTenureType: 'Registered Lease (33 Years)',
    deficiencyCount: 0,
    officerComments: 'Under initial scrutiny by regional evaluation panel.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Fresh Application Lodged',
        actor: 'Dr. H. V. Gowda',
        role: 'institution',
        timestamp: '2026-03-01T09:15:00Z',
        notes: 'Proposal for establishment of autonomous technological campus.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Assigned to Scrutiny Panel',
        actor: 'Dr. Rajesh Sharma',
        role: 'admin',
        timestamp: '2026-03-04T12:00:00Z',
        notes: 'Under scrutiny by panel member 2.'
      }
    ],
    documents: [
      { id: 'doc-005', name: 'Master Plan & Architectural Approval.pdf', size: '18.6 MB', uploadDate: '2026-03-01', status: 'Under Review', documentType: 'Building Plan', url: '#' },
      { id: 'doc-006', name: 'Bank Guarantee FDR AICTE Joint Account.pdf', size: '1.2 MB', uploadDate: '2026-03-01', status: 'Verified', documentType: 'Financial Security', url: '#' },
      { id: 'doc-007', name: 'Governing Council Resolution.pdf', size: '940 KB', uploadDate: '2026-03-01', status: 'Under Review', documentType: 'Governance', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0043',
    applicationNumber: 'AICTE/2026/0043',
    institutionId: 'INST-2024-PUN-055',
    institutionName: 'Maharashtra Polytechnic & Vocational Institute',
    region: 'Western (WRO)',
    academicYear: '2025-2026',
    applicationType: 'Extension of Approval (EOA)',
    currentStage: 'APPROVED',
    status: 'Approved',
    assignedTo: 'Dr. Rajesh Sharma',
    assignedToId: 'usr-1',
    submittedAt: '2025-11-15T08:00:00Z',
    targetResolutionDate: '2026-01-15T00:00:00Z',
    intakeCapacityRequested: 240,
    infrastructureAreaSqM: 11500,
    landTenureType: 'Owned',
    deficiencyCount: 0,
    officerComments: 'Formal Letter of Approval issued for academic year 2025-26 with zero deficiencies.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'EOA Application Submitted',
        actor: 'Prof. S. Patil',
        role: 'institution',
        timestamp: '2025-11-15T08:00:00Z',
        notes: 'Annual mandatory disclosure with zero change in sanctioned intake.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Scrutiny Completed (Zero Deficiency)',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2025-12-05T16:00:00Z',
        notes: 'All compliance records in full accordance with APH standards.'
      },
      {
        stage: 'APPROVED',
        action: 'EOA Approval Letter Generated',
        actor: 'Dr. Rajesh Sharma',
        role: 'admin',
        timestamp: '2026-01-10T11:30:00Z',
        notes: 'Formal Letter of Approval issued.'
      }
    ],
    documents: [
      { id: 'doc-008', name: 'Audited Financial Statements 2024-25.pdf', size: '4.8 MB', uploadDate: '2025-11-15', status: 'Verified', documentType: 'Financial Statement', url: '#' },
      { id: 'doc-009', name: 'Mandatory Disclosure Web Portal URL.pdf', size: '210 KB', uploadDate: '2025-11-15', status: 'Verified', documentType: 'Statutory Disclosure', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0044',
    applicationNumber: 'AICTE/2026/0044',
    institutionId: 'INST-2024-KOL-021',
    institutionName: 'Eastern College of Engineering & Bio-Informatics',
    region: 'Eastern (ERO)',
    academicYear: '2026-2027',
    applicationType: 'Increase in Sanctioned Intake',
    currentStage: 'RE_SCRUTINY',
    status: 'Deficient',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: '2026-01-18T11:45:00Z',
    targetResolutionDate: '2026-02-28T00:00:00Z', // Overdue
    intakeCapacityRequested: 120,
    infrastructureAreaSqM: 9800,
    landTenureType: 'Owned',
    deficiencyCount: 2,
    officerComments: 'Cadre ratio deficit of 4 Assistant Professors and structural setback compliance pending.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Application Submitted',
        actor: 'Dr. B. K. Roy',
        role: 'institution',
        timestamp: '2026-01-18T11:45:00Z',
        notes: 'Request for addition of 60 seats in CSE and 60 in ECE.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Deficiency Identified',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2026-02-02T15:00:00Z',
        notes: 'Faculty Cadre ratio falls short of 1:15 requirement. Laboratory floor plan lacks requisite safety setbacks.'
      }
    ],
    documents: [
      { id: 'doc-010', name: 'Faculty List & Form 16.pdf', size: '6.1 MB', uploadDate: '2026-01-18', status: 'Deficient', documentType: 'Faculty Roster', url: '#' },
      { id: 'doc-011', name: 'Floor Plans with Setback Marks.pdf', size: '11.5 MB', uploadDate: '2026-01-18', status: 'Deficient', documentType: 'Architectural Blueprint', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0045',
    applicationNumber: 'AICTE/2026/0045',
    institutionId: 'INST-2024-HYD-078',
    institutionName: 'Telangana Institute of Pharmaceutical Sciences',
    region: 'South-Central (SCRO)',
    academicYear: '2026-2027',
    applicationType: 'Closure of Non-Viable Course',
    currentStage: 'SAC_REVIEW',
    status: 'In Progress',
    assignedTo: 'Justice (Retd.) V. K. Rao',
    assignedToId: 'usr-4',
    submittedAt: '2026-01-20T14:10:00Z',
    targetResolutionDate: '2026-03-30T00:00:00Z',
    intakeCapacityRequested: 60,
    infrastructureAreaSqM: 8500,
    landTenureType: 'Owned',
    deficiencyCount: 1,
    officerComments: 'Student migration redeployment hearing scheduled with appellate committee.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Closure Application Submitted',
        actor: 'Dr. M. Reddy',
        role: 'institution',
        timestamp: '2026-01-20T14:10:00Z',
        notes: 'NOC from State Government and Affiliating University attached.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Clarification Needed on Student Redeployment',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2026-02-05T10:00:00Z',
        notes: 'Dispute regarding transfer of 2nd year students to neighboring college.'
      },
      {
        stage: 'SAC_REVIEW',
        action: 'Referred to Standing Appellate Committee',
        actor: 'Dr. Rajesh Sharma',
        role: 'admin',
        timestamp: '2026-02-28T16:20:00Z',
        notes: 'Appellate hearing scheduled with institutional leadership.'
      }
    ],
    documents: [
      { id: 'doc-012', name: 'State Govt NOC for Closure.pdf', size: '1.4 MB', uploadDate: '2026-01-20', status: 'Verified', documentType: 'Government NOC', url: '#' },
      { id: 'doc-013', name: 'Student Redeployment Plan & Undertaking.pdf', size: '3.1 MB', uploadDate: '2026-02-12', status: 'Under Review', documentType: 'Student Welfare Undertaking', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0046',
    applicationNumber: 'AICTE/2026/0046',
    institutionId: 'INST-2024-JAIPUR-009',
    institutionName: 'Rajasthan Academy of Technology & Design',
    region: 'North-West (NWRO)',
    academicYear: '2026-2027',
    applicationType: 'Introduction of Emerging Areas',
    currentStage: 'SUBMITTED',
    status: 'Pending',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: '2026-03-15T11:00:00Z',
    targetResolutionDate: '2026-04-30T00:00:00Z',
    intakeCapacityRequested: 60,
    infrastructureAreaSqM: 10200,
    landTenureType: 'Owned Freehold',
    deficiencyCount: 0,
    officerComments: 'Freshly queued for preliminary scrutiny.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Application Submitted Online',
        actor: 'Dr. R. K. Meena',
        role: 'institution',
        timestamp: '2026-03-15T11:00:00Z',
        notes: 'Request for introduction of Cyber Security & IoT B.Tech program.'
      }
    ],
    documents: [
      { id: 'doc-014', name: 'Affiliation Letter from State Technical University.pdf', size: '2.1 MB', uploadDate: '2026-03-15', status: 'Pending Review', documentType: 'University Affiliation', url: '#' },
      { id: 'doc-015', name: 'AICTE Joint Account Guarantee.pdf', size: '1.9 MB', uploadDate: '2026-03-15', status: 'Pending Review', documentType: 'Financial Guarantee', url: '#' }
    ]
  },
  {
    id: 'APP-2026-0047',
    applicationNumber: 'AICTE/2026/0047',
    institutionId: 'INST-2024-CHG-034',
    institutionName: 'Punjab Institute of Nanotechnology & Advanced Physics',
    region: 'North-West (NWRO)',
    academicYear: '2024-2025',
    applicationType: 'New Technical Institution Setup',
    currentStage: 'REJECTED',
    status: 'Rejected',
    assignedTo: 'Justice (Retd.) V. K. Rao',
    assignedToId: 'usr-4',
    submittedAt: '2024-10-10T14:00:00Z',
    targetResolutionDate: '2024-12-15T00:00:00Z',
    intakeCapacityRequested: 180,
    infrastructureAreaSqM: 13500,
    landTenureType: 'Sub-Lease (Unapproved)',
    deficiencyCount: 3,
    officerComments: 'Land title dispute and non-contiguous land parcel prohibited approval under APH rules.',
    stageHistory: [
      {
        stage: 'SUBMITTED',
        action: 'Application Lodged',
        actor: 'Dr. G. S. Sandhu',
        role: 'institution',
        timestamp: '2024-10-10T14:00:00Z',
        notes: 'Application for greenfield technical campus.'
      },
      {
        stage: 'SCRUTINY',
        action: 'Deficiencies Found (Land Title)',
        actor: 'Prof. Ananya Sen',
        role: 'scrutiny_officer',
        timestamp: '2024-10-25T11:00:00Z',
        notes: 'Land deed indicates disputed sub-lease.'
      },
      {
        stage: 'REJECTED',
        action: 'Application Rejected by SAC',
        actor: 'Justice (Retd.) V. K. Rao',
        role: 'committee_officer',
        timestamp: '2024-11-20T16:00:00Z',
        notes: 'Statutory minimum 30-year unencumbered land tenure condition not fulfilled.'
      }
    ],
    documents: [
      { id: 'doc-016', name: 'Disputed Land Sub-lease Deed.pdf', size: '8.4 MB', uploadDate: '2024-10-10', status: 'Deficient', documentType: 'Land Document', url: '#' }
    ]
  }
];

export const INITIAL_COMPLIANCE = [
  {
    id: 'CMP-101',
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    requirementType: 'Fire Safety Certificate & NOC',
    description: 'Submission of 3-year recurring Fire Safety Compliance certificate from Municipal Fire Services.',
    dueDate: '2026-04-05T00:00:00Z',
    status: 'Complied',
    criticality: 'High',
    documentReference: 'Fire_Safety_Renewal_NOC_2026.pdf',
    lastNotifiedAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'CMP-102',
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    requirementType: 'Perpetual Land Lease Undertaking',
    description: 'Registered Lease Agreement renewal document certifying unencumbered possession for min 30 years.',
    dueDate: '2026-03-20T00:00:00Z',
    status: 'Overdue',
    criticality: 'High',
    documentReference: 'Land_Lease_Pending_Draft.pdf',
    lastNotifiedAt: '2026-03-18T08:30:00Z'
  },
  {
    id: 'CMP-103',
    applicationId: 'APP-2026-0044',
    institutionName: 'Eastern College of Engineering & Bio-Informatics',
    requirementType: 'Faculty Cadre Ratio & Aadhaar Biometric Report',
    description: 'Ensure Professor : Associate Professor : Assistant Professor ratio is maintained at 1:2:6 with biometric records.',
    dueDate: '2026-04-12T00:00:00Z',
    status: 'Pending',
    criticality: 'High',
    documentReference: null,
    lastNotifiedAt: '2026-03-10T11:00:00Z'
  },
  {
    id: 'CMP-104',
    applicationId: 'APP-2026-0042',
    institutionName: 'Karnataka Institute of Advanced Robotics & AI',
    requirementType: 'Anti-Ragging Committee & CCTV Coverage Affidavit',
    description: 'Institutional submission of anti-ragging squad composition, helpline notices, and 24x7 gate/corridor CCTV audit.',
    dueDate: '2026-04-28T00:00:00Z',
    status: 'Under Review',
    criticality: 'Medium',
    documentReference: 'Anti_Ragging_Affidavit_2026.pdf',
    lastNotifiedAt: '2026-03-14T10:00:00Z'
  },
  {
    id: 'CMP-105',
    applicationId: 'APP-2026-0043',
    institutionName: 'Maharashtra Polytechnic & Vocational Institute',
    requirementType: 'Internal Complaints Committee (ICC) Annual Report',
    description: 'Mandatory annual report filing regarding gender sensitization and prevention of sexual harassment.',
    dueDate: '2026-05-15T00:00:00Z',
    status: 'Complied',
    criticality: 'Normal',
    documentReference: 'ICC_Annual_Filing_2025_26.pdf',
    lastNotifiedAt: '2026-02-20T14:00:00Z'
  },
  {
    id: 'CMP-106',
    applicationId: 'APP-2026-0045',
    institutionName: 'Telangana Institute of Pharmaceutical Sciences',
    requirementType: 'Student Fee Refund & Migration Compliance Report',
    description: 'Undertaking acknowledging zero retention of original qualification certificates and adherence to refund norms.',
    dueDate: '2026-03-25T00:00:00Z',
    status: 'Overdue',
    criticality: 'High',
    documentReference: null,
    lastNotifiedAt: '2026-03-21T09:00:00Z'
  }
];

export const INITIAL_ALERTS = [
  {
    id: 'ALT-501',
    type: 'CRITICAL',
    title: 'Overdue Compliance: Land Lease Submission',
    message: 'Delhi Institute of Technology & Management has passed the due date for Perpetual Land Lease Renewal.',
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    dueAt: '2026-03-20T00:00:00Z',
    createdAt: '2026-03-21T00:00:00Z',
    read: false,
    severity: 'danger'
  },
  {
    id: 'ALT-502',
    type: 'WARNING',
    title: 'EVC Visit Approaching in 48 Hours',
    message: 'Expert Committee on-site physical inspection scheduled for Delhi Institute on March 28, 2026.',
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    dueAt: '2026-03-28T09:30:00Z',
    createdAt: '2026-03-22T10:00:00Z',
    read: false,
    severity: 'warning'
  },
  {
    id: 'ALT-503',
    type: 'INFO',
    title: 'Re-Scrutiny Deficiencies Response Pending',
    message: 'Eastern College has 7 days remaining to upload rectified Faculty Cadre Ratio affidavits.',
    applicationId: 'APP-2026-0044',
    institutionName: 'Eastern College of Engineering & Bio-Informatics',
    dueAt: '2026-04-12T00:00:00Z',
    createdAt: '2026-03-22T14:30:00Z',
    read: true,
    severity: 'info'
  },
  {
    id: 'ALT-504',
    type: 'CRITICAL',
    title: 'Immediate Notice: Student Migration Plan',
    message: 'Telangana Institute has not uploaded student redeployment undertakings for branch closure.',
    applicationId: 'APP-2026-0045',
    institutionName: 'Telangana Institute of Pharmaceutical Sciences',
    dueAt: '2026-03-25T00:00:00Z',
    createdAt: '2026-03-26T08:00:00Z',
    read: false,
    severity: 'danger'
  }
];

export const INITIAL_EVC_SCHEDULE = [
  {
    id: 'EVC-701',
    applicationId: 'APP-2026-0041',
    institutionName: 'Delhi Institute of Technology & Management',
    visitDate: '2026-03-28T09:30:00Z',
    status: 'Scheduled',
    committeeLead: 'Prof. R. C. Mathur (IIT Roorkee)',
    committeeMembers: [
      'Prof. R. C. Mathur (Chairperson)',
      'Dr. Meenakshi Iyer (Architectural Expert, SPA Delhi)',
      'Prof. Arvind Srivastav (AI & Computing Subject Expert)'
    ],
    inspectionScope: 'Physical AI Lab setup, Classroom acoustic standards, Fire safety infrastructure',
    venueAddress: 'Sector 62, Institutional Area, Knowledge Park, New Delhi',
    reportSubmitted: false
  },
  {
    id: 'EVC-702',
    applicationId: 'APP-2026-0042',
    institutionName: 'Karnataka Institute of Advanced Robotics & AI',
    visitDate: '2026-04-18T10:00:00Z',
    status: 'Proposed',
    committeeLead: 'Prof. K. Venkatesh (IISc Bangalore)',
    committeeMembers: [
      'Prof. K. Venkatesh (Chairperson)',
      'Dr. Priya Nair (Structural Engineering Expert, NIT Surathkal)'
    ],
    inspectionScope: 'Greenfield site clearance, boundary wall verification, barrier-free access for Divyangjan',
    venueAddress: 'Plot 44-B, Aerospace Technology Park, Devanahalli, Bangalore',
    reportSubmitted: false
  },
  {
    id: 'EVC-703',
    applicationId: 'APP-2026-0043',
    institutionName: 'Maharashtra Polytechnic & Vocational Institute',
    visitDate: '2026-02-14T11:00:00Z',
    status: 'Completed',
    committeeLead: 'Dr. G. K. Deshmukh (COEP Pune)',
    committeeMembers: [
      'Dr. G. K. Deshmukh (Chairperson)',
      'Prof. Sunita Shinde (State DTE Representative)'
    ],
    inspectionScope: 'Annual random verification of machine workshops and language lab facilities',
    venueAddress: 'Shivajinagar Campus, Pune, Maharashtra',
    reportSubmitted: true,
    outcome: 'Satisfactory - Full compliance documented'
  }
];

export const MOCK_DASHBOARD_METRICS = {
  kpis: {
    totalApplications: 124,
    pendingScrutiny: 38,
    overdueApplications: 4,
    pendingCompliance: 12,
    activeEVCs: 14,
    approvedRate: '88.5%',
    avgResolutionDays: 34
  },
  stageDistribution: [
    { stage: 'Submitted', count: 28, color: '#3b82f6' },
    { stage: 'Scrutiny', count: 38, color: '#6366f1' },
    { stage: 'Re-Scrutiny', count: 18, color: '#f59e0b' },
    { stage: 'EVC Scheduled', count: 14, color: '#8b5cf6' },
    { stage: 'EVC Completed', count: 11, color: '#0d9488' },
    { stage: 'SAC Review', count: 9, color: '#ec4899' },
    { stage: 'Approved', count: 17, color: '#10b981' },
    { stage: 'Rejected', count: 4, color: '#ef4444' }
  ],
  monthlyTrend: [
    { month: 'Nov 2025', submitted: 15, approved: 12, overdue: 4 },
    { month: 'Dec 2025', submitted: 22, approved: 18, overdue: 6 },
    { month: 'Jan 2026', submitted: 48, approved: 25, overdue: 8 },
    { month: 'Feb 2026', submitted: 35, approved: 29, overdue: 7 },
    { month: 'Mar 2026', submitted: 29, approved: 34, overdue: 9 }
  ],
  regionalBreakdown: [
    { region: 'Northern (NRO)', count: 32 },
    { region: 'Western (WRO)', count: 29 },
    { region: 'South-Western (SWRO)', count: 26 },
    { region: 'Eastern (ERO)', count: 18 },
    { region: 'Central (CRO)', count: 19 }
  ]
};
