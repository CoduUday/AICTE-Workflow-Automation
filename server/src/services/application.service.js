import { Application } from '../models/Application.js';
import { Institution } from '../models/Institution.js';
import { ROLES, WORKFLOW_STAGES } from '../config/workflow.js';
import { AppError } from '../middleware/errorHandler.js';

export const applicationService = {
  /**
   * Create a new application with initial audit history
   */
  async createApplication(data, actorUser) {
    let institutionId = data.institutionId;
    let institutionName = data.institutionName;
    let region = data.region;

    // Enforce institution ID from authenticated user if institution role
    if (actorUser.role === ROLES.INSTITUTION) {
      institutionId = actorUser.institutionId;
      if (!institutionName && actorUser.institutionName) {
        institutionName = actorUser.institutionName;
      }
    }

    if (!institutionId) {
      throw new AppError('Institution ID is required', 400);
    }

    // Try finding institution for default name/region if not provided
    if (!institutionName || !region) {
      const inst = await Institution.findOne({ institutionId });
      if (inst) {
        institutionName = institutionName || inst.name;
        region = region || inst.region;
      }
    }

    // Generate sequential or unique application numbers
    const count = await Application.countDocuments();
    const seqNum = String(count + 41).padStart(4, '0');
    const applicationNumber = `AICTE/2026/${seqNum}`;
    const id = `APP-2026-${seqNum}`;

    const submittedAt = new Date();
    const targetResolutionDate = new Date(Date.now() + 45 * 24 * 3600 * 1000); // 45-day default APH SLA

    const initialAuditEvent = {
      stage: WORKFLOW_STAGES.SUBMITTED,
      action: 'Application Submitted Online',
      actor: actorUser.name || 'Institution Authorized User',
      actorId: actorUser._id?.toString() || actorUser.id,
      actorRole: actorUser.role,
      previousStage: null,
      nextStage: WORKFLOW_STAGES.SUBMITTED,
      notes: data.notes || 'Application initiated through online compliance portal.',
      timestamp: submittedAt,
    };

    const newApplication = new Application({
      id,
      applicationNumber,
      institutionId,
      institutionName: institutionName || 'Technical Institution',
      region: region || 'North-West (NWRO)',
      applicationType: data.applicationType || 'Extension of Approval (EOA)',
      currentStage: WORKFLOW_STAGES.SUBMITTED,
      status: 'Under Review',
      intakeCapacityRequested: Number(data.intakeCapacityRequested) || 120,
      infrastructureAreaSqM: Number(data.infrastructureAreaSqM) || 10000,
      landTenureType: data.landTenureType || 'Owned',
      submittedAt,
      targetResolutionDate,
      deficiencyCount: 0,
      stageHistory: [initialAuditEvent],
      documents: data.documents || [],
    });

    await newApplication.save();
    return newApplication;
  },

  /**
   * List applications with role-based filtering, search, pagination, and sorting
   */
  async getApplications(query = {}, actorUser) {
    const filter = {};

    // 1. Institution Isolation: Institution users can only view their own applications
    if (actorUser.role === ROLES.INSTITUTION) {
      filter.institutionId = actorUser.institutionId;
    } else if (query.institutionId) {
      filter.institutionId = query.institutionId;
    }

    // 2. Stage filtering
    if (query.stage && query.stage !== 'ALL') {
      filter.currentStage = query.stage;
    }

    // 3. Status filtering
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    // 4. Region filtering
    if (query.region && query.region !== 'ALL') {
      filter.region = query.region;
    }

    // 5. Keyword search across applicationNumber, institutionName, and applicationType
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { applicationNumber: searchRegex },
        { institutionName: searchRegex },
        { applicationType: searchRegex },
        { id: searchRegex },
      ];
    }

    // 6. Pagination & Sorting
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const sortField = query.sortBy || 'submittedAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [applications, total] = await Promise.all([
      Application.find(filter).sort(sort).skip(skip).limit(limit),
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Retrieve a single application by ID or applicationNumber with authorization check
   */
  async getApplicationById(identifier, actorUser) {
    const app = await Application.findOne({
      $or: [{ id: identifier }, { applicationNumber: identifier }],
    });

    if (!app) {
      throw new AppError(`Application not found for identifier: ${identifier}`, 404);
    }

    // Check institution ownership restriction
    if (actorUser.role === ROLES.INSTITUTION && app.institutionId !== actorUser.institutionId) {
      throw new AppError('Forbidden: You are not authorized to view applications from another institution.', 403);
    }

    return app;
  },

  /**
   * Add a supporting document to an application
   */
  async addDocument(identifier, docData, actorUser) {
    const app = await this.getApplicationById(identifier, actorUser);

    if (!docData.name) {
      throw new AppError('Document name is required', 400);
    }

    const newDoc = {
      id: `doc-${Date.now().toString().slice(-6)}`,
      name: docData.name,
      size: docData.size || '1.5 MB',
      documentType: docData.documentType || 'Statutory Document',
      documentUrl: docData.documentUrl || '',
      uploadDate: new Date().toISOString().split('T')[0],
      status: docData.status || 'Pending Review',
    };

    app.documents.push(newDoc);
    await app.save();

    return newDoc;
  },

  /**
   * Retrieve all documents for an application
   */
  async getDocuments(identifier, actorUser) {
    const app = await this.getApplicationById(identifier, actorUser);
    return app.documents;
  },
};

export default applicationService;
