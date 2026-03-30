/**
 * SSE Parser for chat streaming from Express API.
 *
 * Event types match the backend SSE contract (apps/api/src/routes/chat/send.ts):
 * - start: Stream beginning with conversationId + messageId
 * - token: Text chunk from LLM
 * - activity: Agent status (thinking, tool_call, tool_return, responding)
 * - media_started: Media generation triggered
 * - done: Stream complete with metadata
 * - error: Stream error
 */

// Local type — mirrors @anplexa/contracts AgentActivityStatus to avoid cross-package resolution issues
type AgentActivityStatus = 'thinking' | 'tool_call' | 'tool_return' | 'responding';

export interface SSEStartEvent {
  type: 'start';
  conversationId: string;
  messageId: string;
}

export interface SSETokenEvent {
  type: 'token';
  content: string;
}

export interface SSEActivityEvent {
  type: 'activity';
  status: AgentActivityStatus;
  toolName?: string;
}

export interface SSEMediaStartedEvent {
  type: 'media_started';
  generationId?: string;
  comfyRequestId?: string;
  mediaType: string;
  status: string;
  error?: string;
}

export interface SSEDoneEvent {
  type: 'done';
  conversationId: string;
  messageId: string;
  creditsRemaining?: number;
  chunkCount?: number;
}

export interface SSEErrorEvent {
  type: 'error';
  error: string;
  code?: string;
}

export type SSEEvent =
  | SSEStartEvent
  | SSETokenEvent
  | SSEActivityEvent
  | SSEMediaStartedEvent
  | SSEDoneEvent
  | SSEErrorEvent;

export async function* parseSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  if (!response.body) {
    yield { type: 'error', error: 'No response body' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      let currentData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.substring(7).trim();
        } else if (line.startsWith('data: ')) {
          currentData = line.substring(6);
        } else if (line === '' && currentEvent && currentData) {
          try {
            const parsed = JSON.parse(currentData);
            switch (currentEvent) {
              case 'start':
                yield {
                  type: 'start',
                  conversationId: parsed.conversationId,
                  messageId: parsed.messageId,
                };
                break;
              case 'token':
                yield { type: 'token', content: parsed.content };
                break;
              case 'activity':
                yield {
                  type: 'activity',
                  status: parsed.status,
                  toolName: parsed.toolName,
                };
                break;
              case 'media_started':
                yield {
                  type: 'media_started',
                  generationId: parsed.generationId,
                  comfyRequestId: parsed.comfyRequestId,
                  mediaType: parsed.mediaType || parsed.type,
                  status: parsed.status,
                  error: parsed.error,
                };
                break;
              case 'done':
                yield {
                  type: 'done',
                  conversationId: parsed.conversationId,
                  messageId: parsed.messageId,
                  creditsRemaining: parsed.creditsRemaining,
                  chunkCount: parsed.chunkCount,
                };
                break;
              case 'error':
                yield { type: 'error', error: parsed.error || parsed.message };
                break;
            }
          } catch {
            /* skip malformed JSON */
          }
          currentEvent = '';
          currentData = '';
        }
      }
    }
    // Process any remaining buffer content after the stream ends
    if (buffer.trim()) {
      let currentEvent = '';
      let currentData = '';
      const remainingLines = buffer.split('\n');
      for (const line of remainingLines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.substring(7).trim();
        } else if (line.startsWith('data: ')) {
          currentData = line.substring(6);
        }
      }
      if (currentEvent && currentData) {
        try {
          const parsed = JSON.parse(currentData);
          switch (currentEvent) {
            case 'done':
              yield {
                type: 'done',
                conversationId: parsed.conversationId,
                messageId: parsed.messageId,
                creditsRemaining: parsed.creditsRemaining,
                chunkCount: parsed.chunkCount,
              };
              break;
            case 'error':
              yield { type: 'error', error: parsed.error || parsed.message };
              break;
            case 'token':
              yield { type: 'token', content: parsed.content };
              break;
            case 'activity':
              yield { type: 'activity', status: parsed.status, toolName: parsed.toolName };
              break;
          }
        } catch {
          /* skip malformed trailing JSON */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
