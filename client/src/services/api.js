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
      // Re-read storage
      applications = getStorage('applications', INITIAL_APPLICATIONS);
      let result = [...applications];

      // Search (by applicationNumber, institutionName, or type)
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
        applications: paginatedItems, // alias for convenience
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

  // Document upload function
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

      if (filters.status && filters.status !== 'ALL') {
        items = items.filter((c) => c.status.toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.criticality && filters.criticality !== 'ALL') {
        items = items.filter((c) => c.criticality.toLowerCase() === filters.criticality.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (c) =>
            c.requirementType.toLowerCase().includes(q) ||
            c.institutionName.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
      }
      return items;
    });
  },

  updateStatus: async (id, status, documentReference = null) => {
    return request(
      `/compliance/${id}`,
      { method: 'PATCH', body: JSON.stringify({ status, documentReference }) },
      () => {
        complianceItems = getStorage('compliance', INITIAL_COMPLIANCE);
        const index = complianceItems.findIndex((c) => c.id === id);
        if (index === -1) throw new Error('Compliance obligation not found');
        complianceItems[index] = {
          ...complianceItems[index],
          status,
          ...(documentReference ? { documentReference } : {}),
          updatedAt: new Date().toISOString()
        };
        setStorage('compliance', complianceItems);
        return complianceItems[index];
      }
    );
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
        status: 'Pending',
        criticality: data.criticality || 'Medium',
        documentReference: null,
        lastNotifiedAt: new Date().toISOString()
      };
      complianceItems = [newItem, ...complianceItems];
      setStorage('compliance', complianceItems);
      return newItem;
    });
  }
};

/* ==========================================================================
   ALERTS API
   ========================================================================== */
export const alertsAPI = {
  getAll: async () => {
    return request('/alerts', { method: 'GET' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      return [...alerts];
    });
  },

  markAsRead: async (id) => {
    return request(`/alerts/${id}/acknowledge`, { method: 'PATCH' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      alerts = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
      setStorage('alerts', alerts);
      return { success: true };
    });
  },

  markAllAsRead: async () => {
    return request('/alerts/read-all', { method: 'PATCH' }, () => {
      alerts = getStorage('alerts', INITIAL_ALERTS);
      alerts = alerts.map((a) => ({ ...a, read: true }));
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
      return [...evcSchedule];
    });
  },

  scheduleVisit: async (data) => {
    return request('/evc', { method: 'POST', body: JSON.stringify(data) }, () => {
      evcSchedule = getStorage('evc', INITIAL_EVC_SCHEDULE);
      const newId = `EVC-${Date.now().toString().slice(-4)}`;
      const newVisit = {
        id: newId,
        applicationId: data.applicationId,
        institutionName: data.institutionName,
        visitDate: data.visitDate,
        status: 'Scheduled',
        committeeLead: data.committeeLead,
        committeeMembers: data.committeeMembers || [data.committeeLead],
        inspectionScope: data.inspectionScope,
        venueAddress: data.venueAddress,
        reportSubmitted: false
      };
      evcSchedule = [newVisit, ...evcSchedule];
      setStorage('evc', evcSchedule);
      return newVisit;
    });
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

      // Dynamically calculate:
      const totalApplications = applications.length;

      // Pending scrutiny: stage is SCRUTINY or RE_SCRUTINY
      const pendingScrutiny = applications.filter(
        (a) => a.currentStage === 'SCRUTINY' || a.currentStage === 'RE_SCRUTINY'
      ).length;

      // Overdue applications: not approved or rejected, and targetResolutionDate < now
      const overdueApplications = applications.filter((a) => {
        if (a.currentStage === 'APPROVED' || a.currentStage === 'REJECTED') return false;
        return new Date(a.targetResolutionDate) < now;
      }).length;

      // Pending compliance: status is Pending or Under Review or Overdue
      const pendingCompliance = complianceItems.filter(
        (c) => c.status === 'Pending' || c.status === 'Under Review' || c.status === 'Overdue'
      ).length;

      // Active EVCs
      const activeEVCs = evcSchedule.filter((e) => e.status === 'Scheduled' || e.status === 'Proposed').length;

      // Calculate dynamic stage distribution
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
