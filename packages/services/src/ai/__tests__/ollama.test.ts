import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OllamaGateway,
  OllamaConfig,
  ChatMessage,
  getModelPreset,
  createOllamaGateway,
  getOllamaGateway,
  MODEL_PRESETS,
} from '../ollama.js';

describe('OllamaGateway', () => {
  let gateway: OllamaGateway;

  const config: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    generalModel: 'darkplanet',
    longFormModel: 'dolphin-mixtral',
  };

  beforeEach(() => {
    gateway = new OllamaGateway(config);
  });

  describe('constructor', () => {
    it('should create an OllamaGateway with valid config', () => {
      expect(gateway).toBeDefined();
    });

    it('should throw error if baseUrl is missing', () => {
      expect(() => {
        new OllamaGateway({
          baseUrl: '',
          apiKey: '',
          generalModel: 'darkplanet',
          longFormModel: 'dolphin-mixtral',
        });
      }).toThrow('Ollama baseUrl is required');
    });

    it('should accept baseUrl with trailing slash', () => {
      expect(() => {
        new OllamaGateway({
          baseUrl: 'http://localhost:11434/',
          apiKey: '',
          generalModel: 'darkplanet',
          longFormModel: 'dolphin-mixtral',
        });
      }).not.toThrow();
    });
  });

  describe('getModelPreset', () => {
    it('should return preset for known model', () => {
      const preset = getModelPreset('darkplanet-general:latest');

      expect(preset).toBeDefined();
      expect(preset.temperature).toBe(0.85);
      expect(preset.num_ctx).toBe(8192);
    });

    it('should return default preset for unknown model', () => {
      const preset = getModelPreset('unknown-model:latest');

      expect(preset).toBeDefined();
      expect(preset.temperature).toBe(0.85);
    });

    it('should apply overrides to preset', () => {
      const preset = getModelPreset('darkplanet-general:latest', {
        temperature: 0.5,
      });

      expect(preset.temperature).toBe(0.5);
      expect(preset.num_ctx).toBe(8192); // Original value preserved
    });

    it('should have presets for all main models', () => {
      const models = [
        'violet-lotus:latest',
        'mythomax:latest',
        'dolphin-mixtral:latest',
        'darkplanet-general:latest',
        'dark-champion:latest',
      ];

      models.forEach(model => {
        expect(MODEL_PRESETS[model]).toBeDefined();
      });
    });
  });

  describe('selectModel', () => {
    it('should select general model for brief responses', () => {
      const model = gateway.selectModel('brief', true);
      expect(model).toBe(config.generalModel);
    });

    it('should select general model for moderate responses', () => {
      const model = gateway.selectModel('moderate', true);
      expect(model).toBe(config.generalModel);
    });

    it('should select long form model for detailed responses when enabled', () => {
      const model = gateway.selectModel('detailed', true);
      expect(model).toBe(config.longFormModel);
    });

    it('should select general model for detailed responses when disabled', () => {
      const model = gateway.selectModel('detailed', false);
      expect(model).toBe(config.generalModel);
    });
  });

  describe('getConfig', () => {
    it('should return gateway configuration', () => {
      const returnedConfig = gateway.getConfig();

      expect(returnedConfig).toEqual(config);
    });

    it('should return a copy of config', () => {
      const returnedConfig = gateway.getConfig();
      returnedConfig.baseUrl = 'http://different:11434';

      expect(gateway.getConfig().baseUrl).toBe(config.baseUrl);
    });
  });

  describe('testConnection', () => {
    it('should return success=true when connection is valid', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [
            { name: 'darkplanet' },
            { name: 'dolphin-mixtral' },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await gateway.testConnection();

      expect(result.success).toBe(true);
      expect(result.models).toContain('darkplanet');
      expect(result.models).toContain('dolphin-mixtral');
    });

    it('should return error when connection fails', async () => {
      const mockError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(mockError);

      const result = await gateway.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await gateway.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('503');
    });

    it('should handle empty models list', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ models: [] }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await gateway.testConnection();

      expect(result.success).toBe(true);
      expect(result.models).toEqual([]);
    });
  });

  describe('getModels', () => {
    it('should return list of available models', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [
            { name: 'darkplanet' },
            { name: 'dolphin-mixtral' },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const models = await gateway.getModels();

      expect(models).toContain('darkplanet');
      expect(models).toContain('dolphin-mixtral');
    });

    it('should throw error when API call fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(gateway.getModels()).rejects.toThrow('Failed to get models: 500');
    });

    it('should throw error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(gateway.getModels()).rejects.toThrow();
    });

    it('should handle missing models in response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const models = await gateway.getModels();

      expect(models).toEqual([]);
    });
  });

  describe('generate', () => {
    it('should call Ollama API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          response: 'Generated response',
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello!' },
      ];

      const result = await gateway.generate({
        model: 'darkplanet',
        messages,
      });

      expect(result).toBe('Generated response');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Server error',
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello!' },
      ];

      await expect(
        gateway.generate({
          model: 'darkplanet',
          messages,
        })
      ).rejects.toThrow('Ollama API error: 500');
    });

    it('should clean output artifacts', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          response: 'Response<|eot_id|><|end_of_text|>',
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await gateway.generate({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      expect(result).toBe('Response');
      expect(result).not.toContain('<|eot_id|>');
      expect(result).not.toContain('<|end_of_text|>');
    });

    it('should apply model preset options', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ response: 'Response' }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await gateway.generate({
        model: 'darkplanet-general:latest',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );

      expect(callBody.options.temperature).toBe(0.85);
      expect(callBody.options.num_ctx).toBe(8192);
    });
  });

  describe('generateStream', () => {
    it('should yield text chunks from stream', async () => {
      const chunks = [
        '{"message":{"content":"Hello"}}',
        '{"message":{"content":" "}}',
        '{"message":{"content":"world"}}',
        '{"done":true}',
      ];

      const mockReadable = {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[0] + '\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[1] + '\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[2] + '\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[3] + '\n') })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      };

      const mockResponse = {
        ok: true,
        body: mockReadable,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const results: string[] = [];
      for await (const chunk of gateway.generateStream({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      })) {
        results.push(chunk);
      }

      expect(results.length).toBeGreaterThan(0);
    });

    it('should throw error when API fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Error',
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const generator = gateway.generateStream({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      await expect(async () => {
        for await (const _ of generator) {
          // Iterate to trigger error
        }
      }).rejects.toThrow('Ollama API error: 500');
    });

    it('should throw error when no response body', async () => {
      const mockResponse = {
        ok: true,
        body: null,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const generator = gateway.generateStream({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      await expect(async () => {
        for await (const _ of generator) {
          // Iterate to trigger error
        }
      }).rejects.toThrow('No response body from Ollama');
    });
  });

  describe('factory functions', () => {
    it('should create gateway from environment variables', () => {
      const gateway = createOllamaGateway();
      expect(gateway).toBeInstanceOf(OllamaGateway);
    });

    it('should return singleton instance', () => {
      const gateway = getOllamaGateway();
      expect(gateway).toBeInstanceOf(OllamaGateway);
    });
  });

  describe('API authentication', () => {
    it('should include API key in headers when provided', async () => {
      const gatewayWithAuth = new OllamaGateway({
        ...config,
        apiKey: 'test-api-key',
      });

      const mockResponse = {
        ok: true,
        json: async () => ({ response: 'Response' }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await gatewayWithAuth.generate({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      const headers = (global.fetch as any).mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-api-key');
    });

    it('should not include API key when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ response: 'Response' }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await gateway.generate({
        model: 'darkplanet',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      const headers = (global.fetch as any).mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
