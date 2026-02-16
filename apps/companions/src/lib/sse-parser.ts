/**
 * SSE Parser for chat streaming from Express API.
 */

export interface SSETokenEvent { type: 'token'; content: string; }
export interface SSEActivityEvent { type: 'agent_activity'; status: string; toolName?: string; }
export interface SSEMediaStartedEvent { type: 'media_started'; generationId: string; mediaType: string; }
export interface SSEDoneEvent { type: 'done'; }
export interface SSEErrorEvent { type: 'error'; message: string; }

export type SSEEvent = SSETokenEvent | SSEActivityEvent | SSEMediaStartedEvent | SSEDoneEvent | SSEErrorEvent;

export async function* parseSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  if (!response.body) { yield { type: 'error', message: 'No response body' }; return; }

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
              case 'token': yield { type: 'token', content: parsed.content }; break;
              case 'agent_activity': yield { type: 'agent_activity', status: parsed.status, toolName: parsed.toolName }; break;
              case 'media_started': yield { type: 'media_started', generationId: parsed.generationId, mediaType: parsed.type }; break;
              case 'done': yield { type: 'done' }; break;
              case 'error': yield { type: 'error', message: parsed.message }; break;
            }
          } catch { /* skip */ }
          currentEvent = '';
          currentData = '';
        }
      }
    }
  } finally { reader.releaseLock(); }
}
