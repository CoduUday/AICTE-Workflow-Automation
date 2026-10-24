import { ComplianceItem } from '../models/ComplianceItem.js';
import { Application } from '../models/Application.js';
import { ROLES } from '../config/workflow.js';
import { AppError } from '../middleware/errorHandler.js';

export const complianceService = {
  /**
   * Determine dynamic status of a compliance item based on due/expiry dates
   */
  resolveDynamicStatus(item) {
    if (['Complied', 'Completed'].includes(item.status)) {
      if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
        return 'Expired';
      }
      return item.status;
    }

    if (item.status === 'Under Review') {
      return 'Under Review';
    }

    const now = new Date();
    const dueDate = new Date(item.dueDate);

    if (now > dueDate) {
      return 'Overdue';
    }

    // Due within 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (dueDate.getTime() - now.getTime() <= sevenDaysMs) {
      return 'Due Soon';
    }

    return 'Pending';
  },

  /**
   * List compliance items with filtering, search, and dynamic status refresh
   */
  async getComplianceItems(query = {}, actorUser) {
    const filter = {};

    // Institution isolation
    if (actorUser.role === ROLES.INSTITUTION) {
      filter.institutionId = actorUser.institutionId;
    } else if (query.institutionId) {
      filter.institutionId = query.institutionId;
    }

    if (query.applicationId) {
      filter.applicationId = query.applicationId;
    }

    if (query.criticality && query.criticality !== 'ALL') {
      filter.criticality = query.criticality;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { requirementType: regex },
        { description: regex },
        { institutionName: regex },
        { id: regex },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ComplianceItem.find(filter).sort({ dueDate: 1 }).skip(skip).limit(limit),
      ComplianceItem.countDocuments(filter),
    ]);

    // Dynamically synchronize statuses if date thresholds shifted
    for (const item of items) {
      const resolved = this.resolveDynamicStatus(item);
      if (resolved !== item.status) {
        item.status = resolved;
        await item.save();
      }
    }

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Retrieve compliance obligation by ID
   */
  async getComplianceById(id, actorUser) {
    const item = await ComplianceItem.findOne({ id });
    if (!item) {
      throw new AppError(`Compliance obligation not found for ID: ${id}`, 404);
    }

    if (actorUser.role === ROLES.INSTITUTION && item.institutionId !== actorUser.institutionId) {
      throw new AppError('Forbidden: Access denied to compliance records of another institution.', 403);
    }

    return item;
  },

  /**
   * Create a new compliance obligation
   */
  async createComplianceItem(data, actorUser) {
    if (!data.requirementType) throw new AppError('Requirement type is required', 400);
    if (!data.description) throw new AppError('Description is required', 400);
    if (!data.dueDate) throw new AppError('Due date is required', 400);

    let institutionId = data.institutionId;
    let institutionName = data.institutionName;

    if (data.applicationId) {
      const app = await Application.findOne({
        $or: [{ id: data.applicationId }, { applicationNumber: data.applicationId }],
      });
      if (app) {
        institutionId = institutionId || app.institutionId;
        institutionName = institutionName || app.institutionName;
      }
    }

    if (!institutionId) {
      throw new AppError('Institution ID is required', 400);
    }

    let id = data.id;
    if (!id) {
      let candidateId;
      let exists = true;
      let counter = 0;
      while (exists && counter < 10) {
        candidateId = `CMP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
        exists = await ComplianceItem.exists({ id: candidateId });
        counter++;
      }
      id = candidateId;
    }

    const newItem = new ComplianceItem({
      id,
      applicationId: data.applicationId || 'APP-2026-0041',
      institutionId,
      institutionName: institutionName || 'Technical Institution',
      requirementType: data.requirementType,
      description: data.description,
      dueDate: new Date(data.dueDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      criticality: data.criticality || 'Medium',
      documentReference: data.documentReference || null,
      status: 'Pending',
    });

    newItem.status = this.resolveDynamicStatus(newItem);
    await newItem.save();
    return newItem;
  },

  /**
   * Update compliance obligation details or status
   */
  async updateComplianceItem(id, updates, actorUser) {
    const item = await this.getComplianceById(id, actorUser);

    if (updates.status) {
      item.status = updates.status;
    }
    if (updates.documentReference !== undefined) {
      item.documentReference = updates.documentReference;
    }
    if (updates.dueDate) {
      item.dueDate = new Date(updates.dueDate);
      item.status = this.resolveDynamicStatus(item);
    }
    if (updates.expiryDate) {
      item.expiryDate = new Date(updates.expiryDate);
    }

    await item.save();
    return item;
  },

  /**
   * Institution submits verification evidence document
   */
  async submitEvidence(id, evidenceData, actorUser) {
    const item = await this.getComplianceById(id, actorUser);

    if (!evidenceData.documentName) {
      throw new AppError('Document name is required for evidence submission', 400);
    }

    const evidence = {
      id: `ev-${Date.now().toString().slice(-6)}`,
      documentName: evidenceData.documentName,
      documentUrl: evidenceData.documentUrl || '',
      size: evidenceData.size || '1.5 MB',
      submittedAt: new Date(),
      submittedBy: actorUser.name || 'Institution Representative',
      verificationStatus: 'Submitted',
      remarks: evidenceData.remarks || '',
    };

    item.evidence.push(evidence);
    item.documentReference = evidenceData.documentName;
    item.status = 'Under Review';

    await item.save();
    return item;
  },

  /**
   * Reviewer or Admin verifies submitted evidence
   */
  async verifyEvidence(id, evidenceId, { verificationStatus, remarks }, actorUser) {
    const item = await this.getComplianceById(id, actorUser);

    const ev = item.evidence.find((e) => e.id === evidenceId || e._id.toString() === evidenceId);
    if (!ev) {
      throw new AppError(`Evidence record not found: ${evidenceId}`, 404);
    }

    ev.verificationStatus = verificationStatus;
    ev.verifiedAt = new Date();
    ev.verifiedBy = actorUser.name || 'AICTE Reviewer';
    ev.remarks = remarks || '';

    if (verificationStatus === 'Verified') {
      item.status = 'Complied';
    } else if (verificationStatus === 'Rejected') {
      item.status = this.resolveDynamicStatus(item);
    }

    await item.save();
    return item;
  },
};

export default complianceService;
