import { Request, Response } from 'express';
import { describe, it, expect, vi } from 'vitest';

import { notFoundHandler } from '../middleware/notFoundHandler';

describe('Not Found Handler', () => {
  it('should return 404 with proper error message', () => {
    const mockRequest = {
      method: 'GET',
      path: '/api/nonexistent',
    } as Request;

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    notFoundHandler(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/nonexistent not found',
      },
    });
  });

  it('should handle different HTTP methods', () => {
    const mockRequest = {
      method: 'POST',
      path: '/api/test',
    } as Request;

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    notFoundHandler(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Route POST /api/test not found',
      },
    });
  });

  it('should handle root path', () => {
    const mockRequest = {
      method: 'DELETE',
      path: '/',
    } as Request;

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    notFoundHandler(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Route DELETE / not found',
      },
    });
  });
});
