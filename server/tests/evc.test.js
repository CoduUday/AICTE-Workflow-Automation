import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { EVCVisit } from '../src/models/EVCVisit.js';

describe('EVC Module & Conflict Detection Tests', () => {
  let adminToken;
  let evcToken;
  let instToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.rajesh@aicte-india.org', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    const evcRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'evc.mathur@aicte-india.org', password: 'Password123!' });
    evcToken = evcRes.body.data.token;

    const instRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@dit-edu.in', password: 'Password123!' });
    instToken = instRes.body.data.token;

    await EVCVisit.deleteMany({
      $or: [
        { id: /^EVC-TEST-/ },
        { committeeLead: /Dr\. A\. K\. Verma|Prof\. Unique Lead|Prof\. Test/ },
      ],
    });
  });

  after(async () => {
    await EVCVisit.deleteMany({
      $or: [
        { id: /^EVC-TEST-/ },
        { committeeLead: /Dr\. A\. K\. Verma|Prof\. Unique Lead|Prof\. Test/ },
      ],
    });
    await disconnectDB();
  });

  it('POST /api/evc - should schedule a visit when no conflicts exist', async () => {
    const res = await request(app)
      .post('/api/evc')
      .set('Authorization', `Bearer ${evcToken}`)
      .send({
        applicationId: 'APP-2026-0041',
        institutionId: 'INST-2024-DEL-089',
        institutionName: 'Delhi Institute of Technology & Management',
        visitDate: '2026-06-10T10:00:00Z',
        committeeLead: 'Dr. A. K. Verma',
        committeeMembers: ['Dr. A. K. Verma', 'Prof. Priya Sen'],
        inspectionScope: 'Laboratory validation',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.committeeLead, 'Dr. A. K. Verma');
  });

  it('Conflict Detection: should reject scheduling when committee lead is double booked', async () => {
    // Attempt to book Dr. A. K. Verma on the exact same date for a different institution
    const res = await request(app)
      .post('/api/evc')
      .set('Authorization', `Bearer ${evcToken}`)
      .send({
        applicationId: 'APP-2026-0042',
        institutionId: 'INST-2024-BLR-012',
        institutionName: 'Karnataka Institute of Advanced Robotics & AI',
        visitDate: '2026-06-10T14:00:00Z', // Same day!
        committeeLead: 'Dr. A. K. Verma',
        committeeMembers: ['Dr. A. K. Verma'],
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Scheduling Conflict'));
    assert.ok(res.body.error.message.includes('Dr. A. K. Verma'));
  });

  it('Conflict Detection: should reject scheduling when a committee member is double booked', async () => {
    // Attempt to book Prof. Priya Sen as a member on the same day elsewhere
    const res = await request(app)
      .post('/api/evc')
      .set('Authorization', `Bearer ${evcToken}`)
      .send({
        applicationId: 'APP-2026-0042',
        institutionId: 'INST-2024-BLR-012',
        institutionName: 'Karnataka Institute of Advanced Robotics & AI',
        visitDate: '2026-06-10T11:00:00Z',
        committeeLead: 'Prof. Unique Lead',
        committeeMembers: ['Prof. Unique Lead', 'Prof. Priya Sen'],
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Scheduling Conflict'));
    assert.ok(res.body.error.message.includes('Prof. Priya Sen'));
  });

  it('Rescheduling: should allow rescheduling and record audit history', async () => {
    const created = await EVCVisit.create({
      id: 'EVC-TEST-999',
      applicationId: 'APP-2026-0041',
      institutionId: 'INST-2024-DEL-089',
      institutionName: 'Delhi Institute',
      visitDate: new Date('2026-07-01T10:00:00Z'),
      committeeLead: 'Prof. Test Reschedule Lead',
      committeeMembers: ['Prof. Test Reschedule Lead'],
    });

    const res = await request(app)
      .patch(`/api/evc/${created.id}`)
      .set('Authorization', `Bearer ${evcToken}`)
      .send({
        newVisitDate: '2026-07-05T10:00:00Z',
        reason: 'Severe weather advisory delayed travel flights.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'Rescheduled');
    assert.equal(res.body.data.rescheduleHistory.length, 1);
    assert.equal(res.body.data.rescheduleHistory[0].reason, 'Severe weather advisory delayed travel flights.');
  });
});
