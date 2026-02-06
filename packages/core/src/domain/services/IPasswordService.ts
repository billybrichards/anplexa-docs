/**
 * Password Service Interface
 *
 * Defines the contract for password hashing, verification, and API key operations.
 * Implementations should use bcrypt or equivalent secure hashing algorithms.
 */

export interface GeneratedApiKey {
  key: string;
  keyHash: string;
  keyPrefix: string;
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
  score: number;
}

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string): PasswordStrengthResult;
  generateApiKey(): Promise<GeneratedApiKey>;
  verifyApiKey(key: string, hash: string): Promise<boolean>;
}
