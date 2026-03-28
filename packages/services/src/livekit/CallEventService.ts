import { v4 as uuidv4 } from 'uuid';
import type {
  ILivekitCallEventRepository,
  CreateLivekitCallEventData,
} from '@anplexa/core';
import type { CallEventDTO } from '@anplexa/contracts';

/**
 * Service for persisting and querying call lifecycle events.
 *
 * Accepts CallEventDTO from API/webhooks and transforms them
 * into repository-compatible records with generated IDs.
 */
export class CallEventService {
  constructor(
    private readonly eventRepo: ILivekitCallEventRepository,
  ) {}

  /**
   * Persist a batch of call events.
   */
  async logEvents(events: CallEventDTO[]): Promise<void> {
    const records: CreateLivekitCallEventData[] = events.map((e) => ({
      id: uuidv4(),
      roomName: e.roomName,
      roomSid: e.roomSid,
      conversationId: e.conversationId,
      userId: e.userId,
      companionId: e.companionId,
      sessionId: e.sessionId,
      eventType: e.eventType,
      eventName: e.eventName,
      level: e.level,
      source: e.source,
      metadata: e.metadata ? JSON.stringify(e.metadata) : undefined,
      latencyMs: e.latencyMs,
    }));

    await this.eventRepo.insertBatch(records);
  }

  /**
   * Retrieve all events for a given room.
   */
  async getEventsByRoom(roomName: string) {
    return this.eventRepo.findByRoom(roomName);
  }
}
