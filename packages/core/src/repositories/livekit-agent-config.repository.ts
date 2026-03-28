/**
 * LiveKit Agent Config Repository Implementation
 *
 * Drizzle ORM implementation for livekit_agent_config table (key-value store).
 */

import type { Database } from '@anplexa/database';
import { livekitAgentConfig, eq } from '@anplexa/database';
import type {
  ILivekitAgentConfigRepository,
  LivekitAgentConfigRecord,
} from './interfaces/livekit-agent-config.repository.interface.js';

export class LivekitAgentConfigRepository implements ILivekitAgentConfigRepository {
  constructor(private readonly db: Database) {}

  async getAll(): Promise<LivekitAgentConfigRecord[]> {
    return this.db.select().from(livekitAgentConfig);
  }

  async getByKey(key: string): Promise<LivekitAgentConfigRecord | null> {
    const results = await this.db
      .select()
      .from(livekitAgentConfig)
      .where(eq(livekitAgentConfig.key, key))
      .limit(1);

    return results[0] || null;
  }

  async upsert(key: string, value: unknown, updatedBy?: string): Promise<LivekitAgentConfigRecord> {
    const now = new Date().toISOString();

    const [result] = await this.db
      .insert(livekitAgentConfig)
      .values({
        key,
        value,
        updatedAt: now,
        updatedBy: updatedBy || null,
      })
      .onConflictDoUpdate({
        target: livekitAgentConfig.key,
        set: {
          value,
          updatedAt: now,
          updatedBy: updatedBy || null,
        },
      })
      .returning();

    return result;
  }
}
