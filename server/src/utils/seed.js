import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { Application } from '../models/Application.js';
import { ROLES, WORKFLOW_STAGES } from '../config/workflow.js';

export const SEED_USERS = [
  {
    name: 'Dr. Rajesh Sharma',
    email: 'admin.rajesh@aicte-india.org',
    password: 'Password123!',
    role: ROLES.ADMIN,
    designation: 'Member Secretary & Admin Director',
    department: 'Approval Bureau, AICTE HQ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Prof. Ananya Sen',
    email: 'reviewer.sen@aicte-india.org',
    password: 'Password123!',
    role: ROLES.SCRUTINY_OFFICER,
    designation: 'Senior Scrutiny Officer',
    department: 'Western Regional Office (WRO)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Prof. R. C. Mathur',
    email: 'evc.mathur@aicte-india.org',
    password: 'Password123!',
    role: ROLES.EVC_COORDINATOR,
    designation: 'EVC Inspection Cell Head',
    department: 'Inspection & Accreditation Bureau',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Justice (Retd.) K. N. Sharma',
    email: 'committee.sharma@aicte-india.org',
    password: 'Password123!',
    role: ROLES.COMMITTEE_OFFICER,
    designation: 'Standing Appellate Committee Lead',
    department: 'Appellate Bureau',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Dr. K. S. Sundaram',
    email: 'principal@dit-edu.in',
    password: 'Password123!',
    role: ROLES.INSTITUTION,
    designation: 'Principal & Authorized Signatory',
    institutionId: 'INST-2024-DEL-089',
    institutionName: 'Delhi Institute of Technology & Management',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Dr. H. V. Gowda',
    email: 'principal@kiara-edu.in',
    password: 'Password123!',
    role: ROLES.INSTITUTION,
    designation: 'Director & Principal',
    institutionId: 'INST-2024-BLR-012',
    institutionName: 'Karnataka Institute of Advanced Robotics & AI',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
  },
];

export const SEED_INSTITUTIONS = [
  {
    institutionId: 'INST-2024-DEL-089',
    name: 'Delhi Institute of Technology & Management',
    region: 'North-West (NWRO)',
    address: 'Sector 62, Institutional Area, Knowledge Park, New Delhi',
    state: 'Delhi',
    principalName: 'Dr. K. S. Sundaram',
    contactEmail: 'principal@dit-edu.in',
    contactPhone: '+91-11-26789100',
    establishedYear: 2004,
  },
  {
    institutionId: 'INST-2024-BLR-012',
    name: 'Karnataka Institute of Advanced Robotics & AI',
    region: 'South-West (SWRO)',
    address: 'Plot 44-B, Aerospace Technology Park, Devanahalli, Bangalore',
    state: 'Karnataka',
    principalName: 'Dr. H. V. Gowda',
    contactEmail: 'principal@kiara-edu.in',
    contactPhone: '+91-80-23456789',
    establishedYear: 2021,
  },
  {
    institutionId: 'INST-2024-PUN-055',
    name: 'Maharashtra Polytechnic & Vocational Institute',
    region: 'Western (WRO)',
    address: 'Shivajinagar Campus, Pune, Maharashtra',
    state: 'Maharashtra',
    principalName: 'Prof. S. Patil',
    contactEmail: 'principal@mpvi-pune.edu.in',
    contactPhone: '+91-20-25501000',
    establishedYear: 1998,
  },
  {
    institutionId: 'INST-2024-KOL-021',
    name: 'Eastern College of Engineering & Bio-Informatics',
    region: 'Eastern (ERO)',
    address: 'Salt Lake Sector V, Kolkata, West Bengal',
    state: 'West Bengal',
    principalName: 'Dr. B. K. Roy',
    contactEmail: 'principal@eceb-kol.edu.in',
    contactPhone: '+91-33-23571234',
    establishedYear: 2008,
  },
];

