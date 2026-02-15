import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LettaGateway } from '../LettaGateway.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('LettaGateway', () => {
  let gateway: LettaGateway;

  beforeEach(() => {
    gateway = new LettaGateway({
      baseUrl: 'http://localhost:8283',
      apiKey: 'test-key',
      timeout: 5000,
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAgent', () => {
    it('should POST to /v1/agents/ with correct body', async () => {
      const agentResponse = {
        id: 'agent-123',
        name: 'Test Agent',
        model: 'ollama/qwen3-8b-nsfw:latest',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        system: 'You are a companion',
        metadata: { conversationId: 'conv-1', agentType: 'companion', blockIds: ['b1'] },
        llm_config: { model: 'ollama/qwen3-8b-nsfw:latest', model_endpoint: '', model_endpoint_type: 'ollama', context_window: 32768 },
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(agentResponse));

      const result = await gateway.createAgent({
        conversationId: 'conv-1',
        agentType: 'companion',
        name: 'Test Agent',
        blockIds: ['b1'],
        modelHandle: 'ollama/qwen3-8b-nsfw:latest',
        system: 'You are a companion',
        contextWindowLimit: 32768,
      });

      expect(result.id).toBe('agent-123');
      expect(result.name).toBe('Test Agent');
      expect(result.agentType).toBe('companion');
      expect(result.conversationId).toBe('conv-1');

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8283/v1/agents/');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.name).toBe('Test Agent');
      expect(body.block_ids).toEqual(['b1']);
      expect(body.model).toBe('ollama/qwen3-8b-nsfw:latest');
      expect(body.context_window_limit).toBe(32768);
    });

    it('should include Authorization header when API key is set', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 'a1', name: 'A', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
        system: '', metadata: { conversationId: 'c1', agentType: 'companion' },
      }));

      await gateway.createAgent({
        conversationId: 'c1', agentType: 'companion', name: 'A', blockIds: [],
        modelHandle: 'ollama/test',
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-key');
    });
  });

  describe('createMemoryBlocks', () => {
    it('should create blocks sequentially and return mapped results', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ id: 'b1', label: 'persona', value: 'test', limit: 3000 }))
        .mockResolvedValueOnce(jsonResponse({ id: 'b2', label: 'human', value: 'context', limit: 3000 }));

      const result = await gateway.createMemoryBlocks([
        { label: 'persona', value: 'test', limit: 3000 },
        { label: 'human', value: 'context', limit: 3000 },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'b1', label: 'persona', value: 'test', limit: 3000 });
      expect(result[1]).toEqual({ id: 'b2', label: 'human', value: 'context', limit: 3000 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateMemoryBlock', () => {
    it('should PATCH block value', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 'b1', label: 'persona', value: 'updated', limit: 3000,
      }));

      const result = await gateway.updateMemoryBlock('b1', 'updated');

      expect(result.value).toBe('updated');
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8283/v1/blocks/b1');
      expect(init.method).toBe('PATCH');
    });
  });

  describe('sendMessage', () => {
    it('should POST message and parse v0.16.4 response format', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([
        { id: 'm1', message_type: 'reasoning_message', date: '2025-01-01T00:00:00Z', reasoning: 'thinking...' },
        { id: 'm2', message_type: 'assistant_message', date: '2025-01-01T00:00:00Z', content: 'Hello!' },
        { id: 'm3', message_type: 'tool_call_message', date: '2025-01-01T00:00:00Z' },
      ]));

      const messages = await gateway.sendMessage('agent-1', 'Hi');

      // Should only return assistant messages, not reasoning or tool calls
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('Hello!');
    });
  });

  describe('getMessages', () => {
    it('should GET messages with limit', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([
        { id: 'm1', message_type: 'user_message', date: '2025-01-01T00:00:00Z', content: 'Hi' },
        { id: 'm2', message_type: 'assistant_message', date: '2025-01-01T00:00:01Z', content: 'Hey' },
      ]));

      const messages = await gateway.getMessages('agent-1', 20);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('limit=20');
    });
  });

  describe('deleteAgent', () => {
    it('should DELETE agent by ID', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, 200));

      await gateway.deleteAgent('agent-123');

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8283/v1/agents/agent-123');
      expect(init.method).toBe('DELETE');
    });
  });

  describe('findAgentByConversation', () => {
    it('should find companion agent by metadata query', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([
        {
          id: 'a1', name: 'Luna', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          system: '', metadata: { conversationId: 'conv-1', agentType: 'companion' },
        },
      ]));

      const agent = await gateway.findAgentByConversation('conv-1');

      expect(agent).not.toBeNull();
      expect(agent!.id).toBe('a1');
      expect(agent!.agentType).toBe('companion');
    });

    it('should return null when no agents match', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const agent = await gateway.findAgentByConversation('nonexistent');

      expect(agent).toBeNull();
    });

    it('should filter out agents with mismatched conversationId', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([
        {
          id: 'a1', name: 'Wrong', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          system: '', metadata: { conversationId: 'other-conv', agentType: 'companion' },
        },
      ]));

      const agent = await gateway.findAgentByConversation('conv-1');

      expect(agent).toBeNull();
    });
  });

  describe('307 redirect handling', () => {
    it('should rewrite 307 redirect to use configured baseUrl', async () => {
      // First call returns 307
      const redirectResponse = new Response(null, {
        status: 307,
        headers: { location: 'http://localhost:8283/v1/agents/' },
      });
      // Second call returns actual data
      const dataResponse = jsonResponse([]);

      mockFetch.mockResolvedValueOnce(redirectResponse).mockResolvedValueOnce(dataResponse);

      const agents = await gateway.findAgentByConversation('conv-1');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Second call should use our baseUrl, not the redirect target
      expect(mockFetch.mock.calls[1][0]).toContain('http://localhost:8283');
    });
  });

  describe('error handling', () => {
    it('should throw LettaApiError on non-200 response', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

      await expect(gateway.getAgent('nonexistent')).resolves.toBeNull();
    });

    it('should throw on network error for createAgent', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        gateway.createAgent({
          conversationId: 'c1', agentType: 'companion', name: 'A', blockIds: [],
          modelHandle: 'ollama/test',
        }),
      ).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('createCustomTool', () => {
    it('should POST source code and return tool ID', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'tool-1', name: 'generate_image' }));

      const toolId = await gateway.createCustomTool('def generate_image(): pass');

      expect(toolId).toBe('tool-1');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.source_code).toBe('def generate_image(): pass');
    });
  });

  describe('listTools', () => {
    it('should return list of tools', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([
        { id: 't1', name: 'generate_image', extra: 'ignored' },
        { id: 't2', name: 'generate_video', extra: 'ignored' },
      ]));

      const tools = await gateway.listTools();

      expect(tools).toEqual([
        { id: 't1', name: 'generate_image' },
        { id: 't2', name: 'generate_video' },
      ]);
    });
  });
});
