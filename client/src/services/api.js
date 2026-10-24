// Shared API client adhering to docs/API_CONTRACT.md
// Seamlessly delegates to live backend if available, or falls back to local in-memory/localStorage store.

import {
  MOCK_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_COMPLIANCE,
  INITIAL_ALERTS,
  INITIAL_EVC_SCHEDULE,
  MOCK_DASHBOARD_METRICS,
  WORKFLOW_STAGES,
  PERMITTED_TRANSITIONS
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Initialize localStorage seed if missing
function getStorage(key, defaultVal) {
  try {
    const item = localStorage.getItem(`aicte_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(`aicte_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error', err);
  }
}

// In-memory / storage sync
let applications = getStorage('applications', INITIAL_APPLICATIONS);
let complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
let alerts = getStorage('alerts', INITIAL_ALERTS);
let evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);

export let isBackendConnected = false;

// Helper to make live request or fallback
async function request(endpoint, options = {}, fallbackFn) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800); // 1.8s timeout for quick fallback
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('aicte_token') || ''}`,
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    isBackendConnected = true;
    return await res.json();
  } catch (err) {
    // Graceful fallback to mock data
    isBackendConnected = false;
    // Simulate brief network delay for realism
    await new Promise((r) => setTimeout(r, 120));
    return fallbackFn();
  }
}

/* ==========================================================================
   AUTH API
   ========================================================================== */
export const authAPI = {
  login: async (email, role) => {
    return request(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, role }) },
      () => {
        const user = MOCK_USERS.find((u) => u.email === email || u.role === role) || MOCK_USERS[0];
        localStorage.setItem('aicte_user', JSON.stringify(user));
        localStorage.setItem('aicte_token', 'mock_jwt_token_sample');
        return { success: true, data: { user, token: 'mock_jwt_token_sample' } };
      }
    );
  },

  getCurrentUser: async () => {
    return request('/auth/me', { method: 'GET' }, () => {
      const saved = localStorage.getItem('aicte_user');
      return saved ? JSON.parse(saved) : MOCK_USERS[0];
    });
  }
};

/* ==========================================================================
   APPLICATIONS API
   ========================================================================== */
export const applicationsAPI = {
  getAll: async (filters = {}) => {
    return request('/applications', { method: 'GET' }, () => {
      applications = getStorage('applications', INITIAL_APPLICATIONS);
      let result = [...applications];

      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (a) =>
            a.applicationNumber.toLowerCase().includes(q) ||
            a.institutionName.toLowerCase().includes(q) ||
            a.applicationType.toLowerCase().includes(q)
        );
      }

      // Stage filter
      if (filters.stage && filters.stage !== 'ALL') {
        result = result.filter((a) => a.currentStage === filters.stage);
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(
          (a) => a.status.toLowerCase().replace(/\s+/g, '_') === filters.status.toLowerCase().replace(/\s+/g, '_')
        );
      }

      // Academic Year filter
      if (filters.academicYear && filters.academicYear !== 'ALL') {
        result = result.filter((a) => a.academicYear === filters.academicYear);
      }

      // Application Type filter
      if (filters.applicationType && filters.applicationType !== 'ALL') {
        result = result.filter((a) => a.applicationType.toLowerCase().includes(filters.applicationType.toLowerCase()));
      }

      // Institution Scope filter
      if (filters.institutionId) {
        result = result.filter((a) => a.institutionId === filters.institutionId);
      }

      // Sorting
      const sortBy = filters.sortBy || 'submittedAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      result.sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';

        if (sortBy === 'submittedAt' || sortBy === 'targetResolutionDate') {
          return (new Date(valA) - new Date(valB)) * sortOrder;
        }

        if (typeof valA === 'string') {
          return valA.localeCompare(valB) * sortOrder;
        }
        return (valA - valB) * sortOrder;
      });

      // Pagination
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 10;
      const total = result.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedItems = result.slice(startIndex, startIndex + limit);

      return {
        success: true,
        data: paginatedItems,
        applications: paginatedItems,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    });
  },

  getById: async (id) => {
    return request(`/applications/${id}`, { method: 'GET' }, () => {
      applications = getStorage('applications', INITIAL_APPLICATIONS);
      const app = applications.find((a) => a.id === id || a.applicationNumber === id);
      if (!app) throw new Error('Application not found');
      return app;
    });
  },

  create: async (data) => {
    return request(
      '/applications',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        applications = getStorage('applications', INITIAL_APPLICATIONS);
        const idNumber = String(applications.length + 41).padStart(4, '0');
        const now = new Date().toISOString();
        const resolution = new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString();

        const newApp = {
          id: `APP-2026-${idNumber}`,
          applicationNumber: `AICTE/2026/${idNumber}`,
          institutionId: data.institutionId || `INST-2026-${idNumber}`,
          institutionName: data.institutionName,
          region: data.region || 'North-West (NWRO)',
          academicYear: data.academicYear || '2026-2027',
          applicationType: data.applicationType || 'Extension of Approval (EOA)',
          currentStage: 'SUBMITTED',
          status: 'Pending',
          assignedTo: 'Prof. Ananya Sen',
          assignedToId: 'usr-2',
          submittedAt: now,
          targetResolutionDate: resolution,
          intakeCapacityRequested: Number(data.intakeCapacityRequested) || 120,
          infrastructureAreaSqM: Number(data.infrastructureAreaSqM) || 10000,
          landTenureType: data.landTenureType || 'Owned Freehold',
          deficiencyCount: 0,
          officerComments: data.notes || 'Fresh application queued for scrutiny review.',
          stageHistory: [
            {
              stage: 'SUBMITTED',
              action: 'Application Submitted Online',
              actor: data.submittedBy || 'Institution Signatory',
              role: 'institution',
              timestamp: now,
              notes: data.notes || 'Online submission completed with mandatory institutional affidavits.'
            }
          ],
          documents: [
            {
              id: `doc-${Date.now()}`,
              name: 'Mandatory Disclosure Affidavit.pdf',
              size: '1.8 MB',
              uploadDate: now.split('T')[0],
              status: 'Verified',
              documentType: 'Statutory Disclosure',
              url: '#'
            }
          ]
        };

        applications = [newApp, ...applications];
        setStorage('applications', applications);
        return newApp;
      }
    );
  },

  updateStage: async (id, { nextStage, notes, action, actorName, role }) => {
    return request(
      `/applications/${id}/stage`,
      { method: 'PATCH', body: JSON.stringify({ nextStage, notes, action }) },
      () => {
        applications = getStorage('applications', INITIAL_APPLICATIONS);
        const index = applications.findIndex((a) => a.id === id || a.applicationNumber === id);
        if (index === -1) throw new Error('Application not found');

        const app = { ...applications[index] };
        const stageObj = WORKFLOW_STAGES.find((s) => s.id === nextStage);
        const stageName = stageObj ? stageObj.name : nextStage;

        app.currentStage = nextStage;
        if (nextStage === 'APPROVED') {
          app.status = 'Approved';
        } else if (nextStage === 'REJECTED') {
          app.status = 'Rejected';
        } else if (nextStage === 'RE_SCRUTINY') {
          app.status = 'Deficient';
        } else {
          app.status = 'In Progress';
        }

        if (notes) {
          app.officerComments = notes;
        }

        const newHistoryEntry = {
          stage: nextStage,
          action: action || `Moved to ${stageName}`,
          actor: actorName || 'Authorized Officer',
          role: role || 'scrutiny_officer',
          timestamp: new Date().toISOString(),
          notes: notes || `Application moved to ${stageName} stage.`
        };

        app.stageHistory = [...(app.stageHistory || []), newHistoryEntry];
        applications[index] = app;
        setStorage('applications', applications);
        return app;
      }
    );
  },

  uploadDocument: async (id, docData) => {
    return request(
      `/applications/${id}/documents`,
      { method: 'POST', body: JSON.stringify(docData) },
      () => {
        applications = getStorage('applications', INITIAL_APPLICATIONS);
        const index = applications.findIndex((a) => a.id === id || a.applicationNumber === id);
        if (index === -1) throw new Error('Application not found');

        const app = { ...applications[index] };
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: docData.name || 'Uploaded_Document.pdf',
          size: docData.size || '2.1 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Pending Review',
          documentType: docData.documentType || 'Statutory Annexure',
          url: '#'
        };

        app.documents = [...(app.documents || []), newDoc];
        applications[index] = app;
        setStorage('applications', applications);
        return newDoc;
      }
    );
  }
};

/* ==========================================================================
   COMPLIANCE API
   ========================================================================== */
export const complianceAPI = {
  getAll: async (filters = {}) => {
    return request('/compliance', { method: 'GET' }, () => {
      complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
      let items = [...complianceItems];
      const now = new Date();

      // Dynamically assess 'Due Soon' and 'Expired'
      items = items.map((c) => {
        const due = new Date(c.dueDate);
        const expiry = c.expiryDate ? new Date(c.expiryDate) : null;
        let computedStatus = c.status;

        if (c.status !== 'Completed') {
          if (expiry && expiry < now) {
            computedStatus = 'Expired';
          } else if (due < now) {
            computedStatus = 'Overdue';
          } else {
            const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 14 && diffDays >= 0 && c.status === 'Pending') {
              computedStatus = 'Due Soon';
            }
          }
        }
        return { ...c, computedStatus };
      });

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        const target = filters.status.toLowerCase();
        items = items.filter(
          (c) =>
            c.status.toLowerCase() === target ||
            (c.computedStatus && c.computedStatus.toLowerCase() === target)
        );
      }

      // Criticality filter
      if (filters.criticality && filters.criticality !== 'ALL') {
        items = items.filter((c) => c.criticality.toLowerCase() === filters.criticality.toLowerCase());
      }

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        items = items.filter(
          (c) =>
            c.requirementType.toLowerCase().includes(q) ||
            c.institutionName.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            (c.applicationId && c.applicationId.toLowerCase().includes(q))
        );
      }

      return items;
    });
  },

  create: async (data) => {
    return request('/compliance', { method: 'POST', body: JSON.stringify(data) }, () => {
      complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
      const newId = `CMP-${Date.now().toString().slice(-4)}`;
      const newItem = {
        id: newId,
        applicationId: data.applicationId || 'APP-2026-0041',
        institutionName: data.institutionName || 'Delhi Institute of Technology & Management',
        requirementType: data.requirementType,
        description: data.description,
        dueDate: data.dueDate,
        expiryDate: data.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        status: 'Pending',
        criticality: data.criticality || 'Medium',
        certificateNumber: null,
        documentReference: null,
        evidenceNotes: null,
        submittedAt: null,
        verifiedBy: null,
        verifiedAt: null,
        verificationNotes: null,
        lastNotifiedAt: new Date().toISOString()
      };
      complianceItems = [newItem, ...complianceItems];
      setStorage('compliance', complianceItems);
      return newItem;
    });
  },

  submitEvidence: async (id, evidenceData) => {
    return request(
      `/compliance/${id}`,
      { method: 'PATCH', body: JSON.stringify({ status: 'Under Review', ...evidenceData }) },
      () => {
        complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
        const index = complianceItems.findIndex((c) => c.id === id);
        if (index === -1) throw new Error('Compliance obligation not found');

        complianceItems[index] = {
          ...complianceItems[index],
          status: 'Under Review',
          documentReference: evidenceData.documentReference || 'Evidence_Document.pdf',
          certificateNumber: evidenceData.certificateNumber || 'CERT-UPLOAD-2026',
          expiryDate: evidenceData.expiryDate || complianceItems[index].expiryDate,
          evidenceNotes: evidenceData.evidenceNotes || 'Evidence uploaded by institution representative.',
          submittedAt: new Date().toISOString()
        };

        setStorage('compliance', complianceItems);
        return complianceItems[index];
      }
    );
  },

  verifyEvidence: async (id, verificationData) => {
    return request(
      `/compliance/${id}`,
      { method: 'PATCH', body: JSON.stringify(verificationData) },
      () => {
        complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
        const index = complianceItems.findIndex((c) => c.id === id);
        if (index === -1) throw new Error('Compliance obligation not found');

        const isApproved = verificationData.outcome === 'Completed';

        complianceItems[index] = {
          ...complianceItems[index],
          status: isApproved ? 'Completed' : 'Pending',
          verifiedBy: verificationData.verifiedBy || 'Authorized Scrutiny Officer',
          verifiedAt: new Date().toISOString(),
          verificationNotes: verificationData.verificationNotes || (isApproved ? 'Verified satisfactory' : 'Deficiencies identified in submitted evidence.')
        };

        setStorage('compliance', complianceItems);
        return complianceItems[index];
      }
    );
  }
};

/* ==========================================================================
   ALERTS API
   ========================================================================== */
export const alertsAPI = {
  getAll: async (filters = {}) => {
    return request('/alerts', { method: 'GET' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      let items = [...alerts];

      if (filters.filter === 'UNREAD') {
        items = items.filter((a) => !a.read && !a.acknowledged);
      } else if (filters.filter === 'OVERDUE') {
        const now = new Date();
        items = items.filter((a) => a.dueAt && new Date(a.dueAt) < now);
      } else if (filters.filter === 'COMPLIANCE') {
        items = items.filter((a) => a.category === 'Compliance');
      }

      return items;
    });
  },

  acknowledge: async (id, acknowledgedBy = 'Authorized User') => {
    return request(`/alerts/${id}/acknowledge`, { method: 'PATCH' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      const now = new Date().toISOString();
      alerts = alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              read: true,
              acknowledged: true,
              acknowledgedAt: now,
              acknowledgedBy
            }
          : a
      );
      setStorage('alerts', alerts);
      return { success: true };
    });
  },

  markAllAsRead: async (acknowledgedBy = 'Authorized User') => {
    return request('/alerts/read-all', { method: 'PATCH' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      const now = new Date().toISOString();
      alerts = alerts.map((a) => ({
        ...a,
        read: true,
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy
      }));
      setStorage('alerts', alerts);
      return { success: true };
    });
  }
};

/* ==========================================================================
   EVC API
   ========================================================================== */
export const evcAPI = {
  getAll: async () => {
    return request('/evc', { method: 'GET' }, () => {
      evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);
      // Sort chronologically by visitDate
      return [...evcSchedule].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    });
  },

  scheduleVisit: async (data) => {
    return request('/evc', { method: 'POST', body: JSON.stringify(data) }, () => {
      evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);
      const newId = `EVC-${Date.now().toString().slice(-4)}`;

      // Conflict detection check:
      const visitDateStr = new Date(data.visitDate).toISOString().split('T')[0];
      const conflictFound = evcSchedule.some((existing) => {
        const existingDateStr = new Date(existing.visitDate).toISOString().split('T')[0];
        if (existingDateStr !== visitDateStr) return false;
        // Check if lead or same institution matches on the same date
        return (
          existing.committeeLead?.toLowerCase() === data.committeeLead?.toLowerCase() ||
          existing.institutionName?.toLowerCase() === data.institutionName?.toLowerCase()
        );
      });

      const conflictWarning = conflictFound
        ? `Schedule Conflict: ${data.committeeLead} or institution has concurrent inspection on ${visitDateStr}!`
        : null;

      const teamList = [
        { name: data.committeeLead, role: 'Chairperson', organization: 'Academic Expert' },
        ...(data.committeeMembersText || '')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
          .map((m) => ({ name: m, role: 'Subject / Technical Expert', organization: 'AICTE Panel' }))
      ];

      const newVisit = {
        id: newId,
        applicationId: data.applicationId || 'APP-2026-0041',
        institutionName: data.institutionName,
        visitDate: data.visitDate,
        status: 'Scheduled',
        committeeLead: data.committeeLead,
        committeeMembers: teamList.map((t) => `${t.name} (${t.role})`),
        assignedTeam: teamList,
        inspectionScope: data.inspectionScope || 'Physical infrastructure & laboratory verification',
        venueAddress: data.venueAddress,
        conflictWarning,
        reportSubmitted: false,
        reportSummary: null
      };

      evcSchedule = [newVisit, ...evcSchedule];
      setStorage('evc', evcSchedule);
      return newVisit;
    });
  },

  rescheduleVisit: async (id, { newVisitDate, reason, rescheduledBy }) => {
    return request(
      `/evc/${id}`,
      { method: 'PATCH', body: JSON.stringify({ visitDate: newVisitDate, reason }) },
      () => {
        evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);
        const index = evcSchedule.findIndex((e) => e.id === id);
        if (index === -1) throw new Error('EVC Inspection record not found');

        evcSchedule[index] = {
          ...evcSchedule[index],
          visitDate: newVisitDate,
          status: 'Rescheduled',
          rescheduledReason: reason,
          rescheduledBy: rescheduledBy || 'EVC Coordinator',
          rescheduledAt: new Date().toISOString()
        };

        setStorage('evc', evcSchedule);
        return evcSchedule[index];
      }
    );
  },

  completeInspection: async (id, { reportSummary, outcome, completedBy }) => {
    return request(
      `/evc/${id}/complete`,
      { method: 'PATCH', body: JSON.stringify({ reportSummary, outcome }) },
      () => {
        evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);
        const index = evcSchedule.findIndex((e) => e.id === id);
        if (index === -1) throw new Error('EVC Inspection record not found');

        evcSchedule[index] = {
          ...evcSchedule[index],
          status: 'Completed',
          reportSubmitted: true,
          reportSummary: reportSummary || 'Inspection conducted with complete laboratory audit.',
          outcome: outcome || 'Satisfactory - Full compliance documented',
          completedBy: completedBy || 'Committee Lead',
          completedAt: new Date().toISOString()
        };

        setStorage('evc', evcSchedule);
        return evcSchedule[index];
      }
    );
  }
};

/* ==========================================================================
   DASHBOARD API
   ========================================================================== */
export const dashboardAPI = {
  getSummary: async () => {
    return request('/dashboard/summary', { method: 'GET' }, () => {
      applications = getStorage('applications', INITIAL_APPLICATIONS);
      complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
      alerts = getStorage('alerts', INITIAL_ALERTS);
      evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);

      const now = new Date();
      const totalApplications = applications.length;
      const pendingScrutiny = applications.filter(
        (a) => a.currentStage === 'SCRUTINY' || a.currentStage === 'RE_SCRUTINY'
      ).length;

      const overdueApplications = applications.filter((a) => {
        if (a.currentStage === 'APPROVED' || a.currentStage === 'REJECTED') return false;
        return new Date(a.targetResolutionDate) < now;
      }).length;

      const pendingCompliance = complianceItems.filter(
        (c) => c.status === 'Pending' || c.status === 'Under Review' || c.status === 'Overdue' || c.status === 'Due Soon'
      ).length;

      const activeEVCs = evcSchedule.filter((e) => e.status === 'Scheduled' || e.status === 'Proposed').length;

      const stageMap = {};
      WORKFLOW_STAGES.forEach((s) => {
        stageMap[s.id] = { stage: s.name, count: 0, color: s.color };
      });
      applications.forEach((a) => {
        if (stageMap[a.currentStage]) {
          stageMap[a.currentStage].count += 1;
        }
      });
      const stageDistribution = Object.values(stageMap);

      return {
        ...MOCK_DASHBOARD_METRICS,
        kpis: {
          totalApplications,
          pendingScrutiny,
          overdueApplications,
          pendingCompliance,
          activeEVCs,
          approvedRate: '88.5%',
          avgResolutionDays: 32
        },
        stageDistribution
      };
    });
  }
};
