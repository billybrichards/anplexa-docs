/**
 * GetConversationHistoryUseCase Tests
 *
 * Tests the conversation history retrieval including:
 * - Conversation existence validation
 * - User authorization checks
 * - Pagination logic
 * - Message retrieval
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetConversationHistoryUseCase,
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  InvalidPaginationError,
} from '../../chat/GetConversationHistoryUseCase.js';
import type { IConversationRepository } from '../../../repositories/interfaces/conversation.repository.interface.js';
import type { IMessageRepository } from '../../../repositories/interfaces/message.repository.interface.js';
import type { ConversationDTO, MessageDTO } from '@anplexa/contracts';

describe('GetConversationHistoryUseCase', () => {
  let useCase: GetConversationHistoryUseCase;
  let mockConversationRepository: IConversationRepository;
  let mockMessageRepository: IMessageRepository;

  const mockConversation: ConversationDTO = {
    id: 'conv-123',
    userId: 'user-123',
    title: 'Test Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createMockMessage = (id: string, role: 'user' | 'assistant' = 'user'): MessageDTO => ({
    id,
    conversationId: 'conv-123',
    role,
    content: `Message ${id}`,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    mockConversationRepository = {
      getAll: vi.fn(),
      getById: vi.fn(),
      getByUserId: vi.fn(),
      searchByContent: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockMessageRepository = {
      getByConversationId: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      bulkCreate: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GetConversationHistoryUseCase(
      mockConversationRepository,
      mockMessageRepository
    );
  });

  describe('execute', () => {
    it('should retrieve conversation history with default pagination', async () => {
      // Setup mocks
      const mockMessages = [
        createMockMessage('msg-1'),
        createMockMessage('msg-2'),
        createMockMessage('msg-3'),
      ];

      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue(mockMessages);

      // Execute
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
      });

      // Verify
      expect(result.conversation).toEqual(mockConversation);
      expect(result.messages).toEqual(mockMessages);
      expect(result.totalMessages).toBe(3);
      expect(result.hasMore).toBe(false);
      expect(mockMessageRepository.getByConversationId).toHaveBeenCalledWith(
        'conv-123',
        { limit: 51, offset: 0 } // Default limit + 1 for hasMore detection
      );
    });

    it('should apply custom limit and offset', async () => {
      // Setup mocks
      const mockMessages = [createMockMessage('msg-1'), createMockMessage('msg-2')];

      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue(mockMessages);

      // Execute
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 10,
        offset: 5,
      });

      // Verify
      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(mockMessageRepository.getByConversationId).toHaveBeenCalledWith(
        'conv-123',
        { limit: 11, offset: 5 } // Requested limit + 1
      );
    });

    it('should detect when there are more messages available', async () => {
      // Setup mocks - return limit + 1 messages
      const mockMessages = Array.from({ length: 11 }, (_, i) =>
        createMockMessage(`msg-${i}`)
      );

      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue(mockMessages);

      // Execute with limit of 10
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 10,
      });

      // Verify
      expect(result.messages).toHaveLength(10); // Should trim the extra message
      expect(result.hasMore).toBe(true);
      expect(result.totalMessages).toBe(11); // 0 offset + 10 messages + 1 more
    });

    it('should calculate total messages correctly with offset', async () => {
      // Setup mocks
      const mockMessages = Array.from({ length: 6 }, (_, i) =>
        createMockMessage(`msg-${i}`)
      );

      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue(mockMessages);

      // Execute with offset
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 5,
        offset: 10,
      });

      // Verify
      expect(result.messages).toHaveLength(5);
      expect(result.hasMore).toBe(true);
      expect(result.totalMessages).toBe(16); // 10 offset + 5 messages + 1 more
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      // Setup mocks
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(null);

      // Execute & Verify
      await expect(
        useCase.execute({
          conversationId: 'non-existent',
          userId: 'user-123',
        })
      ).rejects.toThrow(ConversationNotFoundError);

      await expect(
        useCase.execute({
          conversationId: 'non-existent',
          userId: 'user-123',
        })
      ).rejects.toThrow('Conversation not found: non-existent');
    });

    it('should throw UnauthorizedConversationAccessError when user does not own conversation', async () => {
      // Setup mocks
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);

      // Execute & Verify
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'different-user',
        })
      ).rejects.toThrow(UnauthorizedConversationAccessError);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'different-user',
        })
      ).rejects.toThrow('User different-user is not authorized to access conversation conv-123');
    });

    it('should handle empty message list', async () => {
      // Setup mocks
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue([]);

      // Execute
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
      });

      // Verify
      expect(result.messages).toEqual([]);
      expect(result.totalMessages).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('pagination validation', () => {
    beforeEach(() => {
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue([]);
    });

    it('should throw InvalidPaginationError for negative limit', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: -1,
        })
      ).rejects.toThrow(InvalidPaginationError);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: -1,
        })
      ).rejects.toThrow('Limit must be a positive integer');
    });

    it('should throw InvalidPaginationError for zero limit', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: 0,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });

    it('should throw InvalidPaginationError for non-integer limit', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: 10.5,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });

    it('should throw InvalidPaginationError for limit exceeding max', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: 501,
        })
      ).rejects.toThrow(InvalidPaginationError);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          limit: 501,
        })
      ).rejects.toThrow('Limit cannot exceed 500');
    });

    it('should accept limit at exactly max (500)', async () => {
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 500,
      });

      expect(result).toBeDefined();
      expect(mockMessageRepository.getByConversationId).toHaveBeenCalledWith(
        'conv-123',
        { limit: 501, offset: 0 }
      );
    });

    it('should throw InvalidPaginationError for negative offset', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          offset: -1,
        })
      ).rejects.toThrow(InvalidPaginationError);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          offset: -1,
        })
      ).rejects.toThrow('Offset must be a non-negative integer');
    });

    it('should throw InvalidPaginationError for non-integer offset', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
          offset: 5.5,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });

    it('should accept offset of 0', async () => {
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        offset: 0,
      });

      expect(result).toBeDefined();
    });

    it('should use default values for undefined pagination params', async () => {
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: undefined,
        offset: undefined,
      });

      expect(result).toBeDefined();
      expect(mockMessageRepository.getByConversationId).toHaveBeenCalledWith(
        'conv-123',
        { limit: 51, offset: 0 }
      );
    });

    it('should use default values for null pagination params', async () => {
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: null as any,
        offset: null as any,
      });

      expect(result).toBeDefined();
      expect(mockMessageRepository.getByConversationId).toHaveBeenCalledWith(
        'conv-123',
        { limit: 51, offset: 0 }
      );
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      vi.mocked(mockConversationRepository.getById).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle message repository errors', async () => {
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockRejectedValue(
        new Error('Failed to fetch messages')
      );

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-123',
        })
      ).rejects.toThrow('Failed to fetch messages');
    });
  });

  describe('edge cases', () => {
    it('should handle conversation with exactly limit messages', async () => {
      const mockMessages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(`msg-${i}`)
      );

      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue(mockMessages);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 10,
      });

      expect(result.messages).toHaveLength(10);
      expect(result.hasMore).toBe(false);
    });

    it('should handle large offset with no remaining messages', async () => {
      vi.mocked(mockConversationRepository.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepository.getByConversationId).mockResolvedValue([]);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-123',
        limit: 10,
        offset: 1000,
      });

      expect(result.messages).toEqual([]);
      expect(result.totalMessages).toBe(1000);
      expect(result.hasMore).toBe(false);
    });
  });
});
