/**
 * SendMessageUseCase Tests
 *
 * Integration tests for the SendMessageUseCase.
 * Tests all success and error scenarios with mocked repositories.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SendMessageUseCase,
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  EmptyMessageError,
  AIServiceError,
} from '../SendMessageUseCase';
import type { IConversationRepository } from '../../../repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository } from '../../../repositories/interfaces/message.repository.interface';
import type { OllamaGateway } from '@anplexa/services/ai';
import type { ConversationDTO, MessageDTO } from '@anplexa/contracts';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockConversationRepo: IConversationRepository;
  let mockMessageRepo: IMessageRepository;
  let mockOllamaGateway: OllamaGateway;

  const mockConversation: ConversationDTO = {
    id: 'conv-123',
    userId: 'user-456',
    title: 'Test Conversation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockUserMessage: MessageDTO = {
    id: 'msg-001',
    conversationId: 'conv-123',
    role: 'user',
    content: 'Hello, AI!',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockAssistantMessage: MessageDTO = {
    id: 'msg-002',
    conversationId: 'conv-123',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    createdAt: '2024-01-01T00:00:00Z',
  };

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

    mockOllamaGateway = {
      generate: vi.fn(),
      generateStream: vi.fn(),
      testConnection: vi.fn(),
      getModels: vi.fn(),
      selectModel: vi.fn(),
      getConfig: vi.fn(),
    } as unknown as OllamaGateway;

    useCase = new SendMessageUseCase(
      mockConversationRepo,
      mockMessageRepo,
      mockOllamaGateway
    );
  });

  describe('Success scenarios', () => {
    it('should successfully send a message and receive AI response', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('Hello! How can I help you today?');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: 'Hello, AI!',
      });

      // Assert
      expect(result).toEqual({
        userMessage: mockUserMessage,
        assistantMessage: mockAssistantMessage,
        conversationId: 'conv-123',
      });

      expect(mockConversationRepo.getById).toHaveBeenCalledWith('conv-123');
      expect(mockMessageRepo.create).toHaveBeenCalledTimes(2);
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello, AI!',
      });
      expect(mockOllamaGateway.generate).toHaveBeenCalled();
      expect(mockConversationRepo.update).toHaveBeenCalledWith(
        'conv-123',
        expect.objectContaining({ updatedAt: expect.any(String) })
      );
    });

    it('should trim whitespace from user message', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('Response');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: '  Hello, AI!  ',
      });

      // Assert
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello, AI!',
      });
    });

    it('should include previous messages as context', async () => {
      // Arrange
      const previousMessages: MessageDTO[] = [
        {
          id: 'msg-000',
          conversationId: 'conv-123',
          role: 'user',
          content: 'Previous question',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue(previousMessages);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('Response with context');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: 'New question',
      });

      // Assert
      expect(mockOllamaGateway.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Previous question' },
            { role: 'user', content: 'New question' },
          ],
        })
      );
    });

    it('should pass custom model and parameters to AI service', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('Response');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: 'Hello',
        model: 'custom-model:latest',
        temperature: 0.9,
        maxTokens: 1000,
      });

      // Assert
      expect(mockOllamaGateway.generate).toHaveBeenCalledWith({
        model: 'custom-model:latest',
        messages: expect.any(Array),
        temperature: 0.9,
        maxTokens: 1000,
      });
    });
  });

  describe('Error scenarios', () => {
    it('should throw EmptyMessageError for empty content', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          content: '',
        })
      ).rejects.toThrow(EmptyMessageError);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          content: '   ',
        })
      ).rejects.toThrow(EmptyMessageError);
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-999',
          userId: 'user-456',
          content: 'Hello',
        })
      ).rejects.toThrow(ConversationNotFoundError);

      expect(mockConversationRepo.getById).toHaveBeenCalledWith('conv-999');
      expect(mockMessageRepo.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedConversationAccessError when user does not own conversation', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'wrong-user',
          content: 'Hello',
        })
      ).rejects.toThrow(UnauthorizedConversationAccessError);

      expect(mockMessageRepo.create).not.toHaveBeenCalled();
    });

    it('should throw AIServiceError when AI service fails', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create).mockResolvedValue(mockUserMessage);
      vi.mocked(mockOllamaGateway.generate).mockRejectedValue(
        new Error('Connection timeout')
      );

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          content: 'Hello',
        })
      ).rejects.toThrow(AIServiceError);

      // User message should still be created
      expect(mockMessageRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw AIServiceError when AI returns empty response', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create).mockResolvedValue(mockUserMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('');

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          content: 'Hello',
        })
      ).rejects.toThrow(AIServiceError);
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-456',
          content: 'Hello',
        })
      ).rejects.toThrow('AI service returned empty response');
    });
  });

  describe('Edge cases', () => {
    it('should handle conversation with no previous messages', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('First response');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: 'First message',
      });

      // Assert
      expect(result.userMessage).toBeDefined();
      expect(result.assistantMessage).toBeDefined();
      expect(mockOllamaGateway.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'First message' }],
        })
      );
    });

    it('should use default model when not specified', async () => {
      // Arrange
      vi.mocked(mockConversationRepo.getById).mockResolvedValue(mockConversation);
      vi.mocked(mockMessageRepo.getByConversationId).mockResolvedValue([]);
      vi.mocked(mockMessageRepo.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockOllamaGateway.generate).mockResolvedValue('Response');
      vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

      // Act
      await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-456',
        content: 'Hello',
      });

      // Assert
      expect(mockOllamaGateway.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'darkplanet-general:latest',
        })
      );
    });
  });
});
