# AICTE Workflow Automation — Shared REST API Contract
> **Document Status:** AGREED BASELINE (Approved by Team)  
> **Target Version:** MVP 1.0.0  
> **Base URL:** `http://localhost:5000/api`  
> **Shared Ownership:** `Frontend (client/)` & `Backend (server/)`

---

## 1. Global Standards & Conventions

### 1.1 HTTP Headers
* `Content-Type: application/json`
* `Authorization: Bearer <jwt_token>` (Required for all protected endpoints)

### 1.2 Unified Response Format
Every endpoint adheres to a standardized JSON response envelope.

#### Success Response
```json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```
*(Note: `pagination` is included on collection endpoints.)*

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error explanation",
    "statusCode": 400,
    "details": ["Optional array of field validation errors"],
    "path": "/api/applications/123/stage",
    "method": "PATCH"
  }
}
```

---

## 2. Roles & Permission Matrix

The system enforces Role-Based Access Control (RBAC) with 5 distinct stakeholder roles:

| Role Identifier | Description | Allowed Actions |
|---|---|---|
| `institution` | Technical Institution Principal / Authorized Signatory | Create applications, view own applications, upload documents, view own compliance & alerts |
| `scrutiny_officer` | AICTE Regional Scrutiny Officer | Review applications, issue deficiency notices, advance `SUBMITTED -> SCRUTINY -> RE_SCRUTINY` |
| `evc_coordinator` | AICTE Inspection / EVC Cell Coordinator | Schedule Expert Committee visits, assign members, log EVC reports (`EVC_SCHEDULED -> EVC_COMPLETED`) |
| `committee_officer`| Standing Appellate Committee (SAC) / Executive Bureau | Conduct appellate hearings, issue final Approval (`APPROVED`) or Rejection (`REJECTED`) |
| `admin` | AICTE Super Admin / Approval Bureau Director | Full access to all stages, user provisioning, compliance obligation creation, system overrides |

---

## 3. Workflow Stages & State Machine (Configurable)

The lifecycle follows official AICTE Approval Process Handbook (APH) stages:

```text
               +-------------------------------------------------+
               |                                                 |
               v                                                 |
[SUBMITTED] ---> [SCRUTINY] <---> [RE_SCRUTINY]                 |
                    |                   |                        |
                    +---------+---------+                        |
                              |                                  |
                              v                                  |
                      [EVC_SCHEDULED]                            |
                              |                                  |
                              v                                  |
                      [EVC_COMPLETED]                            |
                              |                                  |
                              +--------> [SAC_REVIEW]            |
                              |               |                  |
                              v               v                  |
                         [APPROVED]      [REJECTED] <------------+
```

### Configurable Transition Matrix
| From Stage | Allowed Next Stages | Authorized Roles |
|---|---|---|
| `SUBMITTED` | `SCRUTINY`, `REJECTED` | `scrutiny_officer`, `admin` |
| `SCRUTINY` | `RE_SCRUTINY`, `EVC_SCHEDULED`, `APPROVED`, `REJECTED` | `scrutiny_officer`, `admin` |
| `RE_SCRUTINY`| `SCRUTINY`, `EVC_SCHEDULED`, `REJECTED` | `scrutiny_officer`, `admin` |
| `EVC_SCHEDULED`| `EVC_COMPLETED`, `RE_SCRUTINY` | `evc_coordinator`, `admin` |
| `EVC_COMPLETED`| `SAC_REVIEW`, `APPROVED`, `REJECTED` | `committee_officer`, `admin` |
| `SAC_REVIEW` | `APPROVED`, `REJECTED` | `committee_officer`, `admin` |
| `APPROVED` | *(Terminal State)* | `admin` (override only) |
| `REJECTED` | `SAC_REVIEW` *(On formal appeal)* | `committee_officer`, `admin` |

---

## 4. Detailed Endpoint Specifications

### 4.1 Authentication

#### `POST /api/auth/login`
Authenticate user credentials and receive a JWT.
* **Access:** Public
* **Request Body:**
```json
{
  "email": "reviewer.sen@aicte-india.org",
  "password": "Password123!",
  "role": "scrutiny_officer"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-2",
      "name": "Prof. Ananya Sen",
      "email": "reviewer.sen@aicte-india.org",
      "role": "scrutiny_officer",
      "designation": "Senior Scrutiny Officer",
      "department": "Western Regional Office (WRO)",
      "institutionId": null
    }
  }
}
```

#### `GET /api/auth/me`
Retrieve currently authenticated profile.
* **Access:** Any authenticated user (`Bearer <token>`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "usr-2",
    "name": "Prof. Ananya Sen",
    "email": "reviewer.sen@aicte-india.org",
    "role": "scrutiny_officer",
    "designation": "Senior Scrutiny Officer",
    "department": "Western Regional Office (WRO)"
  }
}
```