export const SEED_APPLICATIONS = [
  {
    id: 'APP-2026-0041',
    applicationNumber: 'AICTE/2026/0041',
    institutionId: 'INST-2024-DEL-089',
    institutionName: 'Delhi Institute of Technology & Management',
    region: 'North-West (NWRO)',
    applicationType: 'Extension of Approval (EOA) + New Course (AI & DS)',
    currentStage: WORKFLOW_STAGES.EVC_SCHEDULED,
    status: 'EVC Pending',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: new Date('2026-02-10T10:30:00Z'),
    targetResolutionDate: new Date('2026-04-15T00:00:00Z'),
    intakeCapacityRequested: 180,
    infrastructureAreaSqM: 14200,
    landTenureType: 'Owned (Perpetual Lease)',
    deficiencyCount: 1,
    stageHistory: [
      {
        stage: WORKFLOW_STAGES.SUBMITTED,
        previousStage: null,
        nextStage: WORKFLOW_STAGES.SUBMITTED,
        action: 'Application Submitted Online',
        actor: 'Dr. K. S. Sundaram',
        actorRole: ROLES.INSTITUTION,
        timestamp: new Date('2026-02-10T10:30:00Z'),
        notes: 'Submitted initial self-disclosure and affidavit forms along with fee receipt.',
      },
      {
        stage: WORKFLOW_STAGES.SCRUTINY,
        previousStage: WORKFLOW_STAGES.SUBMITTED,
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        action: 'Scrutiny Commenced',
        actor: 'Prof. Ananya Sen',
        actorRole: ROLES.SCRUTINY_OFFICER,
        timestamp: new Date('2026-02-15T11:00:00Z'),
        notes: 'Application taken up for document scrutiny.',
      },
      {
        stage: WORKFLOW_STAGES.RE_SCRUTINY,
        previousStage: WORKFLOW_STAGES.SCRUTINY,
        nextStage: WORKFLOW_STAGES.RE_SCRUTINY,
        action: 'Deficiency Notice Issued',
        actor: 'Prof. Ananya Sen',
        actorRole: ROLES.SCRUTINY_OFFICER,
        timestamp: new Date('2026-02-22T14:15:00Z'),
        notes: 'Fire safety certificate renewal copy was past 3-year threshold; re-scrutiny requested.',
      },
      {
        stage: WORKFLOW_STAGES.SCRUTINY,
        previousStage: WORKFLOW_STAGES.RE_SCRUTINY,
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        action: 'Deficiencies Rectified',
        actor: 'Dr. K. S. Sundaram',
        actorRole: ROLES.INSTITUTION,
        timestamp: new Date('2026-03-05T11:00:00Z'),
        notes: 'Institution uploaded renewed Fire Safety NOC and updated building occupancy certificate.',
      },
      {
        stage: WORKFLOW_STAGES.EVC_SCHEDULED,
        previousStage: WORKFLOW_STAGES.SCRUTINY,
        nextStage: WORKFLOW_STAGES.EVC_SCHEDULED,
        action: 'Expert Visit Committee Scheduled',
        actor: 'Prof. Ananya Sen',
        actorRole: ROLES.SCRUTINY_OFFICER,
        timestamp: new Date('2026-03-12T16:00:00Z'),
        notes: '3-member inspection team scheduled for on-site physical infrastructure verification.',
      },
    ],
    documents: [
      { name: 'Fire Safety NOC Renewal.pdf', size: '2.4 MB', uploadDate: '2026-03-04', status: 'Verified', documentType: 'Statutory NOC' },
      { name: 'Land Registration & Title Deed.pdf', size: '14.1 MB', uploadDate: '2026-02-09', status: 'Verified', documentType: 'Land Document' },
      { name: 'Faculty Cadre Ratio Declaration.xlsx', size: '890 KB', uploadDate: '2026-02-09', status: 'Pending Review', documentType: 'Faculty Data' },
    ],
  },
  {
    id: 'APP-2026-0042',
    applicationNumber: 'AICTE/2026/0042',
    institutionId: 'INST-2024-BLR-012',
    institutionName: 'Karnataka Institute of Advanced Robotics & AI',
    region: 'South-West (SWRO)',
    applicationType: 'New Technical Institution Setup',
    currentStage: WORKFLOW_STAGES.SCRUTINY,
    status: 'Under Scrutiny',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: new Date('2026-03-01T09:15:00Z'),
    targetResolutionDate: new Date('2026-05-01T00:00:00Z'),
    intakeCapacityRequested: 300,
    infrastructureAreaSqM: 22000,
    landTenureType: 'Registered Lease (33 Years)',
    deficiencyCount: 0,
    stageHistory: [
      {
        stage: WORKFLOW_STAGES.SUBMITTED,
        previousStage: null,
        nextStage: WORKFLOW_STAGES.SUBMITTED,
        action: 'Fresh Application Lodged',
        actor: 'Dr. H. V. Gowda',
        actorRole: ROLES.INSTITUTION,
        timestamp: new Date('2026-03-01T09:15:00Z'),
        notes: 'Proposal for establishment of autonomous technological campus.',
      },
      {
        stage: WORKFLOW_STAGES.SCRUTINY,
        previousStage: WORKFLOW_STAGES.SUBMITTED,
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        action: 'Assigned to Western & South Scrutiny Panel',
        actor: 'Dr. Rajesh Sharma',
        actorRole: ROLES.ADMIN,
        timestamp: new Date('2026-03-04T12:00:00Z'),
        notes: 'Under scrutiny by panel member 2.',
      },
    ],
    documents: [
      { name: 'Master Plan & Architectural Approval.pdf', size: '18.6 MB', uploadDate: '2026-03-01', status: 'Under Review', documentType: 'Infrastructure' },
      { name: 'Bank Guarantee FDR AICTE Joint Account.pdf', size: '1.2 MB', uploadDate: '2026-03-01', status: 'Verified', documentType: 'Financial Security' },
    ],
  },
  {
    id: 'APP-2026-0044',
    applicationNumber: 'AICTE/2026/0044',
    institutionId: 'INST-2024-KOL-021',
    institutionName: 'Eastern College of Engineering & Bio-Informatics',
    region: 'Eastern (ERO)',
    applicationType: 'Increase in Sanctioned Intake (CSE & ECE)',
    currentStage: WORKFLOW_STAGES.RE_SCRUTINY,
    status: 'Deficiencies Pending',
    assignedTo: 'Prof. Ananya Sen',
    assignedToId: 'usr-2',
    submittedAt: new Date('2026-02-18T11:45:00Z'),
    targetResolutionDate: new Date('2026-04-10T00:00:00Z'),
    intakeCapacityRequested: 120,
    infrastructureAreaSqM: 9800,
    landTenureType: 'Owned',
    deficiencyCount: 2,
    stageHistory: [
      {
        stage: WORKFLOW_STAGES.SUBMITTED,
        previousStage: null,
        nextStage: WORKFLOW_STAGES.SUBMITTED,
        action: 'Application Submitted',
        actor: 'Dr. B. K. Roy',
        actorRole: ROLES.INSTITUTION,
        timestamp: new Date('2026-02-18T11:45:00Z'),
        notes: 'Request for addition of 60 seats in CSE and 60 in ECE.',
      },
      {
        stage: WORKFLOW_STAGES.SCRUTINY,
        previousStage: WORKFLOW_STAGES.SUBMITTED,
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        action: 'Scrutiny Completed with Deficiencies',
        actor: 'Prof. Ananya Sen',
        actorRole: ROLES.SCRUTINY_OFFICER,
        timestamp: new Date('2026-02-25T14:00:00Z'),
        notes: 'Deficiency Identified (Cadre Ratio & Built-up Area).',
      },
      {
        stage: WORKFLOW_STAGES.RE_SCRUTINY,
        previousStage: WORKFLOW_STAGES.SCRUTINY,
        nextStage: WORKFLOW_STAGES.RE_SCRUTINY,
        action: 'Re-Scrutiny Notice Issued',
        actor: 'Prof. Ananya Sen',
        actorRole: ROLES.SCRUTINY_OFFICER,
        timestamp: new Date('2026-03-02T15:00:00Z'),
        notes: 'Faculty Cadre ratio falls short of 1:15 requirement. Laboratory floor plan lacks requisite safety setbacks.',
      },
    ],
    documents: [
      { name: 'Faculty List & Form 16.pdf', size: '6.1 MB', uploadDate: '2026-02-18', status: 'Deficient', documentType: 'Faculty Data' },
    ],
  },
];

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seeding...');

  // Upsert users
  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      await User.create(userData);
      console.log(`[Seed] Created user: ${userData.name} (${userData.role})`);
    } else {
      console.log(`[Seed] User already exists: ${userData.email}`);
    }
  }

  // Upsert institutions
  for (const instData of SEED_INSTITUTIONS) {
    await Institution.findOneAndUpdate(
      { institutionId: instData.institutionId },
      instData,
      { upsert: true, new: true }
    );
  }
  console.log(`[Seed] Seeded ${SEED_INSTITUTIONS.length} institutions.`);

  // Upsert applications
  for (const appData of SEED_APPLICATIONS) {
    await Application.findOneAndUpdate(
      { applicationNumber: appData.applicationNumber },
      appData,
      { upsert: true, new: true }
    );
  }
  console.log(`[Seed] Seeded ${SEED_APPLICATIONS.length} applications.`);

  console.log('[Seed] Database seeding completed successfully.');
};

// Direct script execution support
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  mongoose
    .connect(env.MONGODB_URI)
    .then(async () => {
      await seedDatabase();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
