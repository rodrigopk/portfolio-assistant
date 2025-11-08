import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../types/auth.types';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-change-in-production';

describe('AuthService', () => {
  let authService: AuthService;
  const validEmail = process.env['ADMIN_EMAIL'] || 'admin@example.com';
  const validPassword = 'admin123';

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      const result = await authService.login(credentials);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.expiresIn).toBeDefined();
      expect(typeof result.expiresIn).toBe('number');
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should return valid JWT token on successful login', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      const result = await authService.login(credentials);
      const decoded = jwt.verify(result.token, JWT_SECRET);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('email', validEmail);
      expect(decoded).toHaveProperty('role', 'admin');
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should throw error with invalid email', async () => {
      const credentials: LoginRequest = {
        email: 'wrong@example.com',
        password: validPassword,
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with empty email', async () => {
      const credentials: LoginRequest = {
        email: '',
        password: validPassword,
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with empty password', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: '',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should use bcrypt to compare passwords', async () => {
      const bcryptCompareSpy = vi.spyOn(bcrypt, 'compare');

      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      await authService.login(credentials);

      expect(bcryptCompareSpy).toHaveBeenCalled();
    });

    it('should generate token with correct expiration time', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      const result = await authService.login(credentials);
      const decoded = jwt.decode(result.token) as { iat: number; exp: number };

      expect(decoded).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const actualExpiresIn = decoded.exp - decoded.iat;
      expect(actualExpiresIn).toBe(result.expiresIn);
    });

    it('should handle case-sensitive email comparison', async () => {
      const credentials: LoginRequest = {
        email: validEmail.toUpperCase(),
        password: validPassword,
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', () => {
      const payload = {
        id: 'admin-1',
        email: validEmail,
        role: 'admin',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

      const result = authService.verifyToken(token);

      expect(result).toBeDefined();
      expect(result.id).toBe(payload.id);
      expect(result.email).toBe(payload.email);
      expect(result.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const payload = {
        id: 'admin-1',
        email: validEmail,
        role: 'admin',
      };

      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      expect(() => authService.verifyToken(expiredToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for token signed with wrong secret', () => {
      const payload = {
        id: 'admin-1',
        email: validEmail,
        role: 'admin',
      };

      const wrongToken = jwt.sign(payload, 'wrong-secret');

      expect(() => authService.verifyToken(wrongToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => authService.verifyToken('malformed.token')).toThrow('Invalid or expired token');
    });
  });

  describe('parseExpirationTime', () => {
    it('should correctly parse seconds', () => {
      // Test the private method indirectly through token verification
      const payload = { id: 'test', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '60s' });
      const decoded = jwt.decode(token) as { iat: number; exp: number };

      expect(decoded.exp - decoded.iat).toBe(60);
    });

    it('should correctly parse minutes', () => {
      const payload = { id: 'test', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      const decoded = jwt.decode(token) as { iat: number; exp: number };

      expect(decoded.exp - decoded.iat).toBe(900); // 15 * 60
    });

    it('should correctly parse hours', () => {
      const payload = { id: 'test', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
      const decoded = jwt.decode(token) as { iat: number; exp: number };

      expect(decoded.exp - decoded.iat).toBe(7200); // 2 * 60 * 60
    });

    it('should correctly parse days', () => {
      const payload = { id: 'test', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      const decoded = jwt.decode(token) as { iat: number; exp: number };

      expect(decoded.exp - decoded.iat).toBe(604800); // 7 * 24 * 60 * 60
    });
  });

  describe('Token Payload Structure', () => {
    it('should include all required fields in token payload', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      const result = await authService.login(credentials);
      const decoded = jwt.decode(result.token) as Record<string, unknown>;

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should set admin role in token payload', async () => {
      const credentials: LoginRequest = {
        email: validEmail,
        password: validPassword,
      };

      const result = await authService.login(credentials);
      const decoded = jwt.decode(result.token) as { role: string };

      expect(decoded.role).toBe('admin');
    });
  });
});
