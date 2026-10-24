import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('API Health and Root Endpoints', () => {
  it('GET /api should return API service information', async () => {
    const res = await request(app).get('/api');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.message, 'string');
    assert.ok(res.body.endpoints.health);
  });

  it('GET /api/health should return health metrics and 200 status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(['healthy', 'degraded'].includes(res.body.data.status));
    assert.equal(typeof res.body.data.uptime, 'number');
    assert.ok(res.body.data.timestamp);
    assert.ok(res.body.data.database);
    assert.ok(typeof res.body.data.database.readyState === 'number');
  });

  it('GET /api/nonexistent-route should return 404 with structured error', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
    assert.equal(res.body.error.statusCode, 404);
  });
});
