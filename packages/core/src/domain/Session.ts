/**
 * Session Domain Entity
 * Represents an authentication session with refresh token
 */
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Data required to create a new session
 */
export interface CreateSessionData {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
}
