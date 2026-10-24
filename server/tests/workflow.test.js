import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Application } from '../src/models/Application.js';
import { WORKFLOW_STAGES } from '../src/config/workflow.js';

describe('Application Workflow & RBAC Access Control Tests', () => {
  let adminToken;
  let scrutinyToken;
  let delInstitutionToken; // INST-2024-DEL-089
  let blrInstitutionToken; // INST-2024-BLR-012
  let testAppId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // Login users to acquire JWT tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.rajesh@aicte-india.org', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    const scrutinyRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reviewer.sen@aicte-india.org', password: 'Password123!' });
    scrutinyToken = scrutinyRes.body.data.token;

    const delInstRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@dit-edu.in', password: 'Password123!' });
    delInstitutionToken = delInstRes.body.data.token;

    const blrInstRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@kiara-edu.in', password: 'Password123!' });
    blrInstitutionToken = blrInstRes.body.data.token;

    // Create a fresh test application in SUBMITTED state for Delhi Institute
    const createdApp = await Application.create({
      id: 'APP-TEST-9999',
      applicationNumber: 'AICTE/2026/9999',
      institutionId: 'INST-2024-DEL-089',
      institutionName: 'Delhi Institute of Technology & Management',
      region: 'North-West (NWRO)',
      applicationType: 'New Degree Course in Robotics',
      currentStage: WORKFLOW_STAGES.SUBMITTED,
      status: 'Submitted',
      stageHistory: [
        {
          stage: WORKFLOW_STAGES.SUBMITTED,
          action: 'Initial Submission',
          actor: 'Dr. K. S. Sundaram',
          actorRole: 'institution',
          notes: 'Test submission for automated testing.',
          timestamp: new Date(),
        },
      ],
    });

    testAppId = createdApp.id;
  });

  after(async () => {
    await Application.deleteOne({ id: 'APP-TEST-9999' });
    await disconnectDB();
  });

  it('GET /api/applications - should filter applications by role (institution isolation)', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${delInstitutionToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Every application returned must belong to Delhi Institute
    for (const appItem of res.body.data) {
      assert.equal(appItem.institutionId, 'INST-2024-DEL-089');
    }
  });

  it('GET /api/applications/:id - should forbid institution from viewing another institution application', async () => {
    // BLR user trying to access DEL application
    const res = await request(app)
      .get(`/api/applications/${testAppId}`)
      .set('Authorization', `Bearer ${blrInstitutionToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('not authorized'));
  });

  it('PATCH /api/applications/:id/stage - should forbid institution from executing officer stage transition', async () => {
    // Institution trying to move SUBMITTED -> SCRUTINY
    const res = await request(app)
      .patch(`/api/applications/${testAppId}/stage`)
      .set('Authorization', `Bearer ${delInstitutionToken}`)
      .send({
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        notes: 'Institution attempting unauthorized self-review',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('not authorized'));
  });

  it('PATCH /api/applications/:id/stage - should reject invalid transition not in state machine', async () => {
    // Officer trying to leap from SUBMITTED directly to APPROVED (invalid skip)
    const res = await request(app)
      .patch(`/api/applications/${testAppId}/stage`)
      .set('Authorization', `Bearer ${scrutinyToken}`)
      .send({
        nextStage: WORKFLOW_STAGES.APPROVED,
        notes: 'Attempting invalid workflow skip',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Invalid workflow transition'));
  });

  it('PATCH /api/applications/:id/stage - should allow scrutiny_officer to transition SUBMITTED -> SCRUTINY', async () => {
    const res = await request(app)
      .patch(`/api/applications/${testAppId}/stage`)
      .set('Authorization', `Bearer ${scrutinyToken}`)
      .send({
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        notes: 'Document scrutiny commenced by West Regional Officer.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.currentStage, WORKFLOW_STAGES.SCRUTINY);
    assert.equal(res.body.data.status, 'Under Scrutiny');

    // Verify WorkflowEvent audit entry was added
    const history = res.body.data.stageHistory;
    const latestEvent = history[history.length - 1];
    assert.equal(latestEvent.stage, WORKFLOW_STAGES.SCRUTINY);
    assert.equal(latestEvent.previousStage, WORKFLOW_STAGES.SUBMITTED);
    assert.equal(latestEvent.actor, 'Prof. Ananya Sen');
    assert.equal(latestEvent.actorRole, 'scrutiny_officer');
    assert.ok(latestEvent.timestamp);
  });

  it('PATCH /api/applications/:id/stage - should allow scrutiny_officer to issue deficiency notice (SCRUTINY -> RE_SCRUTINY)', async () => {
    const res = await request(app)
      .patch(`/api/applications/${testAppId}/stage`)
      .set('Authorization', `Bearer ${scrutinyToken}`)
      .send({
        nextStage: WORKFLOW_STAGES.RE_SCRUTINY,
        notes: 'Cadre ratio deficit identified. Re-scrutiny notice dispatched.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.currentStage, WORKFLOW_STAGES.RE_SCRUTINY);
    assert.equal(res.body.data.status, 'Deficiencies Pending');
  });

  it('PATCH /api/applications/:id/stage - should permit institution to resubmit clarification (RE_SCRUTINY -> SCRUTINY)', async () => {
    const res = await request(app)
      .patch(`/api/applications/${testAppId}/stage`)
      .set('Authorization', `Bearer ${delInstitutionToken}`)
      .send({
        nextStage: WORKFLOW_STAGES.SCRUTINY,
        notes: 'Uploaded revised faculty appointments and updated affidavit.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.currentStage, WORKFLOW_STAGES.SCRUTINY);
    assert.equal(res.body.data.status, 'Resubmitted / Under Review');
  });

  it('POST /api/applications/:id/documents - should allow institution to attach compliance document', async () => {
    const res = await request(app)
      .post(`/api/applications/${testAppId}/documents`)
      .set('Authorization', `Bearer ${delInstitutionToken}`)
      .send({
        name: 'Revised_Faculty_Affidavit_2026.pdf',
        size: '1.2 MB',
        documentType: 'Faculty Data',
        status: 'Pending Review',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Revised_Faculty_Affidavit_2026.pdf');
  });
});
