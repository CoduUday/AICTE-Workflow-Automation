import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

describe('Authentication & RBAC Tests', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  after(async () => {
    await disconnectDB();
  });

  it('POST /api/auth/login - should authenticate admin and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.rajesh@aicte-india.org',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'admin');
    assert.equal(res.body.data.user.email, 'admin.rajesh@aicte-india.org');
  });

  it('POST /api/auth/login - should authenticate scrutiny_officer successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'reviewer.sen@aicte-india.org',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'scrutiny_officer');
  });

  it('POST /api/auth/login - should authenticate institution user with institutionId', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'principal@dit-edu.in',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'institution');
    assert.equal(res.body.data.user.institutionId, 'INST-2024-DEL-089');
  });

  it('POST /api/auth/login - should reject invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.rajesh@aicte-india.org',
        password: 'WrongPassword456!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Invalid'));
  });

  it('POST /api/auth/login - should reject non-existent user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@fake-domain.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/auth/me - should return user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.rajesh@aicte-india.org',
        password: 'Password123!',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.data.email, 'admin.rajesh@aicte-india.org');
    assert.equal(meRes.body.data.role, 'admin');
  });

  it('GET /api/auth/me - should reject request without token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
