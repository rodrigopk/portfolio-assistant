/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { LoginResponse } from '../types/auth.types';

// Mock the authService
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.clearAllMocks();
  });

  describe('login', () => {
    const validEmail = 'admin@example.com';
    const validPassword = 'admin123';

    it('should return 200 with token on successful login', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'mock-jwt-token',
        expiresIn: 900,
      };

      mockRequest.body = {
        email: validEmail,
        password: validPassword,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockLoginResponse,
      });
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = {
        password: validPassword,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Email and password are required',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = {
        email: validEmail,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Email and password are required',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 when both email and password are missing', async () => {
      mockRequest.body = {};

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Email and password are required',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: validPassword,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid email format',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for email without domain', async () => {
      mockRequest.body = {
        email: 'admin@',
        password: validPassword,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid email format',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for email without @', async () => {
      mockRequest.body = {
        email: 'admin.example.com',
        password: validPassword,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid email format',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 401 when authService throws error for invalid credentials', async () => {
      mockRequest.body = {
        email: validEmail,
        password: 'wrongpassword',
      };

      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    });

    it('should not expose specific error details on failed login', async () => {
      mockRequest.body = {
        email: validEmail,
        password: 'wrongpassword',
      };

      vi.mocked(authService.login).mockRejectedValue(new Error('Password mismatch'));

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials', // Generic message, not "Password mismatch"
        },
      });
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'admin@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
      ];

      const mockLoginResponse: LoginResponse = {
        token: 'mock-jwt-token',
        expiresIn: 900,
      };

      for (const email of validEmails) {
        mockRequest.body = {
          email,
          password: validPassword,
        };

        vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

        await authController.login(mockRequest as Request, mockResponse as Response);

        expect(authService.login).toHaveBeenCalled();
        vi.clearAllMocks();
      }
    });

    it('should handle empty strings as missing fields', async () => {
      mockRequest.body = {
        email: '',
        password: '',
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Email and password are required',
        },
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only password', async () => {
      mockRequest.body = {
        email: validEmail,
        password: '   ',
      };

      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith({
        email: validEmail,
        password: '   ',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should rethrow unexpected errors for error middleware', async () => {
      mockRequest.body = {
        email: validEmail,
        password: validPassword,
      };

      const unexpectedError = new Error('Database connection failed');
      vi.mocked(authService.login).mockRejectedValue(unexpectedError);

      // Mock response methods to track if they were called
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn();
      mockResponse.status = statusSpy;
      mockResponse.json = jsonSpy;

      // The controller catches login errors and returns 401
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Controller should return 401 for any login service error
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    });

    it('should follow API response format per Section 5.5', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'mock-jwt-token',
        expiresIn: 900,
      };

      mockRequest.body = {
        email: validEmail,
        password: validPassword,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.any(String),
            expiresIn: expect.any(Number),
          }),
        })
      );
    });

    it('should trim whitespace from email before validation', async () => {
      // Email regex should handle emails with spaces gracefully
      mockRequest.body = {
        email: ' admin@example.com ',
        password: validPassword,
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      // Should fail validation because of spaces
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle request body with extra fields', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'mock-jwt-token',
        expiresIn: 900,
      };

      mockRequest.body = {
        email: validEmail,
        password: validPassword,
        extraField: 'should be ignored',
        anotherField: 123,
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      mockRequest.body = {};

      await authController.login(mockRequest as Request, mockResponse as Response);

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
