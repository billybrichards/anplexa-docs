import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaToolService } from '../MediaToolService.js';

// Create a mock gateway that satisfies the LettaGateway interface
function createMockGateway() {
  return {
    listTools: vi.fn().mockResolvedValue([]),
    createCustomTool: vi.fn()
      .mockResolvedValueOnce('tool-image-1')
      .mockResolvedValueOnce('tool-video-1'),
    createPromptEnhancerAgent: vi.fn()
      .mockResolvedValueOnce('enhancer-image-1')
      .mockResolvedValueOnce('enhancer-video-1'),
  };
}

describe('MediaToolService', () => {
  let service: MediaToolService;

  beforeEach(() => {
    service = new MediaToolService();
  });

  describe('getToolConfig', () => {
    it('should initialize tools and enhancer agents on first call', async () => {
      const gateway = createMockGateway();

      const config = await service.getToolConfig(gateway as any);

      expect(config.imageToolId).toBe('tool-image-1');
      expect(config.videoToolId).toBe('tool-video-1');
      expect(config.imageEnhancerAgentId).toBe('enhancer-image-1');
      expect(config.videoEnhancerAgentId).toBe('enhancer-video-1');
    });

    it('should return cached config on subsequent calls', async () => {
      const gateway = createMockGateway();

      const first = await service.getToolConfig(gateway as any);
      const second = await service.getToolConfig(gateway as any);

      expect(first).toBe(second);
      // createCustomTool should only be called during first init
      expect(gateway.createCustomTool).toHaveBeenCalledTimes(2);
    });

    it('should reuse existing tools if they already exist on server', async () => {
      const gateway = createMockGateway();
      gateway.listTools.mockResolvedValue([
        { id: 'existing-img', name: 'generate_image' },
        { id: 'existing-vid', name: 'generate_video' },
      ]);

      const config = await service.getToolConfig(gateway as any);

      expect(config.imageToolId).toBe('existing-img');
      expect(config.videoToolId).toBe('existing-vid');
      // Should NOT call createCustomTool since tools exist
      expect(gateway.createCustomTool).not.toHaveBeenCalled();
    });

    it('should create enhancer agents with correct names', async () => {
      const gateway = createMockGateway();

      await service.getToolConfig(gateway as any);

      expect(gateway.createPromptEnhancerAgent).toHaveBeenCalledTimes(2);
      expect(gateway.createPromptEnhancerAgent.mock.calls[0][0]).toContain('Image');
      expect(gateway.createPromptEnhancerAgent.mock.calls[1][0]).toContain('Video');
    });
  });

  describe('getToolIds', () => {
    it('should return empty array before initialization', () => {
      expect(service.getToolIds()).toEqual([]);
    });

    it('should return tool IDs after initialization', async () => {
      const gateway = createMockGateway();
      await service.getToolConfig(gateway as any);

      const ids = service.getToolIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('tool-image-1');
      expect(ids).toContain('tool-video-1');
    });
  });

  describe('isInitialized', () => {
    it('should be false before init', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should be true after init', async () => {
      const gateway = createMockGateway();
      await service.getToolConfig(gateway as any);
      expect(service.isInitialized()).toBe(true);
    });
  });
});
