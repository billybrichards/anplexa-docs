/**
 * Voice Call Metadata Repository Implementation
 *
 * Drizzle ORM implementation for voice_call_metadata table.
 */

import type { Database } from '@anplexa/database';
import { voiceCallMetadata, eq } from '@anplexa/database';
import type {
  IVoiceCallMetadataRepository,
  VoiceCallMetadataRecord,
  CreateVoiceCallMetadataData,
} from './interfaces/voice-call-metadata.repository.interface.js';

export class VoiceCallMetadataRepository implements IVoiceCallMetadataRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<VoiceCallMetadataRecord | null> {
    const results = await this.db
      .select()
      .from(voiceCallMetadata)
      .where(eq(voiceCallMetadata.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByConversation(conversationId: string): Promise<VoiceCallMetadataRecord[]> {
    return this.db
      .select()
      .from(voiceCallMetadata)
      .where(eq(voiceCallMetadata.conversationId, conversationId));
  }

  async findByRoomName(roomName: string): Promise<VoiceCallMetadataRecord | null> {
    const results = await this.db
      .select()
      .from(voiceCallMetadata)
      .where(eq(voiceCallMetadata.roomName, roomName))
      .limit(1);

    return results[0] || null;
  }

  async create(data: CreateVoiceCallMetadataData): Promise<VoiceCallMetadataRecord> {
    const [result] = await this.db
      .insert(voiceCallMetadata)
      .values({
        id: data.id,
        conversationId: data.conversationId,
        userId: data.userId,
        roomName: data.roomName,
        provider: data.provider || 'livekit',
        callStatus: data.callStatus || 'initiated',
        hasVideo: data.hasVideo ?? false,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async updateCallStatus(
    id: string,
    status: string,
    metadata?: { durationSeconds?: number; messageCount?: number; memorySynced?: boolean; endedAt?: string },
  ): Promise<VoiceCallMetadataRecord> {
    const updates: Record<string, unknown> = { callStatus: status };
    if (metadata?.durationSeconds !== undefined) updates.durationSeconds = metadata.durationSeconds;
    if (metadata?.messageCount !== undefined) updates.messageCount = metadata.messageCount;
    if (metadata?.memorySynced !== undefined) updates.memorySynced = metadata.memorySynced;
    if (metadata?.endedAt) updates.endedAt = metadata.endedAt;

    const [result] = await this.db
      .update(voiceCallMetadata)
      .set(updates)
      .where(eq(voiceCallMetadata.id, id))
      .returning();

    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(voiceCallMetadata).where(eq(voiceCallMetadata.id, id));
  }
}