---

### 4.2 Dashboard Analytics

#### `GET /api/dashboard/summary`
Role-filtered KPI counters, stage distributions, and monthly trends.
* **Access:** Any authenticated user
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalApplications": 124,
      "pendingScrutiny": 38,
      "activeEVCs": 14,
      "overdueCompliance": 9,
      "approvedRate": "88.5%",
      "avgResolutionDays": 34
    },
    "stageDistribution": [
      { "stage": "Submitted", "count": 28, "color": "#3b82f6" },
      { "stage": "Scrutiny", "count": 38, "color": "#6366f1" },
      { "stage": "Re-Scrutiny", "count": 18, "color": "#f59e0b" },
      { "stage": "EVC Visit", "count": 14, "color": "#8b5cf6" },
      { "stage": "SAC Review", "count": 9, "color": "#ec4899" },
      { "stage": "Approved", "count": 17, "color": "#10b981" }
    ],
    "monthlyTrend": [
      { "month": "Jan 2026", "submitted": 48, "approved": 25, "overdue": 8 },
      { "month": "Feb 2026", "submitted": 35, "approved": 29, "overdue": 7 },
      { "month": "Mar 2026", "submitted": 29, "approved": 34, "overdue": 9 }
    ],
    "regionalBreakdown": [
      { "region": "Northern (NRO)", "count": 32 },
      { "region": "Western (WRO)", "count": 29 },
      { "region": "South-Western (SWRO)", "count": 26 },
      { "region": "Eastern (ERO)", "count": 18 },
      { "region": "Central (CRO)", "count": 19 }
    ]
  }
}
```

---

### 4.3 Applications

#### `GET /api/applications`
Retrieve paginated applications list with role-scoped visibility.
* **Access:** All authenticated users (Institutions only see their own records)
* **Query Parameters:**
  * `page` (integer, default `1`)
  * `limit` (integer, default `10`)
  * `search` (string: applicationNumber, institutionName, applicationType)
  * `stage` (`SUBMITTED | SCRUTINY | RE_SCRUTINY | EVC_SCHEDULED | EVC_COMPLETED | SAC_REVIEW | APPROVED | REJECTED`)
  * `institutionId` (string)
  * `region` (string)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "APP-2026-0041",
      "applicationNumber": "AICTE/2026/0041",
      "institutionId": "INST-2024-DEL-089",
      "institutionName": "Delhi Institute of Technology & Management",
      "region": "North-West (NWRO)",
      "applicationType": "Extension of Approval (EOA) + New Course (AI & DS)",
      "currentStage": "EVC_SCHEDULED",
      "status": "In Progress",
      "assignedTo": "Prof. Ananya Sen",
      "assignedToId": "usr-2",
      "submittedAt": "2026-02-10T10:30:00Z",
      "targetResolutionDate": "2026-04-15T00:00:00Z",
      "intakeCapacityRequested": 180,
      "infrastructureAreaSqM": 14200,
      "landTenureType": "Owned (Perpetual Lease)",
      "deficiencyCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### `POST /api/applications`
Submit a new AICTE approval application.
* **Access:** `institution`, `admin`
* **Request Body:**
```json
{
  "institutionId": "INST-2024-DEL-089",
  "institutionName": "Delhi Institute of Technology & Management",
  "region": "North-West (NWRO)",
  "applicationType": "Extension of Approval (EOA) + New Course (AI & DS)",
  "intakeCapacityRequested": 180,
  "infrastructureAreaSqM": 14200,
  "landTenureType": "Owned (Perpetual Lease)",
  "notes": "Initial submission with all statutory annexures."
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "APP-2026-0046",
    "applicationNumber": "AICTE/2026/0046",
    "currentStage": "SUBMITTED",
    "status": "Under Review",
    "submittedAt": "2026-10-24T10:00:00Z",
    "stageHistory": [
      {
        "stage": "SUBMITTED",
        "action": "Application Submitted Online",
        "actor": "Principal & Authorized Signatory",
        "timestamp": "2026-10-24T10:00:00Z",
        "notes": "Initial submission with all statutory annexures."
      }
    ]
  }
}
```

#### `GET /api/applications/:id`
Fetch complete application details, full audit history, and document checklist.
* **Access:** All authenticated roles (scoped by institutionId for `institution` role)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "APP-2026-0041",
    "applicationNumber": "AICTE/2026/0041",
    "institutionId": "INST-2024-DEL-089",
    "institutionName": "Delhi Institute of Technology & Management",
    "currentStage": "EVC_SCHEDULED",
    "status": "In Progress",
    "stageHistory": [
      {
        "stage": "SUBMITTED",
        "action": "Application Submitted Online",
        "actor": "Dr. K. S. Sundaram",
        "timestamp": "2026-02-10T10:30:00Z",
        "notes": "Submitted initial forms and fee receipt."
      },
      {
        "stage": "SCRUTINY",
        "action": "Deficiency Notice Issued",
        "actor": "Prof. Ananya Sen",
        "timestamp": "2026-02-22T14:15:00Z",
        "notes": "Fire safety certificate renewal copy was past 3-year threshold."
      }
    ],
    "documents": [
      {
        "id": "doc-01",
        "name": "Fire Safety NOC Renewal.pdf",
        "size": "2.4 MB",
        "uploadDate": "2026-03-04",
        "status": "Verified"
      }
    ]
  }
}
```

