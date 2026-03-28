/**
 * useLiveKit — Hook for managing LiveKit voice/video call lifecycle.
 *
 * Requests a token from the API, exposes connection state, and provides
 * connect/disconnect actions for the LiveKitRoom component.
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config';

export interface UseLiveKitOptions {
  conversationId?: string | null;
  token?: string;
}

export interface UseLiveKitReturn {
  /** LiveKit JWT access token for the room */
  livekitToken: string | null;
  /** WebSocket URL for the LiveKit server */
  wsUrl: string | null;
  /** Room name assigned by the server */
  roomName: string | null;
  /** Whether we are currently fetching a token / connecting */
  isConnecting: boolean;
  /** Whether a call is active (token has been obtained) */
  isInCall: boolean;
  /** Error from token request */
  error: string | null;
  /** Start a call — fetches token and enables LiveKitRoom */
  startCall: (hasVideo?: boolean) => Promise<void>;
  /** End a call — clears token state */
  endCall: () => void;
}

export function useLiveKit(options: UseLiveKitOptions = {}): UseLiveKitReturn {
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = API_BASE_URL;

  const startCall = useCallback(async (hasVideo = false) => {
    if (!options.conversationId) {
      setError('No active conversation — send a message first');
      return;
    }
    setIsConnecting(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }

      const res = await fetch(`${apiBase}/api/voice/token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId: options.conversationId,
          hasVideo,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Failed to start call (${res.status})`);
      }

      const data: { token: string; roomName: string; wsUrl: string } = await res.json();
      setLivekitToken(data.token);
      setWsUrl(data.wsUrl);
      setRoomName(data.roomName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call');
    } finally {
      setIsConnecting(false);
    }
  }, [options.conversationId, options.token, apiBase]);

  const endCall = useCallback(() => {
    setLivekitToken(null);
    setWsUrl(null);
    setRoomName(null);
    setError(null);
  }, []);

  return {
    livekitToken,
    wsUrl,
    roomName,
    isConnecting,
    isInCall: livekitToken !== null,
    error,
    startCall,
    endCall,
  };
}
