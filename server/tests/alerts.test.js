import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Alert } from '../src/models/Alert.js';
import { alertService } from '../src/services/alert.service.js';

describe('Alerts & Reminders Module Tests', () => {
  let adminToken;
  let instToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.rajesh@aicte-india.org', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    const instRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'principal@dit-edu.in', password: 'Password123!' });
    instToken = instRes.body.data.token;

    await Alert.deleteMany({ $or: [{ id: /^ALT-TEST-/ }, { dedupKey: /^TEST_/ }] });
  });

  after(async () => {
    await Alert.deleteMany({ $or: [{ id: /^ALT-TEST-/ }, { dedupKey: /^TEST_/ }] });
    await disconnectDB();
  });

  it('Deduplication: duplicate alerts with same dedupKey are suppressed', async () => {
    const dedupKey = `TEST_DEDUP_${Date.now()}`;

    // First creation -> new alert
    const firstResult = await alertService.createAlert({
      title: 'First Alert',
      message: 'Original message',
      severity: 'warning',
      dedupKey,
    });

    assert.equal(firstResult.isDuplicate, false);
    assert.ok(firstResult.alert);

    // Second creation with identical dedupKey -> suppressed, increments retryCount
    const secondResult = await alertService.createAlert({
      title: 'Duplicate Alert Attempt',
      message: 'Duplicate message',
      severity: 'warning',
      dedupKey,
    });

    assert.equal(secondResult.isDuplicate, true);
    assert.equal(secondResult.alert.id, firstResult.alert.id);
    assert.equal(secondResult.alert.retryCount, 1);
  });

  it('Escalation: overdue alert is escalated to admin with ESCALATION type', async () => {
    const alert = await Alert.create({
      id: 'ALT-TEST-888',
      recipientRole: 'institution',
      institutionId: 'INST-2024-DEL-089',
      institutionName: 'Delhi Institute',
      type: 'CRITICAL',
      title: 'Severe Overdue Compliance',
      message: 'Pending 5 days.',
      severity: 'danger',
      escalated: false,
    });

    await alertService.escalateOverdueAlert(alert);

    // Verify escalation alert created for Admin
    const escalationAlert = await Alert.findOne({ dedupKey: `ESCALATION_${alert.id}` });
    assert.ok(escalationAlert);
    assert.equal(escalationAlert.type, 'ESCALATION');
    assert.equal(escalationAlert.recipientRole, 'admin');
    assert.equal(escalationAlert.severity, 'danger');
  });

  it('GET /api/alerts - should retrieve scoped alerts for user', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${instToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('PATCH /api/alerts/:id/acknowledge - marks alert read', async () => {
    const created = await Alert.create({
      id: 'ALT-TEST-777',
      recipientRole: 'institution',
      title: 'Acknowledge test',
      message: 'Testing read status',
      read: false,
    });

    const res = await request(app)
      .patch(`/api/alerts/${created.id}/acknowledge`)
      .set('Authorization', `Bearer ${instToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.read, true);
    assert.ok(res.body.data.acknowledgedAt);
  });
});
