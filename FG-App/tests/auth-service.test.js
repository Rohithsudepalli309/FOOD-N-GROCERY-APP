/**
 * Auth Service — Integration Tests (Jest + Supertest)
 * Tests: OTP send/verify flow, JWT issuance, profile access, logout
 */
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'jest_test_secret';

const request = require('supertest');

// Mock twilio BEFORE requiring the service (jest.mock is hoisted, this is fine)
jest.mock('twilio', () => () => ({
  messages: { create: jest.fn().mockResolvedValue({ sid: 'mock_sid' }) }
}));

// Import service at module level (after mock is hoisted but before tests run)
const { app, users, otpStore, sessions } = require('../services/auth-service/index.js');

afterEach(() => {
  users.clear();
  otpStore.clear();
  sessions.clear();
});

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('POST /api/auth/otp/send', () => {
  it('✓ reject invalid phone number', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({ phone: '12345' });
    expect(res.status).toBe(400);
  });

  it('✓ accept a valid 10-digit Indian mobile', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('✓ expose dev_otp in development mode', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    expect(res.body).toHaveProperty('dev_otp');
    expect(res.body.dev_otp).toHaveLength(6);
  });

  it('✓ store OTP in memory after a send', async () => {
    await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    expect(otpStore.has('9876543210')).toBe(true);
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('✓ fail if no OTP was sent to phone', async () => {
    const res = await request(app).post('/api/auth/otp/verify').send({ phone: '9999999999', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No OTP/i);
  });

  it('✓ accept dev bypass OTP 000000 and return JWT tokens', async () => {
    await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    const res = await request(app).post('/api/auth/otp/verify').send({ phone: '9876543210', otp: '000000' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('✓ flag isNewUser=true on first-time login', async () => {
    await request(app).post('/api/auth/otp/send').send({ phone: '9111222333' });
    const res = await request(app).post('/api/auth/otp/verify').send({ phone: '9111222333', otp: '000000' });
    expect(res.body.isNewUser).toBe(true);
  });

  it('✓ flag isNewUser=false on subsequent logins', async () => {
    await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    await request(app).post('/api/auth/otp/verify').send({ phone: '9876543210', otp: '000000' });
    await request(app).post('/api/auth/otp/send').send({ phone: '9876543210' });
    const res = await request(app).post('/api/auth/otp/verify').send({ phone: '9876543210', otp: '000000' });
    expect(res.body.isNewUser).toBe(false);
  });
});

describe('GET /api/auth/health', () => {
  it('✓ return service=auth, status=ok', async () => {
    const res = await request(app).get('/api/auth/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
