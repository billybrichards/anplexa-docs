/**
 * Media Generation Repository Implementation
 *
 * Drizzle ORM implementation for media_generations table.
 */

import type { Database } from '@anplexa/database';
import { mediaGenerations, eq, desc } from '@anplexa/database';
import type {
  IMediaGenerationRepository,
  MediaGenerationRecord,
  CreateMediaGenerationData,
  UpdateMediaGenerationData,
} from './interfaces/media-generation.repository.interface.js';

export class MediaGenerationRepository implements IMediaGenerationRepository {
  constructor(private readonly db: Database) {}

  async create(data: CreateMediaGenerationData): Promise<MediaGenerationRecord> {
    const [result] = await this.db
      .insert(mediaGenerations)
      .values({
        id: data.id,
        userId: data.userId,
        conversationId: data.conversationId || null,
        companionPersonaId: data.companionPersonaId || null,
        type: data.type,
        status: 'pending',
        enhancedPrompt: data.enhancedPrompt,
        originalRequest: data.originalRequest || null,
        seed: data.seed || null,
        workflowName: data.workflowName || null,
        debugLogs: JSON.stringify([{
          timestamp: new Date().toISOString(),
          step: 'created',
          message: 'Generation record created',
        }]),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async getById(id: string): Promise<MediaGenerationRecord | null> {
    const results = await this.db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, id))
      .limit(1);

    return results[0] || null;
  }

  async getByComfyRequestId(comfyRequestId: string): Promise<MediaGenerationRecord | null> {
    const results = await this.db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.comfyRequestId, comfyRequestId))
      .limit(1);

    return results[0] || null;
  }

  async update(id: string, data: UpdateMediaGenerationData): Promise<MediaGenerationRecord> {
    const [result] = await this.db
      .update(mediaGenerations)
      .set(data)
      .where(eq(mediaGenerations.id, id))
      .returning();

    return result;
  }

  async findByConversation(conversationId: string): Promise<MediaGenerationRecord[]> {
    return this.db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.conversationId, conversationId))
      .orderBy(desc(mediaGenerations.createdAt));
  }

  async findByUser(userId: string, limit: number = 50): Promise<MediaGenerationRecord[]> {
    return this.db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.userId, userId))
      .orderBy(desc(mediaGenerations.createdAt))
      .limit(limit);
  }
}
