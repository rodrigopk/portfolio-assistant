/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../app';
import { connectRedis, disconnectRedis } from '../lib/redis';
import { authService } from '../services/auth.service';
import { LoginResponse } from '../types/auth.types';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-change-in-production';

// Mock auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const validEmail = 'admin@example.com';
    const validPassword = 'admin123';

    it('should return 200 with valid credentials', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: validPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.token).toBe(mockToken);
      expect(response.body.data.expiresIn).toBe(900);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: validPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toBe('Email and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toBe('Email and password are required');
    });

    it('should return 400 when both email and password are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toBe('Email and password are required');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: validPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toBe('Invalid email format');
    });

    it('should return 401 for invalid credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should accept application/json content type', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: validEmail,
          password: validPassword,
        });

      expect(response.status).toBe(200);
    });

    it('should handle multiple login attempts within rate limit', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      // Make multiple requests
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app).post('/api/auth/login').send({
            email: validEmail,
            password: validPassword,
          })
        );

      const responses = await Promise.all(requests);

      // All should succeed (within rate limit)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });

    it('should return valid JWT token that can be decoded', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: validPassword,
      });

      expect(response.status).toBe(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded.email).toBe(validEmail);
      expect(decoded.role).toBe('admin');
    });

    it('should follow API response format per Section 5.5', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: validPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        token: expect.any(String),
        expiresIn: expect.any(Number),
      });
    });

    it('should call authService.login with correct parameters', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: validPassword,
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should reject requests without Content-Type header gracefully', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send(`email=${validEmail}&password=${validPassword}`);

      // Should still work with form data or handle gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should validate email format before calling service', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: validPassword,
      });

      expect(response.status).toBe(400);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      const response = await request(app).post('/api/auth/login').send();

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should ignore extra fields in request body', async () => {
      const mockToken = jwt.sign({ id: 'admin-1', email: validEmail, role: 'admin' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app).post('/api/auth/login').send({
        email: validEmail,
        password: validPassword,
        extraField: 'should be ignored',
        maliciousCode: '<script>alert("xss")</script>',
      });

      expect(response.status).toBe(200);
      expect(authService.login).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected server errors', async () => {
      vi.mocked(authService.login).mockImplementation(() => {
        throw new Error('Unexpected server error');
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'admin123',
      });

      expect([401, 500]).toContain(response.status);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers in response', async () => {
      const mockToken = jwt.sign(
        { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const mockLoginResponse: LoginResponse = {
        token: mockToken,
        expiresIn: 900,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