#### `PATCH /api/applications/:id/stage`
Transition the application to a new stage along with audit notes.
* **Access:** `scrutiny_officer`, `evc_coordinator`, `committee_officer`, `admin` (enforced via transition matrix)
* **Request Body:**
```json
{
  "nextStage": "EVC_SCHEDULED",
  "notes": "All scrutiny deficiencies cleared. Recommending on-site physical visit.",
  "action": "Expert Visit Committee Scheduled"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "APP-2026-0041",
    "currentStage": "EVC_SCHEDULED",
    "status": "In Progress",
    "stageHistory": [ ... ]
  }
}
```

#### `GET /api/applications/:id/documents`
Fetch documents associated with an application.
* **Access:** All authenticated roles
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-01",
      "name": "Fire Safety NOC Renewal.pdf",
      "size": "2.4 MB",
      "uploadDate": "2026-03-04",
      "status": "Verified",
      "documentType": "Statutory NOC"
    }
  ]
}
```

#### `POST /api/applications/:id/documents`
Upload / attach a supporting compliance document.
* **Access:** `institution`, `admin`
* **Request Body:**
```json
{
  "name": "Renewed_Occupancy_Certificate_2026.pdf",
  "size": "3.8 MB",
  "documentType": "Infrastructure",
  "documentUrl": "https://storage.aicte.gov.in/docs/inst-089/occ-2026.pdf",
  "status": "Pending Review"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "doc-109",
    "name": "Renewed_Occupancy_Certificate_2026.pdf",
    "status": "Pending Review",
    "uploadedAt": "2026-10-24T10:30:00Z"
  }
}
```

---

### 4.4 Compliance Monitoring

#### `GET /api/compliance`
List compliance obligations and deadlines.
* **Access:** All authenticated users (scoped for institutions)
* **Query Parameters:** `status` (`Pending | Under Review | Complied | Overdue`), `criticality` (`High | Medium | Normal`), `search`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "CMP-102",
      "applicationId": "APP-2026-0041",
      "institutionName": "Delhi Institute of Technology & Management",
      "requirementType": "Perpetual Land Lease Undertaking",
      "description": "Registered Lease Agreement renewal certifying min 30 years.",
      "dueDate": "2026-03-20T00:00:00Z",
      "status": "Overdue",
      "criticality": "High",
      "documentReference": "Land_Lease_Pending_Draft.pdf",
      "lastNotifiedAt": "2026-03-18T08:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

#### `POST /api/compliance`
Register a new compliance requirement for an institution or application.
* **Access:** `scrutiny_officer`, `committee_officer`, `admin`
* **Request Body:**
```json
{
  "applicationId": "APP-2026-0041",
  "institutionName": "Delhi Institute of Technology & Management",
  "requirementType": "Fire Safety Certificate & NOC",
  "description": "Submission of 3-year recurring Fire Safety Compliance certificate.",
  "dueDate": "2026-05-10T00:00:00Z",
  "criticality": "High"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "CMP-107",
    "status": "Pending",
    "createdAt": "2026-10-24T10:45:00Z"
  }
}
```

---

### 4.5 Alerts & Notifications

#### `GET /api/alerts`
Fetch user/role specific alerts (upcoming deadlines, overdue notices).
* **Access:** All authenticated users
* **Query Parameters:** `unreadOnly` (boolean), `severity` (`danger | warning | info`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ALT-501",
      "type": "CRITICAL",
      "title": "Overdue Compliance: Land Lease Submission",
      "message": "Delhi Institute of Technology & Management has passed due date for Perpetual Land Lease Renewal.",
      "applicationId": "APP-2026-0041",
      "institutionName": "Delhi Institute of Technology & Management",
      "dueAt": "2026-03-20T00:00:00Z",
      "createdAt": "2026-03-21T00:00:00Z",
      "read": false,
      "severity": "danger"
    }
  ]
}
```

