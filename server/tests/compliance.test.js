import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ComplianceItem } from '../src/models/ComplianceItem.js';
import { complianceService } from '../src/services/compliance.service.js';

describe('Compliance Module & Deadline Tests', () => {
  let adminToken;
  let scrutinyToken;
  let delInstitutionToken;
  let blrInstitutionToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.rajesh@aicte-india.org', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    const scrutinyRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reviewer.sen@aicte-india.org', password: 'Password123!' });
    scrutinyToken = scrutinyRes.body.data.token;

    const delRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@dit-edu.in', password: 'Password123!' });
    delInstitutionToken = delRes.body.data.token;

    const blrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@kiara-edu.in', password: 'Password123!' });
    blrInstitutionToken = blrRes.body.data.token;
  });

  after(async () => {
    await ComplianceItem.deleteMany({ id: /^CMP-TEST-/ });
    await disconnectDB();
  });

  it('Dynamic Status: should resolve correct states based on deadlines', () => {
    const now = new Date();

    // 1. Due in 15 days -> Pending
    const pendingItem = {
      dueDate: new Date(now.getTime() + 15 * 24 * 3600 * 1000),
      status: 'Pending',
    };
    assert.equal(complianceService.resolveDynamicStatus(pendingItem), 'Pending');

    // 2. Due in 3 days -> Due Soon
    const dueSoonItem = {
      dueDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
      status: 'Pending',
    };
    assert.equal(complianceService.resolveDynamicStatus(dueSoonItem), 'Due Soon');

    // 3. Due 2 days ago -> Overdue
    const overdueItem = {
      dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      status: 'Pending',
    };
    assert.equal(complianceService.resolveDynamicStatus(overdueItem), 'Overdue');

    // 4. Complied but expired -> Expired
    const expiredItem = {
      status: 'Complied',
      dueDate: new Date(now.getTime() - 50 * 24 * 3600 * 1000),
      expiryDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
    };
    assert.equal(complianceService.resolveDynamicStatus(expiredItem), 'Expired');
  });

  it('GET /api/compliance - should scope items for institution user', async () => {
    const res = await request(app)
      .get('/api/compliance')
      .set('Authorization', `Bearer ${delInstitutionToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    for (const item of res.body.data) {
      assert.equal(item.institutionId, 'INST-2024-DEL-089');
    }
  });

  it('POST /api/compliance - should allow scrutiny officer to create compliance item', async () => {
    const res = await request(app)
      .post('/api/compliance')
      .set('Authorization', `Bearer ${scrutinyToken}`)
      .send({
        applicationId: 'APP-2026-0041',
        institutionId: 'INST-2024-DEL-089',
        institutionName: 'Delhi Institute of Technology & Management',
        requirementType: 'Aadhaar Biometric Faculty Attendance Log',
        description: 'Submission of 6-month biometric logs for engineering faculty.',
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        criticality: 'High',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id.startsWith('CMP-'));
    assert.equal(res.body.data.requirementType, 'Aadhaar Biometric Faculty Attendance Log');
  });

  it('Evidence Submission & Verification workflow', async () => {
    // 1. Create a test item
    const created = await ComplianceItem.create({
      id: 'CMP-TEST-901',
      applicationId: 'APP-2026-0041',
      institutionId: 'INST-2024-DEL-089',
      institutionName: 'Delhi Institute of Technology & Management',
      requirementType: 'Fire Safety Certificate',
      description: 'Test fire safety proof',
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      status: 'Due Soon',
      criticality: 'High',
    });

    // 2. Institution submits evidence
    const submitRes = await request(app)
      .post(`/api/compliance/${created.id}/evidence`)
      .set('Authorization', `Bearer ${delInstitutionToken}`)
      .send({
        documentName: 'Municipal_Fire_NOC_2026.pdf',
        size: '2.1 MB',
        remarks: 'Uploaded renewed NOC.',
      });

    assert.equal(submitRes.status, 200);
    assert.equal(submitRes.body.data.status, 'Under Review');
    assert.equal(submitRes.body.data.evidence.length, 1);
    const evId = submitRes.body.data.evidence[0].id;

    // 3. Scrutiny officer verifies evidence
    const verifyRes = await request(app)
      .patch(`/api/compliance/${created.id}/evidence/${evId}/verify`)
      .set('Authorization', `Bearer ${scrutinyToken}`)
      .send({
        verificationStatus: 'Verified',
        remarks: 'Approved by regional fire safety inspector.',
      });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.data.status, 'Complied');
  });
});
