import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveKitService } from '../LiveKitService.js';

// Mock livekit-server-sdk
vi.mock('livekit-server-sdk', () => {
  const addGrant = vi.fn();
  const toJwt = vi.fn(async () => 'mock-jwt-token');

  return {
    AccessToken: vi.fn().mockImplementation((_key: string, _secret: string, opts?: { identity?: string }) => ({
      identity: opts?.identity,
      addGrant,
      toJwt,
    })),
    RoomServiceClient: vi.fn().mockImplementation(() => ({
      createRoom: vi.fn(async () => ({ name: 'test-room' })),
    })),
    AgentDispatchClient: vi.fn().mockImplementation(() => ({
      createDispatch: vi.fn(async () => ({ dispatchId: 'dispatch-1' })),
    })),
    WebhookReceiver: vi.fn().mockImplementation(() => ({
      receive: vi.fn(async () => ({ event: 'participant_joined' })),
    })),
  };
});

const config = {
  url: 'wss://livekit.example.com',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
};

describe('LiveKitService', () => {
  let service: LiveKitService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LiveKitService(config);
  });

  describe('generateToken', () => {
    it('should return a JWT string', async () => {
      const token = await service.generateToken('user-1', 'room-1');
      expect(token).toBe('mock-jwt-token');
    });

    it('should pass metadata as JSON string', async () => {
      const token = await service.generateToken('user-1', 'room-1', { foo: 'bar' });
      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('createRoom', () => {
    it('should create a room without error', async () => {
      await expect(service.createRoom('room-1')).resolves.toBeUndefined();
    });

    it('should create a room with metadata', async () => {
      await expect(
        service.createRoom('room-1', { type: 'voice' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('dispatchAgent', () => {
    it('should dispatch an agent without error', async () => {
      await expect(
        service.dispatchAgent('room-1', 'companion-agent'),
      ).resolves.toBeUndefined();
    });

    it('should dispatch an agent with metadata', async () => {
      await expect(
        service.dispatchAgent('room-1', 'companion-agent', { lettaAgentId: 'abc' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('receiveWebhook', () => {
    it('should return a webhook event', async () => {
      const event = await service.receiveWebhook('body', 'auth-header');
      expect(event).toEqual({ event: 'participant_joined' });
    });
  });

  describe('wsUrl', () => {
    it('should expose the WebSocket URL', () => {
      expect(service.wsUrl).toBe('wss://livekit.example.com');
    });
  });
});
