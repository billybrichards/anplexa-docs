/**
 * LiveKit Call Event Repository Implementation
 *
 * Drizzle ORM implementation for livekit_call_events table.
 */

import type { Database } from '@anplexa/database';
import { livekitCallEvents, eq, desc } from '@anplexa/database';
import type {
  ILivekitCallEventRepository,
  LivekitCallEventRecord,
  CreateLivekitCallEventData,
} from './interfaces/livekit-call-event.repository.interface.js';

export class LivekitCallEventRepository implements ILivekitCallEventRepository {
  constructor(private readonly db: Database) {}

  async insertBatch(events: CreateLivekitCallEventData[]): Promise<void> {
    if (events.length === 0) return;

    const records = events.map((e) => ({
      ...e,
      createdAt: new Date().toISOString(),
    }));

    await this.db.insert(livekitCallEvents).values(records);
  }

  async findByRoom(roomName: string): Promise<LivekitCallEventRecord[]> {
    return this.db
      .select()
      .from(livekitCallEvents)
      .where(eq(livekitCallEvents.roomName, roomName))
      .orderBy(desc(livekitCallEvents.createdAt));
  }
}
