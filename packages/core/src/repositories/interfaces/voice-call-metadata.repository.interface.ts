/**
 * Voice Call Metadata Repository Interface
 *
 * Data access contract for voice/video call session metadata.
 */

export interface VoiceCallMetadataRecord {
  id: string;
  conversationId: string;
  userId: string;
  roomName: string;
  provider: string | null;
  callStatus: string;
  hasVideo: boolean | null;
  durationSeconds: number | null;
  messageCount: number | null;
  memorySynced: boolean | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
}

export interface CreateVoiceCallMetadataData {
  id: string;
  conversationId: string;
  userId: string;
  roomName: string;
  provider?: string;
  callStatus?: string;
  hasVideo?: boolean;
}

export interface IVoiceCallMetadataRepository {
  getById(id: string): Promise<VoiceCallMetadataRecord | null>;
  findByConversation(conversationId: string): Promise<VoiceCallMetadataRecord[]>;
  findByRoomName(roomName: string): Promise<VoiceCallMetadataRecord | null>;
  create(data: CreateVoiceCallMetadataData): Promise<VoiceCallMetadataRecord>;
  updateCallStatus(
    id: string,
    status: string,
    metadata?: { durationSeconds?: number; messageCount?: number; memorySynced?: boolean; endedAt?: string },
  ): Promise<VoiceCallMetadataRecord>;
  delete(id: string): Promise<void>;
}
