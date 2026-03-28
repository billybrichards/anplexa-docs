/**
 * LiveKit Call Event Repository Interface
 *
 * Data access contract for call lifecycle event logging.
 */

export interface LivekitCallEventRecord {
  id: string;
  roomName: string;
  roomSid: string | null;
  conversationId: string | null;
  userId: string | null;
  companionId: string | null;
  sessionId: string | null;
  eventType: string;
  eventName: string;
  level: string | null;
  source: string | null;
  metadata: string | null;
  latencyMs: number | null;
  createdAt: string | null;
}

export interface CreateLivekitCallEventData {
  id: string;
  roomName: string;
  roomSid?: string;
  conversationId?: string;
  userId?: string;
  companionId?: string;
  sessionId?: string;
  eventType: string;
  eventName: string;
  level?: string;
  source?: string;
  metadata?: string;
  latencyMs?: number;
}

export interface ILivekitCallEventRepository {
  insertBatch(events: CreateLivekitCallEventData[]): Promise<void>;
  findByRoom(roomName: string): Promise<LivekitCallEventRecord[]>;
}
