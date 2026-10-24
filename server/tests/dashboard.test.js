import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Application } from '../src/models/Application.js';

describe('Dashboard Analytics & Summary Tests', () => {
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
  });

  after(async () => {
    await disconnectDB();
  });

  it('GET /api/dashboard/summary - should return complete metrics for admin', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const data = res.body.data;

    // Check KPIs
    assert.ok(typeof data.kpis.totalApplications === 'number');
    assert.ok(typeof data.kpis.pendingScrutiny === 'number');
    assert.ok(typeof data.kpis.activeEVCs === 'number');
    assert.ok(typeof data.kpis.overdueCompliance === 'number');
    assert.ok(typeof data.kpis.approvedRate === 'string');

    // Check Stage Distribution
    assert.ok(Array.isArray(data.stageDistribution));
    assert.ok(data.stageDistribution.length >= 6);

    // Check Ageing Buckets
    assert.ok(data.ageingBuckets);
    assert.ok(typeof data.ageingBuckets.under15Days === 'number');
    assert.ok(typeof data.ageingBuckets.over45Days === 'number');

    // Check Upcoming Deadlines
    assert.ok(Array.isArray(data.upcomingDeadlines));

    // Check Regional Breakdown
    assert.ok(Array.isArray(data.regionalBreakdown));
  });

  it('GET /api/dashboard/summary - should scope metrics for institution user', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${instToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Institution user should only see their own application count
    const delAppsCount = await Application.countDocuments({ institutionId: 'INST-2024-DEL-089' });
    assert.equal(res.body.data.kpis.totalApplications, delAppsCount);
  });
});
