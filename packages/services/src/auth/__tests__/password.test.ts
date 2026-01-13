import { describe, it, expect, beforeEach } from 'vitest';
import {
  PasswordService,
  PasswordConfig,
  createPasswordService,
  getPasswordService,
} from '../password';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService({
      saltRounds: 10,
      minLength: 6,
    });
  });

  describe('constructor', () => {
    it('should create a PasswordService with valid config', () => {
      expect(passwordService).toBeDefined();
    });

    it('should use default config if not provided', () => {
      const service = new PasswordService();
      expect(service).toBeDefined();
    });

    it('should throw error if salt rounds are too low', () => {
      expect(() => {
        new PasswordService({ saltRounds: 4 });
      }).toThrow('Salt rounds must be between 8 and 15');
    });

    it('should throw error if salt rounds are too high', () => {
      expect(() => {
        new PasswordService({ saltRounds: 20 });
      }).toThrow('Salt rounds must be between 8 and 15');
    });

    it('should accept valid salt rounds between 8 and 15', () => {
      for (let rounds = 8; rounds <= 15; rounds++) {
        expect(() => {
          new PasswordService({ saltRounds: rounds });
        }).not.toThrow();
      }
    });
  });

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(passwordService.hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for null password', async () => {
      await expect(
        passwordService.hashPassword(null as any)
      ).rejects.toThrow('Password must be a non-empty string');
    });

    it('should throw error if password is too short', async () => {
      await expect(passwordService.hashPassword('short')).rejects.toThrow(
        'Password must be at least 6 characters long'
      );
    });

    it('should hash password meeting minimum length', async () => {
      const minPassword = '123456'; // Exactly 6 characters
      const hash = await passwordService.hashPassword(minPassword);

      expect(hash).toBeDefined();
    });

    it('should respect custom minLength', async () => {
      const service = new PasswordService({ minLength: 12 });

      await expect(service.hashPassword('onlyTenCh')).rejects.toThrow(
        'Password must be at least 12 characters long'
      );

      const validPassword = 'ValidPassword';
      const hash = await service.hashPassword(validPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for null password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(null as any, hash);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const password = 'MySecurePassword123!';
      const isValid = await passwordService.verifyPassword(password, 'not-a-valid-hash');

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('mysecurepassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should handle special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const password = 'パスワード123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key', async () => {
      const result = await passwordService.generateApiKey();

      expect(result.key).toBeDefined();
      expect(result.keyHash).toBeDefined();
      expect(result.keyPrefix).toBeDefined();
    });

    it('should generate key with correct format', async () => {
      const result = await passwordService.generateApiKey();

      expect(result.key).toMatch(/^tc_[A-Za-z0-9]{32}$/);
      expect(result.keyPrefix).toBe(result.key.substring(0, 8));
      expect(result.keyPrefix).toBe('tc_' + result.key.substring(3, 6));
    });

    it('should generate different keys each time', async () => {
      const result1 = await passwordService.generateApiKey();
      const result2 = await passwordService.generateApiKey();

      expect(result1.key).not.toBe(result2.key);
      expect(result1.keyHash).not.toBe(result2.keyHash);
    });

    it('should hash the key using bcrypt', async () => {
      const result = await passwordService.generateApiKey();

      expect(result.keyHash).toMatch(/^\$2[aby]\$/);
    });

    it('should have a prefix of 8 characters', async () => {
      const result = await passwordService.generateApiKey();

      expect(result.keyPrefix.length).toBe(8);
      expect(result.keyPrefix.startsWith('tc_')).toBe(true);
    });
  });

  describe('verifyApiKey', () => {
    it('should verify a valid API key', async () => {
      const { key, keyHash } = await passwordService.generateApiKey();

      const isValid = await passwordService.verifyApiKey(key, keyHash);
      expect(isValid).toBe(true);
    });

    it('should reject invalid API key', async () => {
      const { keyHash } = await passwordService.generateApiKey();

      const isValid = await passwordService.verifyApiKey('tc_wrongkey123456789', keyHash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty key', async () => {
      const { keyHash } = await passwordService.generateApiKey();

      const isValid = await passwordService.verifyApiKey('', keyHash);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const key = 'tc_somekeyherefortest';

      const isValid = await passwordService.verifyApiKey(key, 'not-a-valid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return valid=true for strong password', () => {
      const result = passwordService.validatePasswordStrength(
        'StrongPass123!@#'
      );

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should require minimum length', () => {
      const result = passwordService.validatePasswordStrength('abc');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 6 characters long'
      );
    });

    it('should require empty password', () => {
      const result = passwordService.validatePasswordStrength('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should suggest uppercase letters', () => {
      const result = passwordService.validatePasswordStrength(
        'lowercase123!@#'
      );

      expect(result.errors).toContain(
        'Password should contain uppercase letters'
      );
    });

    it('should suggest lowercase letters', () => {
      const result = passwordService.validatePasswordStrength(
        'UPPERCASE123!@#'
      );

      expect(result.errors).toContain(
        'Password should contain lowercase letters'
      );
    });

    it('should suggest numbers', () => {
      const result = passwordService.validatePasswordStrength(
        'NoNumbersHere!@#'
      );

      expect(result.errors).toContain('Password should contain numbers');
    });

    it('should suggest special characters', () => {
      const result = passwordService.validatePasswordStrength(
        'NoSpecialChars123'
      );

      expect(result.errors).toContain(
        'Password should contain special characters'
      );
    });

    it('should give higher score for longer passwords', () => {
      const short = passwordService.validatePasswordStrength(
        'Pass123!@#'
      );
      const long = passwordService.validatePasswordStrength(
        'VeryLongPasswordWith123!@#Extra'
      );

      expect(long.score).toBeGreaterThan(short.score);
    });

    it('should accept passwords with all character types', () => {
      const result = passwordService.validatePasswordStrength(
        'Complete123!Pass'
      );

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('should cap score at 100', () => {
      const result = passwordService.validatePasswordStrength(
        'VeryStrongPasswordWith123!@#AndEvenMoreChars'
      );

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should recognize special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{};\'":\\|,.<>/?';
      const result = passwordService.validatePasswordStrength(
        `Pass123${specialChars[0]}`
      );

      expect(result.errors).not.toContain(
        'Password should contain special characters'
      );
    });
  });

  describe('factory functions', () => {
    it('should create service from factory', () => {
      const service = createPasswordService({
        minLength: 8,
        saltRounds: 12,
      });

      expect(service).toBeInstanceOf(PasswordService);
    });

    it('should create service with default config', () => {
      const service = createPasswordService();

      expect(service).toBeInstanceOf(PasswordService);
    });

    it('should return singleton instance', () => {
      const service = getPasswordService();
      expect(service).toBeInstanceOf(PasswordService);
    });
  });

  describe('edge cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000) + '123!';
      const hash = await passwordService.hashPassword(longPassword);

      const isValid = await passwordService.verifyPassword(longPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should handle passwords with spaces', async () => {
      const password = 'Password With Spaces 123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle passwords with newlines', async () => {
      const password = 'Password\nWith\nNewlines123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
