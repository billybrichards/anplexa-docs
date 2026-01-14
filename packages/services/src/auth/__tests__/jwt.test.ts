import { describe, it, expect, beforeEach } from 'vitest';
import {
  JWTService,
  JWTConfig,
  TokenPayload,
  createJWTService,
  getJWTService,
} from '../jwt';

describe('JWTService', () => {
  let jwtService: JWTService;

  const config: JWTConfig = {
    secret: 'test-secret-key-min-32-chars-long',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  };

  beforeEach(() => {
    jwtService = new JWTService(config);
  });

  describe('constructor', () => {
    it('should create a JWTService with valid config', () => {
      expect(jwtService).toBeDefined();
    });

    it('should throw error if secret is missing', () => {
      expect(() => {
        new JWTService({
          secret: '',
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d',
        });
      }).toThrow('JWT secret is required');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const userId = 'user-123';
      const email = 'user@example.com';
      const isAdmin = false;

      const tokens = jwtService.generateTokenPair(userId, email, isAdmin);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(900); // 15 minutes in seconds
      expect(tokens.refreshExpiresIn).toBe(604800); // 7 days in seconds
    });

    it('should generate different tokens for different users', () => {
      const tokens1 = jwtService.generateTokenPair('user-1', 'user1@example.com', false);
      const tokens2 = jwtService.generateTokenPair('user-2', 'user2@example.com', true);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('should preserve admin flag in tokens', () => {
      const adminTokens = jwtService.generateTokenPair('admin-123', 'admin@example.com', true);
      const userTokens = jwtService.generateTokenPair('user-123', 'user@example.com', false);

      const adminPayload = jwtService.verifyAccessToken(adminTokens.accessToken);
      const userPayload = jwtService.verifyAccessToken(userTokens.accessToken);

      expect(adminPayload?.isAdmin).toBe(true);
      expect(userPayload?.isAdmin).toBe(false);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const userId = 'user-123';
      const email = 'user@example.com';
      const isAdmin = false;

      const tokens = jwtService.generateTokenPair(userId, email, isAdmin);
      const payload = jwtService.verifyAccessToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(userId);
      expect(payload?.email).toBe(email);
      expect(payload?.isAdmin).toBe(isAdmin);
      expect(payload?.type).toBe('access');
    });

    it('should return null for invalid token', () => {
      const payload = jwtService.verifyAccessToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should return null for refresh token (when verifying as access)', () => {
      const tokens = jwtService.generateTokenPair('user-123', 'user@example.com', false);
      const payload = jwtService.verifyAccessToken(tokens.refreshToken);
      expect(payload).toBeNull();
    });

    it('should return null for expired token', async () => {
      const shortLivedConfig: JWTConfig = {
        secret: config.secret,
        accessTokenExpiry: '0s', // Immediately expired
        refreshTokenExpiry: '7d',
      };

      const shortLivedService = new JWTService(shortLivedConfig);
      const tokens = shortLivedService.generateTokenPair('user-123', 'user@example.com', false);

      // Wait a brief moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const payload = shortLivedService.verifyAccessToken(tokens.accessToken);
      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const userId = 'user-123';
      const email = 'user@example.com';
      const isAdmin = false;

      const tokens = jwtService.generateTokenPair(userId, email, isAdmin);
      const payload = jwtService.verifyRefreshToken(tokens.refreshToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(userId);
      expect(payload?.email).toBe(email);
      expect(payload?.type).toBe('refresh');
    });

    it('should return null for access token (when verifying as refresh)', () => {
      const tokens = jwtService.generateTokenPair('user-123', 'user@example.com', false);
      const payload = jwtService.verifyRefreshToken(tokens.accessToken);
      expect(payload).toBeNull();
    });

    it('should return null for invalid token', () => {
      const payload = jwtService.verifyRefreshToken('invalid.token.here');
      expect(payload).toBeNull();
    });
  });

  describe('decode', () => {
    it('should decode token without verification', () => {
      const tokens = jwtService.generateTokenPair('user-123', 'user@example.com', true);
      const payload = jwtService.decode(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.email).toBe('user@example.com');
      expect(payload?.isAdmin).toBe(true);
    });

    it('should return null for invalid token', () => {
      const payload = jwtService.decode('not.a.token');
      expect(payload).toBeNull();
    });
  });

  describe('generateId', () => {
    it('should generate UUIDs', () => {
      const id1 = jwtService.generateId();
      const id2 = jwtService.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      // Should be UUID format
      expect(id1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('getRefreshExpiryDate', () => {
    it('should return a date in the future', () => {
      const expiryDate = jwtService.getRefreshExpiryDate();
      const now = new Date();

      expect(expiryDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return approximately 7 days from now', () => {
      const expiryDate = jwtService.getRefreshExpiryDate();
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Allow 5 second margin for test execution
      const timeDiff = expiryDate.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThan(sevenDaysMs - 5000);
      expect(timeDiff).toBeLessThan(sevenDaysMs + 5000);
    });
  });

  describe('getAccessExpiryDate', () => {
    it('should return a date in the future', () => {
      const expiryDate = jwtService.getAccessExpiryDate();
      const now = new Date();

      expect(expiryDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return approximately 15 minutes from now', () => {
      const expiryDate = jwtService.getAccessExpiryDate();
      const now = new Date();
      const fifteenMinutesMs = 15 * 60 * 1000;

      const timeDiff = expiryDate.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThan(fifteenMinutesMs - 5000);
      expect(timeDiff).toBeLessThan(fifteenMinutesMs + 5000);
    });
  });

  describe('duration parsing', () => {
    it('should handle seconds', () => {
      const config30s: JWTConfig = {
        secret: 'test-secret',
        accessTokenExpiry: '30s',
        refreshTokenExpiry: '7d',
      };

      const service = new JWTService(config30s);
      const tokens = service.generateTokenPair('user-123', 'user@example.com', false);

      expect(tokens.expiresIn).toBe(30);
    });

    it('should handle hours', () => {
      const config1h: JWTConfig = {
        secret: 'test-secret',
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d',
      };

      const service = new JWTService(config1h);
      const tokens = service.generateTokenPair('user-123', 'user@example.com', false);

      expect(tokens.expiresIn).toBe(3600);
    });

    it('should handle days', () => {
      const config30d: JWTConfig = {
        secret: 'test-secret',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '30d',
      };

      const service = new JWTService(config30d);
      const tokens = service.generateTokenPair('user-123', 'user@example.com', false);

      expect(tokens.refreshExpiresIn).toBe(30 * 24 * 60 * 60);
    });
  });

  describe('factory functions', () => {
    it('should create service from environment variables', () => {
      const service = createJWTService();
      expect(service).toBeInstanceOf(JWTService);
    });

    it('should return singleton instance', () => {
      // Note: This test depends on the singleton implementation
      // Clear any existing instance first by testing independently
      const service = getJWTService();
      expect(service).toBeInstanceOf(JWTService);
    });
  });

  describe('security', () => {
    it('should not allow different service instances to verify each others tokens', () => {
      const service1 = new JWTService({
        secret: 'secret-1',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
      });

      const service2 = new JWTService({
        secret: 'secret-2',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
      });

      const tokens = service1.generateTokenPair('user-123', 'user@example.com', false);
      const payload = service2.verifyAccessToken(tokens.accessToken);

      expect(payload).toBeNull();
    });

    it('should not allow refresh tokens to be used as access tokens', () => {
      const tokens = jwtService.generateTokenPair('user-123', 'user@example.com', false);

      const asAccess = jwtService.verifyAccessToken(tokens.refreshToken);
      const asRefresh = jwtService.verifyRefreshToken(tokens.accessToken);

      expect(asAccess).toBeNull();
      expect(asRefresh).toBeNull();
    });
  });
});
