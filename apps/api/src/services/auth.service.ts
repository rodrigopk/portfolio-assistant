import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { LoginRequest, LoginResponse, TokenPayload } from '../types/auth.types';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '15m';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'admin@example.com';
const ADMIN_PASSWORD_HASH =
  process.env['ADMIN_PASSWORD_HASH'] ||
  // Default: bcrypt hash of "admin123" - MUST be changed in production
  '$2a$10$h2wYhwt16Ddb7YHYG3BsBuLrJxQRUPouz.kijps9rGHbauDoXwZHO';

/**
 * Authentication Service
 * Handles admin login and JWT token generation
 * Per TECHNICAL_DOCUMENTATION.md Section 5.3 and 9.1
 */
export class AuthService {
  /**
   * Authenticate admin user and generate JWT token
   * @param credentials - Login credentials (email and password)
   * @returns Login response with JWT token and expiration time
   * @throws Error if credentials are invalid
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      // Validate credentials
      if (email !== ADMIN_EMAIL) {
        logger.warn('Login attempt with invalid email', { email });
        throw new Error('Invalid credentials');
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { email });
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const payload: TokenPayload = {
        id: 'admin-1',
        email: ADMIN_EMAIL,
        role: 'admin',
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as string,
      } as jwt.SignOptions);

      // Calculate expiration time in seconds
      const expiresIn = this.parseExpirationTime(JWT_EXPIRES_IN);

      logger.info('Admin login successful', { email });

      return {
        token,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error in login service:', error);
      throw error;
    }
  }

  /**
   * Parse JWT expiration time string to seconds
   * @param expiresIn - Expiration string (e.g., "15m", "7d", "1h")
   * @returns Expiration time in seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default: 15 minutes
    }
  }

  /**
   * Verify JWT token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw new Error('Invalid or expired token');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
