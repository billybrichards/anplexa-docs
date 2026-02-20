/**
 * GetConversationHistoryUseCase Tests
 *
 * Integration tests for the GetConversationHistoryUseCase.
 * Tests all success and error scenarios with mocked repositories.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GetConversationHistoryUseCase,
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  InvalidPaginationError,
} from '../GetConversationHistoryUseCase.js';
import type { IConversationRepository } from '../../../repositories/interfaces/conversation.repository.interface.js';
import type { IMessageRepository } from '../../../repositories/interfaces/message.repository.interface.js';
import type { ConversationDTO, MessageDTO } from '@anplexa/contracts';

describe('GetConversationHistoryUseCase', () => {
  let useCase: GetConversationHistoryUseCase;
  let mockConversationRepo: IConversationRepository;
  let mockMessageRepo: IMessageRepository;

  const mockConversation: ConversationDTO = {
    id: 'conv-123',
    userId: 'user-456',
    title: 'Test Conversation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockMessages: MessageDTO[] = [
    {
      id: 'msg-001',
      conversationId: 'conv-123',
      role: 'user',
      content: 'First message',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'msg-002',
      conversationId: 'conv-123',
      role: 'assistant',
      content: 'First response',
      createdAt: '2024-01-01T00:00:01Z',
    },
    {
      id: 'msg-003',
      conversationId: 'conv-123',
      role: 'user',
      content: 'Second message',
      createdAt: '2024-01-01T00:00:02Z',
    },
  ];

  beforeEach(() => {
    // Setup mock repositories
    mockConversationRepo = {
      getById: vi.fn(),
      getByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    mockMessageRepo = {
      getByConversationId: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      bulkCreate: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GetConversationHistoryUseCase(mockConversationRepo, mockMessageRepo);
  });

  describe('Success scenarios', () => {
    it('should successfully get conversation history with default pagination', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(mockMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
      });

      // Assert
      expect(result.conversation).toEqual(mockConversation);
      expect(result.messages).toEqual(mockMessages);
      expect(result.totalMessages).toBe(3);
      expect(result.hasMore).toBe(false);

      expect(mockConversationRepo.getById).toHaveBeenCalledWith('conv-123');
      expect(mockMessageRepo.getByConversationId).toHaveBeenCalledWith('conv-123', {
        limit: 51, // Default limit (50) + 1 to check for more
        offset: 0,
      });
    });

    it('should successfully get conversation history with custom limit', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(mockMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
      });

      // Assert
      expect(result.messages).toEqual(mockMessages);
      expect(mockMessageRepo.getByConversationId).toHaveBeenCalledWith('conv-123', {
        limit: 11, // Custom limit + 1
        offset: 0,
      });
    });

    it('should successfully get conversation history with custom offset', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(mockMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
        offset: 20,
      });

      // Assert
      expect(result.messages).toEqual(mockMessages);
      expect(mockMessageRepo.getByConversationId).toHaveBeenCalledWith('conv-123', {
        limit: 11,
        offset: 20,
      });
    });

    it('should detect when there are more messages', async () => {
      // Arrange
      const manyMessages: MessageDTO[] = Array.from({ length: 11 }, (_, i) => ({
        id: `msg-${i}`,
        conversationId: 'conv-123',
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        createdAt: `2024-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
      }));

      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(manyMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
      });

      // Assert
      expect(result.messages).toHaveLength(10); // Should trim to limit
      expect(result.hasMore).toBe(true);
      expect(result.totalMessages).toBe(11); // offset (0) + returned (10) + has more (1)
    });

    it('should handle empty conversation', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
      });

      // Assert
      expect(result.conversation).toEqual(mockConversation);
      expect(result.messages).toEqual([]);
      expect(result.totalMessages).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Error scenarios', () => {
    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-999',
          userId: 'user-456',
        })
      ).rejects.toThrow(ConversationNotFoundError);

      expect(mockConversationRepo.getById).toHaveBeenCalledWith('conv-999');
      expect(mockMessageRepo.getByConversationId).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedConversationAccessError when user does not own conversation', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'wrong-user',
        })
      ).rejects.toThrow(UnauthorizedConversationAccessError);

      expect(mockMessageRepo.getByConversationId).not.toHaveBeenCalled();
    });

    it('should throw InvalidPaginationError for negative limit', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: -1,
        })
      ).rejects.toThrow(InvalidPaginationError);
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: -1,
        })
      ).rejects.toThrow('Limit must be a positive integer');
    });

    it('should throw InvalidPaginationError for zero limit', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: 0,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });

    it('should throw InvalidPaginationError for non-integer limit', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: 10.5,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });

    it('should throw InvalidPaginationError for limit exceeding maximum', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: 501, // Exceeds MAX_LIMIT of 500
        })
      ).rejects.toThrow(InvalidPaginationError);
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          limit: 501,
        })
      ).rejects.toThrow('Limit cannot exceed 500');
    });

    it('should throw InvalidPaginationError for negative offset', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          offset: -1,
        })
      ).rejects.toThrow(InvalidPaginationError);
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          offset: -1,
        })
      ).rejects.toThrow('Offset must be a non-negative integer');
    });

    it('should throw InvalidPaginationError for non-integer offset', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          offset: 10.5,
        })
      ).rejects.toThrow(InvalidPaginationError);
    });
  });

  describe('Edge cases', () => {
    it('should handle limit at maximum allowed value', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(mockMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 500, // Exactly at MAX_LIMIT
      });

      // Assert
      expect(result.messages).toEqual(mockMessages);
      expect(mockMessageRepo.getByConversationId).toHaveBeenCalledWith('conv-123', {
        limit: 501,
        offset: 0,
      });
    });

    it('should handle offset with zero messages remaining', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
        offset: 100,
      });

      // Assert
      expect(result.messages).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.totalMessages).toBe(100); // Just the offset
    });

    it('should handle exactly limit messages without indicating more', async () => {
      // Arrange
      const exactMessages: MessageDTO[] = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        conversationId: 'conv-123',
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        createdAt: `2024-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
      }));

      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(exactMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
      });

      // Assert
      expect(result.messages).toHaveLength(10);
      expect(result.hasMore).toBe(false);
    });

    it('should handle large offset values', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(mockMessages);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
        offset: 10000,
      });

      // Assert
      expect(result.messages).toEqual(mockMessages);
      expect(result.totalMessages).toBe(10003); // offset + messages
      expect(mockMessageRepo.getByConversationId).toHaveBeenCalledWith('conv-123', {
        limit: 11,
        offset: 10000,
      });
    });

    it('should handle single message result', async () => {
      // Arrange
      const singleMessage: MessageDTO[] = [mockMessages[0]];
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(singleMessage);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        limit: 10,
      });

      // Assert
      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.totalMessages).toBe(1);
    });
  });
});