#### `PATCH /api/alerts/:id/acknowledge`
Acknowledge/mark an alert as read.
* **Alias Supported for Frontend:** `PATCH /api/alerts/:id/read`
* **Access:** Alert recipient or `admin`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "ALT-501",
    "read": true,
    "acknowledgedAt": "2026-10-24T11:00:00Z"
  }
}
```

---

### 4.6 Expert Visit Committee (EVC)

#### `GET /api/evc`
Retrieve scheduled and completed on-site inspections.
* **Access:** `evc_coordinator`, `committee_officer`, `admin`, `scrutiny_officer`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "EVC-701",
      "applicationId": "APP-2026-0041",
      "institutionName": "Delhi Institute of Technology & Management",
      "visitDate": "2026-03-28T09:30:00Z",
      "status": "Scheduled",
      "committeeLead": "Prof. R. C. Mathur (IIT Roorkee)",
      "committeeMembers": [
        "Prof. R. C. Mathur (Chairperson)",
        "Dr. Meenakshi Iyer (Architectural Expert, SPA Delhi)",
        "Prof. Arvind Srivastav (AI Subject Expert)"
      ],
      "inspectionScope": "Physical AI Lab setup, Classroom acoustic standards",
      "venueAddress": "Sector 62, Institutional Area, Knowledge Park, New Delhi",
      "reportSubmitted": false
    }
  ]
}
```

#### `POST /api/evc`
Schedule an EVC physical inspection.
* **Alias Supported for Frontend:** `POST /api/evc/schedule`
* **Access:** `evc_coordinator`, `admin`
* **Request Body:**
```json
{
  "applicationId": "APP-2026-0041",
  "institutionName": "Delhi Institute of Technology & Management",
  "visitDate": "2026-04-10T10:00:00Z",
  "committeeLead": "Prof. R. C. Mathur (IIT Roorkee)",
  "committeeMembers": [
    "Prof. R. C. Mathur (Chairperson)",
    "Dr. Meenakshi Iyer (Architectural Expert)"
  ],
  "inspectionScope": "Greenfield site clearance & lab infrastructure",
  "venueAddress": "Sector 62, Knowledge Park, New Delhi"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "EVC-704",
    "status": "Scheduled",
    "createdAt": "2026-10-24T11:15:00Z"
  }
}
```

---

## 5. Review & Agreement Protocol

Before finalizing this contract into production:
1. **Frontend Agreement:** Confirm compatibility with `client/src/services/api.js` method contracts.
2. **Backend Agreement:** Confirm Mongoose models and validation rules in `server/src/models/`.
3. **Endpoint Aliases:** Both `/status` and `/stage` on application transitions, and both `/acknowledge` and `/read` on alerts are supported to prevent breaking either layer during development.
