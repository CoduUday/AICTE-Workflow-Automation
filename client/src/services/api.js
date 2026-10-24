// Shared API client adhering to docs/API_CONTRACT.md
// Seamlessly delegates to live backend if available, or falls back to local in-memory/localStorage store.

import {
  MOCK_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_COMPLIANCE,
  INITIAL_ALERTS,
  INITIAL_EVC_SCHEDULE,
  MOCK_DASHBOARD_METRICS,
  WORKFLOW_STAGES
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
        return { success: true, user, token: 'mock_jwt_token_sample' };
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
      let result = [...applications];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (a) =>
            a.applicationNumber.toLowerCase().includes(q) ||
            a.institutionName.toLowerCase().includes(q) ||
            a.applicationType.toLowerCase().includes(q)
        );
      }
      if (filters.stage && filters.stage !== 'ALL') {
        result = result.filter((a) => a.currentStage === filters.stage);
      }
      if (filters.institutionId) {
        result = result.filter((a) => a.institutionId === filters.institutionId);
      }
      return { total: result.length, applications: result };
    });
  },

  getById: async (id) => {
    return request(`/applications/${id}`, { method: 'GET' }, () => {
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
        const idNumber = String(applications.length + 41).padStart(4, '0');
        const newApp = {
          id: `APP-2026-${idNumber}`,
          applicationNumber: `AICTE/2026/${idNumber}`,
          institutionId: data.institutionId || 'INST-2024-DEL-089',
          institutionName: data.institutionName || 'Delhi Institute of Technology & Management',
          region: data.region || 'North-West (NWRO)',
          applicationType: data.applicationType || 'Extension of Approval (EOA)',
          currentStage: 'SUBMITTED',
          status: 'Under Review',
          assignedTo: 'Prof. Ananya Sen',
          assignedToId: 'usr-2',
          submittedAt: new Date().toISOString(),
          targetResolutionDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
          intakeCapacityRequested: Number(data.intakeCapacityRequested) || 120,
          infrastructureAreaSqM: Number(data.infrastructureAreaSqM) || 10000,
          landTenureType: data.landTenureType || 'Owned',
          deficiencyCount: 0,
          stageHistory: [
            {
              stage: 'SUBMITTED',
              action: 'Application Submitted Online',
              actor: data.submittedBy || 'Institution Official',
              timestamp: new Date().toISOString(),
              notes: data.notes || 'Application initiated through online compliance portal.'
            }
          ],
          documents: [
            { name: 'Mandatory Disclosure Affidavit.pdf', size: '1.8 MB', uploadDate: new Date().toISOString().split('T')[0], status: 'Verified' }
          ]
        };
        applications = [newApp, ...applications];
        setStorage('applications', applications);
        return newApp;
      }
    );
  },

  updateStatus: async (id, nextStage, actorName, notes) => {
    return request(
      `/applications/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ currentStage: nextStage, notes }) },
      () => {
        const index = applications.findIndex((a) => a.id === id || a.applicationNumber === id);
        if (index === -1) throw new Error('Application not found');

        const app = { ...applications[index] };
        const stageObj = WORKFLOW_STAGES.find((s) => s.id === nextStage);
        const stageName = stageObj ? stageObj.name : nextStage;

        app.currentStage = nextStage;
        app.status = nextStage === 'APPROVED' ? 'Approved' : nextStage === 'REJECTED' ? 'Rejected' : 'In Progress';
        
        const newHistoryEntry = {
          stage: nextStage,
          action: `Moved to ${stageName}`,
          actor: actorName || 'Authorized Reviewer',
          timestamp: new Date().toISOString(),
          notes: notes || `Application moved to ${stageName} stage.`
        };

        app.stageHistory = [...(app.stageHistory || []), newHistoryEntry];
        applications[index] = app;
        setStorage('applications', applications);
        return app;
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
      let items = [...complianceItems];
      if (filters.status && filters.status !== 'ALL') {
        items = items.filter((c) => c.status === filters.status);
      }
      if (filters.criticality && filters.criticality !== 'ALL') {
        items = items.filter((c) => c.criticality === filters.criticality);
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
      return [...alerts];
    });
  },

  markAsRead: async (id) => {
    return request(`/alerts/${id}/read`, { method: 'PATCH' }, () => {
      alerts = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
      setStorage('alerts', alerts);
      return { success: true };
    });
  },

  markAllAsRead: async () => {
    return request('/alerts/read-all', { method: 'PATCH' }, () => {
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
      return [...evcSchedule];
    });
  },

  scheduleVisit: async (data) => {
    return request('/evc/schedule', { method: 'POST', body: JSON.stringify(data) }, () => {
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
      // Recalculate dynamic totals from local store
      const pendingScrutiny = applications.filter((a) => a.currentStage === 'SCRUTINY' || a.currentStage === 'RE_SCRUTINY').length;
      const overdueCompliance = complianceItems.filter((c) => c.status === 'Overdue').length;
      const activeEVCs = evcSchedule.filter((e) => e.status === 'Scheduled' || e.status === 'Proposed').length;

      return {
        ...MOCK_DASHBOARD_METRICS,
        kpis: {
          ...MOCK_DASHBOARD_METRICS.kpis,
          totalApplications: applications.length,
          pendingScrutiny,
          activeEVCs,
          overdueCompliance
        }
      };
    });
  }
};
