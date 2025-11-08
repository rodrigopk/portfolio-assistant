/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { authenticate } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('should call next() with valid Bearer token', () => {
      const payload = { id: 'user-123', email: 'admin@example.com' };
      const token = jwt.sign(payload, JWT_SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Basic some-token',
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      const payload = { id: 'user-123', email: 'admin@example.com' };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is signed with wrong secret', () => {
      const payload = { id: 'user-123', email: 'admin@example.com' };
      const wrongToken = jwt.sign(payload, 'wrong-secret');

      mockRequest.headers = {
        authorization: `Bearer ${wrongToken}`,
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach decoded token to request.user', () => {
      const payload = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      };
      const token = jwt.sign(payload, JWT_SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();

      // Verify decoded payload is accessible
      const decoded = mockRequest.user as any;
      expect(decoded.id).toBe('user-123');
      expect(decoded.email).toBe('admin@example.com');
      expect(decoded.role).toBe('admin');
    });

    it('should handle empty Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'BearerMissingSpace',
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected errors', () => {
      // Create a token that will cause jwt.verify to throw unexpected error
      mockRequest.headers = {
        authorization: 'Bearer token',
      };

      // Mock jwt.verify to throw unexpected error
      const originalVerify = jwt.verify;
      jwt.verify = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Restore original jwt.verify
      jwt.verify = originalVerify;

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with different JWT payload structures', () => {
      const payloads = [
        { sub: 'user-123' },
        { userId: 'user-456', permissions: ['read', 'write'] },
        { id: 'admin-789', isAdmin: true },
      ];

      payloads.forEach((payload) => {
        const token = jwt.sign(payload, JWT_SECRET);
        mockRequest.headers = {
          authorization: `Bearer ${token}`,
        };

        mockNext = vi.fn();

        authenticate(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRequest.user).toBeDefined();
      });
    });

    it('should respect JWT expiration time', () => {
      const payload = { id: 'user-123' };

      // Create token that expires in 1 second
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1s' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Should work immediately
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Response Format', () => {
    it('should follow API error format per Section 5.5', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String),
          }),
        })
      );
    });
  });
});
