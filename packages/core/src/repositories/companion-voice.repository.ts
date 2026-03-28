/**
 * Companion Voice Repository Implementation
 *
 * Drizzle ORM implementation for companion_voices table.
 */

import type { Database } from '@anplexa/database';
import { companionVoices, eq, and } from '@anplexa/database';
import type {
  ICompanionVoiceRepository,
  CompanionVoiceRecord,
  CreateCompanionVoiceData,
} from './interfaces/companion-voice.repository.interface.js';

export class CompanionVoiceRepository implements ICompanionVoiceRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<CompanionVoiceRecord | null> {
    const results = await this.db
      .select()
      .from(companionVoices)
      .where(eq(companionVoices.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByPersonaId(companionPersonaId: string): Promise<CompanionVoiceRecord[]> {
    return this.db
      .select()
      .from(companionVoices)
      .where(eq(companionVoices.companionPersonaId, companionPersonaId));
  }

  async findEnabled(): Promise<CompanionVoiceRecord[]> {
    return this.db
      .select()
      .from(companionVoices)
      .where(eq(companionVoices.enabled, true));
  }

  async create(data: CreateCompanionVoiceData): Promise<CompanionVoiceRecord> {
    const [result] = await this.db
      .insert(companionVoices)
      .values({
        id: data.id,
        companionPersonaId: data.companionPersonaId || null,
        voiceId: data.voiceId,
        voiceName: data.voiceName,
        gender: data.gender,
        simliFaceId: data.simliFaceId || null,
        ttsModel: data.ttsModel || 'eleven_turbo_v2',
        enabled: data.enabled ?? true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async update(id: string, data: Partial<CompanionVoiceRecord>): Promise<CompanionVoiceRecord> {
    const [result] = await this.db
      .update(companionVoices)
      .set(data)
      .where(eq(companionVoices.id, id))
      .returning();

    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(companionVoices).where(eq(companionVoices.id, id));
  }
}
