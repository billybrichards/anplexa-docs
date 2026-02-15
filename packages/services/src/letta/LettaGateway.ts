/**
 * Letta Gateway — Infrastructure Layer
 *
 * HTTP client for the self-hosted Letta v0.16.4 REST API.
 * Ported from Letta-Lonely, adapted for Anplexa's single-agent model.
 *
 * Key adaptations from LL:
 * - No dual NSFW/SFW agents — single agent per companion
 * - No ElevenLabs, no DB imports, no singleton export
 * - Designed for Awilix DI registration
 * - Console logging instead of structured logger
 */

import type {
  LettaGatewayConfig,
  LettaAgent,
  LettaMessage,
  MemoryBlock,
  CreateAgentInput,
  CreateMemoryBlockInput,
  AgentStreamChunk,
  DetectedStreamToolCall,
  StreamResult,
  LettaAgentResponse,
  LettaBlockResponse,
} from './types.js';

class LettaApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'LettaApiError';
  }
}

export class LettaGateway {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: LettaGatewayConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 90000;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Agent CRUD
  // ══════════════════════════════════════════════════════════════════════════

  async createAgent(input: CreateAgentInput): Promise<LettaAgent> {
    const requestBody: Record<string, unknown> = {
      name: input.name,
      block_ids: input.blockIds,
      include_base_tools: true,
      metadata: {
        conversationId: input.conversationId,
        agentType: input.agentType,
        blockIds: input.blockIds,
        ...input.metadata,
      },
      model: input.modelHandle,
      embedding: input.embeddingHandle || 'ollama/nomic-embed-text:latest',
    };

    if (input.contextWindowLimit) {
      requestBody.context_window_limit = input.contextWindowLimit;
    }
    if (input.system) {
      requestBody.system = input.system;
    }
    if (input.toolIds?.length) {
      requestBody.tool_ids = input.toolIds;
    }

    const response = await this.request('/v1/agents/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    const data = (await response.json()) as LettaAgentResponse;
    return this.mapAgentResponse(data, input.conversationId);
  }

  async getAgent(agentId: string): Promise<LettaAgent | null> {
    try {
      const response = await this.request(`/v1/agents/${agentId}`);
      const data = (await response.json()) as LettaAgentResponse;
      return this.mapAgentResponse(data, (data.metadata?.conversationId as string) || 'unknown');
    } catch {
      return null;
    }
  }

  async findAgentByConversation(conversationId: string): Promise<LettaAgent | null> {
    try {
      const response = await this.request(`/v1/agents/?metadata.conversationId=${conversationId}`);
      const agents = (await response.json()) as LettaAgentResponse[];

      // Filter to agents actually matching this conversation (Letta metadata query can over-match)
      const matching = agents.filter((a) => a.metadata?.conversationId === conversationId);
      if (matching.length === 0) return null;

      // Return the companion agent (not prompt_enhancer)
      const companion = matching.find((a) => a.metadata?.agentType === 'companion') || matching[0];
      return this.mapAgentResponse(companion, conversationId);
    } catch {
      return null;
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/v1/agents/${agentId}`, { method: 'DELETE' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Memory Blocks
  // ══════════════════════════════════════════════════════════════════════════

  async createMemoryBlocks(blocks: CreateMemoryBlockInput[]): Promise<MemoryBlock[]> {
    const created: MemoryBlock[] = [];
    for (const block of blocks) {
      const response = await this.request('/v1/blocks/', {
        method: 'POST',
        body: JSON.stringify({ label: block.label, value: block.value, limit: block.limit }),
      });
      const data = (await response.json()) as LettaBlockResponse;
      created.push({ id: data.id, label: data.label, value: data.value, limit: data.limit });
    }
    return created;
  }

  async getMemoryBlocks(blockIds: string[]): Promise<MemoryBlock[]> {
    const blocks: MemoryBlock[] = [];
    for (const blockId of blockIds) {
      try {
        const response = await this.request(`/v1/blocks/${blockId}`);
        const data = (await response.json()) as LettaBlockResponse;
        blocks.push({ id: data.id, label: data.label, value: data.value, limit: data.limit });
      } catch (error) {
        console.error(`[LettaGateway] Error fetching block ${blockId}:`, error);
      }
    }
    return blocks;
  }

  async updateMemoryBlock(blockId: string, value: string): Promise<MemoryBlock> {
    const response = await this.request(`/v1/blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
    const data = (await response.json()) as LettaBlockResponse;
    return { id: data.id, label: data.label, value: data.value, limit: data.limit };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Messages (non-streaming)
  // ══════════════════════════════════════════════════════════════════════════

  async sendMessage(agentId: string, message: string): Promise<LettaMessage[]> {
    const response = await this.request(`/v1/agents/${agentId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        streaming: false,
      }),
    });
    const data: unknown = await response.json();
    const rawMessages: Array<Record<string, unknown>> = Array.isArray(data)
      ? data
      : ((data as Record<string, unknown>).messages as Array<Record<string, unknown>>) || [];

    return rawMessages
      .filter((m) => m.message_type === 'user_message' || m.message_type === 'assistant_message')
      .map((m) => ({
        id: m.id as string,
        role: (m.message_type === 'user_message' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: (m.content as string) || '',
        createdAt: new Date((m.date as string) || Date.now()),
      }));
  }

  async getMessages(agentId: string, limit: number = 50): Promise<LettaMessage[]> {
    const response = await this.request(`/v1/agents/${agentId}/messages?limit=${limit}`);
    const data: unknown = await response.json();
    const messages: Array<Record<string, unknown>> = Array.isArray(data)
      ? data
      : ((data as Record<string, unknown>).messages as Array<Record<string, unknown>>) || [];

    return messages
      .filter((m) => {
        if (m.message_type) {
          return m.message_type === 'user_message' || m.message_type === 'assistant_message';
        }
        return m.role === 'user' || m.role === 'assistant';
      })
      .map((m) => ({
        id: m.id as string,
        role: (m.message_type
          ? m.message_type === 'user_message'
            ? 'user'
            : 'assistant'
          : (m.role as string)) as 'user' | 'assistant',
        content: (m.content as string) || '',
        createdAt: new Date((m.date as string) || (m.created_at as string) || Date.now()),
      }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SSE Streaming
  // ══════════════════════════════════════════════════════════════════════════

  async *sendMessageStream(
    agentId: string,
    message: string,
  ): AsyncGenerator<AgentStreamChunk, StreamResult, unknown> {
    const response = await this.request(`/v1/agents/${agentId}/messages/stream`, {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        stream_tokens: true,
      }),
    });

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const allMessages: LettaMessage[] = [];
    const detectedToolCalls: DetectedStreamToolCall[] = [];
    let tokenCount = 0;
    let accumulatedContent = '';
    let lastAssistantId = '';
    let pendingToolCallName = '';
    let pendingToolCallArgs: Record<string, unknown> = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const jsonStr = line.substring(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.message_type === 'assistant_message') {
              if (event.content) {
                if (tokenCount === 0) {
                  yield { type: 'activity' as const, status: 'responding' as const };
                }
                yield event.content;
                accumulatedContent += event.content;
                lastAssistantId = event.id || lastAssistantId || `msg-${Date.now()}`;
                tokenCount++;
              }
            } else if (
              event.message_type === 'reasoning_message' ||
              event.message_type === 'internal_monologue'
            ) {
              yield { type: 'activity' as const, status: 'thinking' as const };
            } else if (event.message_type === 'tool_call_message') {
              const toolCallName = event.tool_call?.name || event.name || '';
              let toolCallArgs: Record<string, unknown> = {};
              try {
                const argsStr = event.tool_call?.arguments || event.arguments || '{}';
                toolCallArgs = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
              } catch {
                /* ignore parse errors */
              }
              pendingToolCallName = toolCallName;
              pendingToolCallArgs = toolCallArgs;
              yield { type: 'activity' as const, status: 'tool_call' as const, toolName: toolCallName };
            } else if (event.message_type === 'tool_return_message') {
              const toolReturn = event.tool_return || event.content || '';
              const completedToolName = pendingToolCallName;
              if (pendingToolCallName) {
                detectedToolCalls.push({
                  toolName: pendingToolCallName,
                  toolArgs: pendingToolCallArgs,
                  toolReturn: typeof toolReturn === 'string' ? toolReturn : JSON.stringify(toolReturn),
                });
                pendingToolCallName = '';
                pendingToolCallArgs = {};
              }
              yield { type: 'activity' as const, status: 'tool_return' as const, toolName: completedToolName };
            } else if (event.message_type === 'usage_statistics') {
              // end of stream — ignore
            } else if (typeof event === 'string') {
              yield event;
              accumulatedContent += event;
              tokenCount++;
            } else if (event.content && typeof event.content === 'string') {
              yield event.content;
              accumulatedContent += event.content;
              tokenCount++;
            } else if (event.delta) {
              yield event.delta;
              accumulatedContent += event.delta;
              tokenCount++;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (accumulatedContent) {
      allMessages.push({
        id: lastAssistantId,
        role: 'assistant' as const,
        content: accumulatedContent,
        createdAt: new Date(),
      });
    }

    return { messages: allMessages, detectedToolCalls };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Custom Tools + Prompt Enhancers
  // ══════════════════════════════════════════════════════════════════════════

  async createCustomTool(sourceCode: string): Promise<string> {
    const response = await this.request('/v1/tools/', {
      method: 'POST',
      body: JSON.stringify({ source_code: sourceCode }),
    });
    const data = (await response.json()) as { id: string; name: string };
    return data.id;
  }

  async listTools(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.request('/v1/tools/');
    const data = (await response.json()) as Array<{ id: string; name: string }>;
    return data.map((t) => ({ id: t.id, name: t.name }));
  }

  async createPromptEnhancerAgent(
    name: string,
    systemPrompt: string,
    personaValue: string,
    promptStyleValue: string,
  ): Promise<string> {
    // Check if already exists
    const existingResponse = await this.request(`/v1/agents/?name=${encodeURIComponent(name)}`);
    const existing = (await existingResponse.json()) as LettaAgentResponse[];
    if (existing.length > 0) return existing[0].id;

    const personaBlock = await this.createMemoryBlocks([
      { label: 'persona', value: personaValue, limit: 2000 },
    ]);
    const promptStyleBlock = await this.createMemoryBlocks([
      { label: 'prompt_style', value: promptStyleValue, limit: 2000 },
    ]);

    const response = await this.request('/v1/agents/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        block_ids: [personaBlock[0].id, promptStyleBlock[0].id],
        include_base_tools: false,
        model: 'ollama/qwen3-8b-nsfw:latest',
        embedding: 'ollama/nomic-embed-text:latest',
        system: systemPrompt,
        metadata: { agentType: 'prompt_enhancer' },
      }),
    });
    const data = (await response.json()) as LettaAgentResponse;
    return data.id;
  }

  async insertArchivalMemory(agentId: string, text: string): Promise<void> {
    await this.request(`/v1/agents/${agentId}/archival`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Internal HTTP client
  // ══════════════════════════════════════════════════════════════════════════

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Manual redirect handling: FastAPI 307 redirects through CF tunnels point to
      // localhost:8283 (unreachable externally). We catch 307s and re-issue to our baseUrl.
      let response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
        redirect: 'manual',
      });

      if (response.status === 307 || response.status === 308) {
        const location = response.headers.get('location');
        if (location) {
          const redirectUrl = new URL(location);
          const correctedUrl = `${this.baseUrl}${redirectUrl.pathname}${redirectUrl.search}`;
          response = await fetch(correctedUrl, {
            ...init,
            headers,
            signal: controller.signal,
            redirect: 'manual',
          });
        }
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new LettaApiError(response.status, `Letta API error ${response.status}: ${errorText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private mapAgentResponse(data: LettaAgentResponse, conversationId: string): LettaAgent {
    const modelHandle = data.model || data.llm_config?.model || 'unknown';
    const modelEndpointType = modelHandle.startsWith('ollama/') ? 'ollama' : 'anthropic';

    return {
      id: data.id,
      conversationId,
      agentType: (data.metadata?.agentType as LettaAgent['agentType']) || 'companion',
      name: data.name,
      blockIds: (data.metadata?.blockIds as string[]) || [],
      llmConfig: {
        model: modelHandle,
        modelEndpoint: data.llm_config?.model_endpoint || '',
        modelEndpointType,
        contextWindow: data.llm_config?.context_window || 0,
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
