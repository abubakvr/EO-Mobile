/**
 * Authentication types based on API response
 */

export enum UserRole {
  CUSTODIAN = 'CUSTODIAN',
  // Add other roles as needed
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  region_id: number;
  ward_ids: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  message: string;
  user: User;
  /** Token lifetime in seconds (optional; app uses default if missing) */
  expires_in?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
