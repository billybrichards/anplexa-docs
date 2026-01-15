import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Password Service Configuration
 */
export interface PasswordConfig {
  saltRounds?: number;      // Bcrypt salt rounds (10-12 recommended)
  minLength?: number;       // Minimum password length
}

/**
 * API Key generation result
 */
export interface GeneratedApiKey {
  key: string;              // The full API key (e.g., "tc_...")
  keyHash: string;          // Hashed version for storage
  keyPrefix: string;        // Prefix for display (e.g., "tc_abc...")
}

/**
 * Password Service
 * Handles password hashing, verification, and API key generation
 *
 * @example
 * const passwordService = new PasswordService();
 *
 * // Hash a password
 * const hash = await passwordService.hashPassword('user-password');
 *
 * // Verify a password
 * const isValid = await passwordService.verifyPassword('user-password', hash);
 *
 * // Generate an API key
 * const apiKey = await passwordService.generateApiKey();
 */
export class PasswordService {
  private saltRounds: number;
  private minLength: number;

  constructor(config: PasswordConfig = {}) {
    this.saltRounds = config.saltRounds || 12;
    this.minLength = config.minLength || 6;

    if (this.saltRounds < 8 || this.saltRounds > 15) {
      throw new Error('Salt rounds must be between 8 and 15');
    }
  }

  /**
   * Hash a password
   * @param password - The plain text password to hash
   * @returns Promise<string> - The bcrypt hash
   * @throws Error if password is invalid
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < this.minLength) {
      throw new Error(
        `Password must be at least ${this.minLength} characters long`
      );
    }

    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against its hash
   * @param password - The plain text password to verify
   * @param hash - The hash to verify against
   * @returns Promise<boolean> - True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Generate a random API key
   * Format: tc_{32-char-random-string}
   * @returns Promise<GeneratedApiKey> - Object with key, hash, and prefix
   */
  async generateApiKey(): Promise<GeneratedApiKey> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';

    // Generate 32 random characters
    for (let i = 0; i < 32; i++) {
      randomPart += chars.charAt(crypto.randomInt(chars.length));
    }

    const key = `tc_${randomPart}`;
    const keyHash = await bcrypt.hash(key, 10);
    const keyPrefix = key.substring(0, 8); // tc_abcd...

    return { key, keyHash, keyPrefix };
  }

  /**
   * Verify an API key against its hash
   * @param key - The plain text API key
   * @param hash - The stored hash to verify against
   * @returns Promise<boolean> - True if key matches
   */
  async verifyApiKey(key: string, hash: string): Promise<boolean> {
    if (!key || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(key, hash);
    } catch {
      return false;
    }
  }

  /**
   * Validate a password strength
   * Returns validation result with details
   * @param password - The password to validate
   * @returns Validation result object
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
    score: number; // 0-100
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors, score: 0 };
    }

    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters`);
    } else {
      score += 20;
    }

    // Length bonus
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      errors.push('Password should contain uppercase letters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      errors.push('Password should contain lowercase letters');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 15;
    } else {
      errors.push('Password should contain numbers');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 15;
    } else {
      errors.push('Password should contain special characters');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      valid: errors.length === 0 || password.length >= this.minLength,
      errors,
      score,
    };
  }
}

/**
 * Create a singleton password service instance
 */
export function createPasswordService(
  config: PasswordConfig = {}
): PasswordService {
  return new PasswordService(config);
}

// Singleton instance (lazy-loaded)
let passwordServiceInstance: PasswordService | null = null;

/**
 * Get or create the singleton password service instance
 */
export function getPasswordService(): PasswordService {
  if (!passwordServiceInstance) {
    passwordServiceInstance = createPasswordService();
  }
  return passwordServiceInstance;
}
