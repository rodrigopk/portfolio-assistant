/**
 * Authentication Types
 * Per TECHNICAL_DOCUMENTATION.md Section 5.3
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number; // in seconds
}

export interface TokenPayload {
  id: string;
  email: string;
  role?: string;
}
