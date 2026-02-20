import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileGeneratorAgent } from '../ProfileGeneratorAgent.js';

function createMockMediaService() {
  return {
    triggerGeneration: vi.fn().mockResolvedValue({
      generationId: 'gen_profile_123',
      status: 'generating',
      comfyRequestId: 'comfy-profile-1',
    }),
    getStatus: vi.fn(),
    waitForCompletion: vi.fn(),
  };
}

describe('ProfileGeneratorAgent', () => {
  let agent: ProfileGeneratorAgent;
  let mockMedia: ReturnType<typeof createMockMediaService>;

  beforeEach(() => {
    mockMedia = createMockMediaService();
    agent = new ProfileGeneratorAgent(mockMedia as any);
  });

  it('should trigger image generation with appearance description', async () => {
    const result = await agent.generateProfileImage({
      companionId: 'comp-1',
      companionName: 'Luna',
      appearanceDescription: 'tall woman, silver hair, blue eyes',
      userId: 'user-1',
    });

    expect(result.status).toBe('generating');
    expect(result.generationId).toBe('gen_profile_123');
    expect(result.comfyRequestId).toBe('comfy-profile-1');

    const call = mockMedia.triggerGeneration.mock.calls[0][0];
    expect(call.type).toBe('image');
    expect(call.companionId).toBe('comp-1');
    expect(call.enhancedPrompt).toContain('silver hair');
    expect(call.enhancedPrompt).toContain('InstaGirlMix');
    expect(call.enhancedPrompt).toContain('solo, Centered composition');
  });

  it('should use companion name as fallback when no appearance', async () => {
    await agent.generateProfileImage({
      companionId: 'comp-2',
      companionName: 'Nova',
      appearanceDescription: '',
      userId: 'user-1',
    });

    const call = mockMedia.triggerGeneration.mock.calls[0][0];
    expect(call.enhancedPrompt).toContain('Nova');
  });

  it('should propagate failure from media service', async () => {
    mockMedia.triggerGeneration.mockResolvedValue({
      generationId: 'gen_fail',
      status: 'failed',
      errorMessage: 'ComfyUI down',
    });

    const result = await agent.generateProfileImage({
      companionId: 'comp-3',
      companionName: 'Luna',
      appearanceDescription: 'test',
      userId: 'user-1',
    });

    expect(result.status).toBe('failed');
    expect(result.errorMessage).toBe('ComfyUI down');
  });
});
