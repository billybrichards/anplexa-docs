import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeMediaService } from '../NativeMediaService.js';

function createMockGateway() {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    submitGeneration: vi.fn().mockResolvedValue({ id: 'comfy-req-1', status: 'pending', message: 'Queued' }),
    getResult: vi.fn().mockResolvedValue({ id: 'comfy-req-1', status: 'completed', message: 'Done', output: [] }),
    waitForResult: vi.fn().mockResolvedValue({ id: 'comfy-req-1', status: 'completed', message: 'Done', output: [] }),
    healthCheck: vi.fn(),
    cancelGeneration: vi.fn(),
    uploadImage: vi.fn(),
    submitGenerationSync: vi.fn(),
  };
}

function createMockWorkflowBuilder() {
  return {
    buildPhotoWorkflow: vi.fn().mockResolvedValue({ '1': { class_type: 'KSampler' } }),
    buildVideoWorkflow: vi.fn().mockResolvedValue({ '1': { class_type: 'WAN' } }),
    generateSeed: vi.fn().mockReturnValue(123456789012345),
    clearCache: vi.fn(),
  };
}

const s3Config = {
  accessKeyId: 'ak', secretAccessKey: 'sk', bucketName: 'b', region: 'us-east-1',
};

describe('NativeMediaService', () => {
  let service: NativeMediaService;
  let gateway: ReturnType<typeof createMockGateway>;
  let builder: ReturnType<typeof createMockWorkflowBuilder>;

  beforeEach(() => {
    gateway = createMockGateway();
    builder = createMockWorkflowBuilder();
    service = new NativeMediaService(gateway as any, builder as any, { s3Config });
  });

  describe('triggerGeneration', () => {
    it('should build photo workflow and submit for image type', async () => {
      const result = await service.triggerGeneration({
        type: 'image',
        enhancedPrompt: 'beautiful sunset',
        userId: 'user-1',
      });

      expect(result.status).toBe('generating');
      expect(result.comfyRequestId).toBe('comfy-req-1');
      expect(result.generationId).toMatch(/^gen_/);
      expect(builder.buildPhotoWorkflow).toHaveBeenCalledWith(
        'beautiful sunset',
        expect.stringMatching(/^gen_/),
        123456789012345,
        undefined,
      );
      expect(gateway.submitGeneration).toHaveBeenCalled();
    });

    it('should build video workflow for video type', async () => {
      await service.triggerGeneration({
        type: 'video',
        enhancedPrompt: 'dancing in garden',
        userId: 'user-1',
      });

      expect(builder.buildVideoWorkflow).toHaveBeenCalled();
      expect(builder.buildPhotoWorkflow).not.toHaveBeenCalled();
    });

    it('should pass face image filename to workflow builder', async () => {
      await service.triggerGeneration({
        type: 'image',
        enhancedPrompt: 'selfie',
        userId: 'user-1',
        faceImageFilename: 'face.png',
      });

      expect(builder.buildPhotoWorkflow).toHaveBeenCalledWith(
        'selfie',
        expect.any(String),
        expect.any(Number),
        'face.png',
      );
    });

    it('should return failed if ComfyUI is not configured', async () => {
      gateway.isConfigured.mockReturnValue(false);

      const result = await service.triggerGeneration({
        type: 'image',
        enhancedPrompt: 'test',
        userId: 'user-1',
      });

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain('not configured');
    });

    it('should return failed on ComfyUI submit error', async () => {
      gateway.submitGeneration.mockRejectedValue(new Error('Connection refused'));

      const result = await service.triggerGeneration({
        type: 'image',
        enhancedPrompt: 'test',
        userId: 'user-1',
      });

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain('Connection refused');
    });

    it('should pass S3 config to gateway', async () => {
      await service.triggerGeneration({
        type: 'image',
        enhancedPrompt: 'test',
        userId: 'user-1',
      });

      const submitArgs = gateway.submitGeneration.mock.calls[0][0];
      expect(submitArgs.s3Config.bucketName).toBe('b');
      expect(submitArgs.s3Config.region).toBe('us-east-1');
    });
  });

  describe('getStatus', () => {
    it('should delegate to comfyUI gateway getResult', async () => {
      const result = await service.getStatus('comfy-req-1');
      expect(result.status).toBe('completed');
      expect(gateway.getResult).toHaveBeenCalledWith('comfy-req-1');
    });
  });

  describe('waitForCompletion', () => {
    it('should delegate to comfyUI gateway waitForResult', async () => {
      const result = await service.waitForCompletion('comfy-req-1', 1000, 5000);
      expect(result.status).toBe('completed');
      expect(gateway.waitForResult).toHaveBeenCalledWith('comfy-req-1', 1000, 5000);
    });
  });
});
