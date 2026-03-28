import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CallEventService } from '../CallEventService.js';
import type { ILivekitCallEventRepository } from '@anplexa/core';
import type { CallEventDTO } from '@anplexa/contracts';

function createMockRepo(): ILivekitCallEventRepository {
  return {
    insertBatch: vi.fn(async () => {}),
    findByRoom: vi.fn(async () => []),
  };
}

describe('CallEventService', () => {
  let mockRepo: ILivekitCallEventRepository;
  let service: CallEventService;

  beforeEach(() => {
    mockRepo = createMockRepo();
    service = new CallEventService(mockRepo);
  });

  describe('logEvents', () => {
    it('should persist events with generated IDs', async () => {
      const events: CallEventDTO[] = [
        {
          roomName: 'room-1',
          eventType: 'call',
          eventName: 'call_started',
          level: 'info',
          source: 'api',
        },
        {
          roomName: 'room-1',
          eventType: 'agent',
          eventName: 'agent_joined',
          metadata: { agentId: 'abc' },
        },
      ];

      await service.logEvents(events);

      expect(mockRepo.insertBatch).toHaveBeenCalledTimes(1);
      const records = (mockRepo.insertBatch as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(records).toHaveLength(2);

      // Each record should have a UUID id
      expect(records[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );

      // First event
      expect(records[0].roomName).toBe('room-1');
      expect(records[0].eventType).toBe('call');
      expect(records[0].eventName).toBe('call_started');
      expect(records[0].level).toBe('info');
      expect(records[0].source).toBe('api');

      // Second event — metadata serialized as JSON
      expect(records[1].metadata).toBe('{"agentId":"abc"}');
    });

    it('should handle events without optional fields', async () => {
      const events: CallEventDTO[] = [
        {
          roomName: 'room-2',
          eventType: 'error',
          eventName: 'connection_failed',
        },
      ];

      await service.logEvents(events);

      const records = (mockRepo.insertBatch as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(records[0].roomSid).toBeUndefined();
      expect(records[0].metadata).toBeUndefined();
      expect(records[0].latencyMs).toBeUndefined();
    });
  });

  describe('getEventsByRoom', () => {
    it('should delegate to repository', async () => {
      (mockRepo.findByRoom as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: '1', roomName: 'room-1', eventType: 'call', eventName: 'started' },
      ]);

      const results = await service.getEventsByRoom('room-1');
      expect(mockRepo.findByRoom).toHaveBeenCalledWith('room-1');
      expect(results).toHaveLength(1);
    });
  });
});
