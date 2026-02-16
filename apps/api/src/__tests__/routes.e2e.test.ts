/**
 * API Route E2E Tests
 *
 * Tests the full Express stack (routes + middleware) with a mocked DI container.
 * Covers: geocode, astrology, media routes.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Create a mock container that satisfies what the routes need
function createMockContainer() {
  const mockUseCases = {
    analyzeChartPersonality: {
      execute: vi.fn().mockResolvedValue({
        traitProfile: { traits: [], summary: 'Test summary' },
      }),
    },
    calculateBirthChart: {
      execute: vi.fn().mockResolvedValue({
        birthChart: { id: 'bc-1', displayName: 'Test', isActive: true },
        sunSign: 'Leo',
        moonSign: 'Pisces',
        risingSign: 'Virgo',
        interpretation: {},
        companionContext: '',
      }),
    },
    generateCompanionPersona: {
      execute: vi.fn().mockResolvedValue({
        persona: {
          id: 'persona-1',
          name: 'Luna',
          companionName: 'Luna',
        },
        preview: {
          name: 'Luna',
          tagline: 'Your cosmic companion',
          personalityTraits: ['empathetic', 'witty'],
        },
      }),
    },
  };

  const mockNativeMediaService = {
    triggerGeneration: vi.fn().mockResolvedValue({
      generationId: 'gen_test_123',
      status: 'generating',
      comfyRequestId: 'comfy-req-1',
    }),
    getStatus: vi.fn().mockResolvedValue({
      id: 'comfy-req-1',
      status: 'completed',
      message: 'Done',
      output: [{ node_id: '14', filename: 'photo.png', url: 'https://s3.example.com/photo.png' }],
    }),
  };

  // Minimal mock that satisfies Container interface
  const mockLettaGateway = {
    sendMessageStream: vi.fn(),
    getMessages: vi.fn().mockResolvedValue([]),
  };

  const mockAgentProvisioner = {
    provisionCompanionAgent: vi.fn().mockResolvedValue({
      lettaAgentId: 'letta-agent-1',
      agentName: 'companion_luna',
      blockIds: ['b1', 'b2'],
    }),
  };

  const mockLettaAgentRepository = {
    findByCompanionPersona: vi.fn().mockResolvedValue({
      lettaAgentId: 'letta-agent-1',
    }),
    findByConversation: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
  };

  const mockConversationRepository = {
    create: vi.fn().mockImplementation(async (data: any) => ({
      id: data.id,
      userId: data.userId,
      title: data.title,
      createdAt: new Date().toISOString(),
    })),
    getByUserId: vi.fn().mockResolvedValue([]),
  };

  const mockMessageRepository = {
    getByConversationId: vi.fn().mockResolvedValue([]),
  };

  const mockProfileGeneratorAgent = {
    generateProfileImage: vi.fn().mockResolvedValue({
      generationId: 'profile-gen-1',
      status: 'generating',
    }),
  };

  return {
    cradle: {
      useCases: mockUseCases,
      nativeMediaService: mockNativeMediaService,
      lettaGateway: mockLettaGateway,
      agentProvisioner: mockAgentProvisioner,
      lettaAgentRepository: mockLettaAgentRepository,
      conversationRepository: mockConversationRepository,
      messageRepository: mockMessageRepository,
      profileGeneratorAgent: mockProfileGeneratorAgent,
    },
    resolve: (name: string) => (createMockContainer() as any).cradle[name],
  };
}

describe('API Routes E2E', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    const container = createMockContainer();
    app = createApp(container as any);
  });

  // ── Health ──────────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  // ── Geocode ─────────────────────────────────────────────────────────────

  describe('GET /api/geocode/lookup', () => {
    it('should return coordinates for known city', async () => {
      const res = await request(app)
        .get('/api/geocode/lookup')
        .query({ city: 'London', country: 'UK' });

      expect(res.status).toBe(200);
      expect(res.body.latitude).toBeCloseTo(51.5074, 2);
      expect(res.body.longitude).toBeCloseTo(-0.1278, 2);
      expect(res.body.timezone).toBe('Europe/London');
    });

    it('should return 404 for unknown city', async () => {
      const res = await request(app)
        .get('/api/geocode/lookup')
        .query({ city: 'Nonexistent', country: 'Nowhere' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('City not found');
    });

    it('should return 400 if city is missing', async () => {
      const res = await request(app)
        .get('/api/geocode/lookup')
        .query({ country: 'UK' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if country is missing', async () => {
      const res = await request(app)
        .get('/api/geocode/lookup')
        .query({ city: 'London' });

      expect(res.status).toBe(400);
    });

    it('should handle country aliases', async () => {
      const res = await request(app)
        .get('/api/geocode/lookup')
        .query({ city: 'New York', country: 'USA' });

      expect(res.status).toBe(200);
      expect(res.body.timezone).toBe('America/New_York');
    });
  });

  describe('GET /api/geocode/search', () => {
    it('should return matching cities', async () => {
      const res = await request(app)
        .get('/api/geocode/search')
        .query({ q: 'lon' });

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/geocode/search')
        .query({ q: 'san', limit: '2' });

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeLessThanOrEqual(2);
    });

    it('should return 400 if q is missing', async () => {
      const res = await request(app).get('/api/geocode/search');
      expect(res.status).toBe(400);
    });
  });

  // ── Astrology ───────────────────────────────────────────────────────────

  describe('POST /api/astrology/analyze-traits', () => {
    it('should analyze traits from chart data', async () => {
      const res = await request(app)
        .post('/api/astrology/analyze-traits')
        .send({ chartData: { sun: 'Leo' } });

      expect(res.status).toBe(200);
      expect(res.body.traitProfile).toBeDefined();
    });

    it('should return 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/astrology/analyze-traits')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── Media ───────────────────────────────────────────────────────────────

  describe('POST /api/media/generate', () => {
    it('should trigger image generation', async () => {
      const res = await request(app)
        .post('/api/media/generate')
        .send({
          type: 'image',
          enhancedPrompt: 'beautiful sunset photo',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('generating');
      expect(res.body.generationId).toMatch(/^gen_/);
      expect(res.body.comfyRequestId).toBe('comfy-req-1');
    });

    it('should trigger video generation', async () => {
      const res = await request(app)
        .post('/api/media/generate')
        .send({
          type: 'video',
          enhancedPrompt: 'walking in a garden',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('generating');
    });

    it('should return 400 for invalid type', async () => {
      const res = await request(app)
        .post('/api/media/generate')
        .send({ type: 'audio', enhancedPrompt: 'test' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing prompt', async () => {
      const res = await request(app)
        .post('/api/media/generate')
        .send({ type: 'image' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/media/status/:id', () => {
    it('should return generation status', async () => {
      const res = await request(app)
        .get('/api/media/status/comfy-req-1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });
  });

  // ── Companion ────────────────────────────────────────────────────────────

  describe('POST /api/companion/generate', () => {
    it('should generate a companion persona', async () => {
      const res = await request(app)
        .post('/api/companion/generate')
        .send({ userId: 'user-1' });

      expect(res.status).toBe(201);
      expect(res.body.preview.name).toBe('Luna');
    });

    it('should accept preferences', async () => {
      const res = await request(app)
        .post('/api/companion/generate')
        .send({
          userId: 'user-1',
          preferences: {
            nameGender: 'feminine',
            personalityEmphasis: ['nurturing', 'playful'],
          },
        });

      expect(res.status).toBe(201);
    });

    it('should return 400 for invalid preferences', async () => {
      const res = await request(app)
        .post('/api/companion/generate')
        .send({
          preferences: { nameGender: 'invalid' },
        });

      expect(res.status).toBe(400);
    });
  });

  // ── Chat ─────────────────────────────────────────────────────────────────

  describe('POST /api/chat/conversations', () => {
    it('should create a conversation', async () => {
      const res = await request(app)
        .post('/api/chat/conversations')
        .send({ userId: 'user-1', title: 'Test Chat' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Chat');
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should return conversations for a user', async () => {
      const res = await request(app)
        .get('/api/chat/conversations?userId=user-1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should require userId', async () => {
      const res = await request(app)
        .get('/api/chat/conversations');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/chat/send', () => {
    it('should return 400 without a message', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({ companionPersonaId: 'persona-1' });

      expect(res.status).toBe(400);
    });

    it('should return 400 without companionPersonaId and no agent', async () => {
      // Reset mock to return null (no existing agent)
      const container = createMockContainer();
      (container.cradle as any).lettaAgentRepository.findByCompanionPersona.mockResolvedValue(null);
      const testApp = createApp(container as any);

      const res = await request(testApp)
        .post('/api/chat/send')
        .send({ message: 'hello' });

      expect(res.status).toBe(400);
    });
  });

  // ── 404 ─────────────────────────────────────────────────────────────────

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
