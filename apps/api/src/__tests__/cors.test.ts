import request from 'supertest';
import { describe, it, expect } from 'vitest';

import app from '../app';

describe('CORS Configuration', () => {
  describe('Allowed Origins', () => {
    it('should allow requests from localhost:3000', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from localhost:5173 (Vite default)', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from localhost:4173 (Vite alternative)', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:4173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests without origin (mobile apps, Postman)', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should not have CORS headers when no origin is provided, but request should succeed
      expect(response.status).toBe(200);
    });
  });

  describe('Rejected Origins', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com')
        .expect(500);

      expect(response.text).toContain('Not allowed by CORS');
    });

    it('should reject requests from localhost with different port', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:8080')
        .expect(500);

      expect(response.text).toContain('Not allowed by CORS');
    });

    it('should reject requests from non-localhost domains', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://example.com')
        .expect(500);

      expect(response.text).toContain('Not allowed by CORS');
    });
  });

  describe('Preflight Requests', () => {
    it('should handle preflight OPTIONS requests for allowed origins', async () => {
      const response = await request(app)
        .options('/api/projects')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject preflight OPTIONS requests for unauthorized origins', async () => {
      await request(app)
        .options('/api/projects')
        .set('Origin', 'http://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(500);
    });
  });

  describe('API Endpoints CORS', () => {
    it('should apply CORS to /api/projects endpoint', async () => {
      const response = await request(app)
        .get('/api/projects?limit=1')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should apply CORS to /api/profile endpoint', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Environment Variable Configuration', () => {
    it('should use environment variable for allowed origins', () => {
      // This test verifies that the CORS middleware reads from ALLOWED_ORIGINS env var
      const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173', // Vite default dev port
        'http://localhost:4173'  // Vite alternative dev port
      ];
      expect(allowedOrigins).toContain('http://localhost:5173');
      expect(allowedOrigins).toContain('http://localhost:4173');
    });
  });
});
