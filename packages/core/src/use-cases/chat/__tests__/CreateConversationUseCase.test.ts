/**
 * CreateConversationUseCase Tests
 *
 * Integration tests for the CreateConversationUseCase.
 * Tests all success and error scenarios with mocked repositories.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateConversationUseCase,
  UserNotFoundError,
  InvalidTitleError,
} from '../CreateConversationUseCase';
import type { IConversationRepository } from '../../../repositories/interfaces/conversation.repository.interface';
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface';
import type { ConversationDTO } from '@anplexa/contracts';
import type { User } from '@anplexa/database';

describe('CreateConversationUseCase', () => {
  let useCase: CreateConversationUseCase;
  let mockConversationRepo: IConversationRepository;
  let mockUserRepo: IUserRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hash',
    displayName: 'Test User',
    chatName: 'Test',
    personalityMode: 'nurturing',
    preferredGender: 'female',
    customGender: null,
    storagePreference: 'cloud',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    manualSubscriptionOverride: false,
    credits: 5,
    lastCreditRefresh: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    accountSource: 'anplexa',
    funnelType: 'direct',
    persona: null,
    stage: 'new',
    entrySource: null,
    usedFreeMessages: 0,
    emailOpened1: false,
    emailOpened2: false,
    emailOpened3: false,
    clickedUseApp: false,
    feedbackSubmitted: false,
    refundRequested: false,
    refundProcessed: false,
    lastActivityAt: null,
    amplexaFunnel: null,
    amplexaFunnelName: null,
    amplexaResponses: null,
    amplexaPrimaryNeed: null,
    amplexaCommunicationStyle: null,
    amplexaPace: null,
    amplexaTags: null,
    amplexaTimestamp: null,
    sourceChannel: null,
  };

  const mockConversation: ConversationDTO = {
    id: 'conv-456',
    userId: 'user-123',
    title: 'Test Conversation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
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

    mockUserRepo = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateConversationUseCase(mockConversationRepo, mockUserRepo);
  });

  describe('Success scenarios', () => {
    it('should successfully create a conversation with title', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        title: 'Test Conversation',
      });

      // Assert
      expect(result.conversation).toEqual(mockConversation);
      expect(mockUserRepo.getById).toHaveBeenCalledWith('user-123');
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Conversation',
      });
    });

    it('should successfully create a conversation without title', async () => {
      // Arrange
      const conversationWithoutTitle: ConversationDTO = {
        ...mockConversation,
        title: null,
      };
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithoutTitle);

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
      });

      // Assert
      expect(result.conversation).toEqual(conversationWithoutTitle);
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: undefined,
      });
    });

    it('should trim whitespace from title', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);

      // Act
      await useCase.execute({
        userId: 'user-123',
        title: '  Test Conversation  ',
      });

      // Assert
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Conversation',
      });
    });

    it('should convert empty string title to null', async () => {
      // Arrange
      const conversationWithoutTitle: ConversationDTO = {
        ...mockConversation,
        title: null,
      };
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithoutTitle);

      // Act
      await useCase.execute({
        userId: 'user-123',
        title: '   ',
      });

      // Assert
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: null,
      });
    });

    it('should handle null title explicitly', async () => {
      // Arrange
      const conversationWithoutTitle: ConversationDTO = {
        ...mockConversation,
        title: null,
      };
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithoutTitle);

      // Act
      await useCase.execute({
        userId: 'user-123',
        title: null,
      });

      // Assert
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: null,
      });
    });
  });

  describe('Error scenarios', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          userId: 'non-existent-user',
          title: 'Test',
        })
      ).rejects.toThrow(UserNotFoundError);

      expect(mockUserRepo.getById).toHaveBeenCalledWith('non-existent-user');
      expect(mockConversationRepo.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidTitleError when title is too long', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      const longTitle = 'x'.repeat(501); // Exceeds MAX_TITLE_LENGTH of 500

      // Act & Assert
      await expect(
        useCase.execute({
          userId: 'user-123',
          title: longTitle,
        })
      ).rejects.toThrow(InvalidTitleError);
      await expect(
        useCase.execute({
          userId: 'user-123',
          title: longTitle,
        })
      ).rejects.toThrow('Title exceeds maximum length of 500 characters');

      expect(mockConversationRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle title at maximum length', async () => {
      // Arrange
      const maxTitle = 'x'.repeat(500); // Exactly at MAX_TITLE_LENGTH
      const conversationWithMaxTitle: ConversationDTO = {
        ...mockConversation,
        title: maxTitle,
      };
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithMaxTitle);

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        title: maxTitle,
      });

      // Assert
      expect(result.conversation).toEqual(conversationWithMaxTitle);
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: maxTitle,
      });
    });

    it('should handle special characters in title', async () => {
      // Arrange
      const specialTitle = 'Test 🎉 Conversation with émoji & symbols!';
      const conversationWithSpecialTitle: ConversationDTO = {
        ...mockConversation,
        title: specialTitle,
      };
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithSpecialTitle);

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        title: specialTitle,
      });

      // Assert
      expect(result.conversation.title).toBe(specialTitle);
    });

    it('should handle concurrent conversation creation for same user', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      const conversation1: ConversationDTO = { ...mockConversation, id: 'conv-1' };
      const conversation2: ConversationDTO = { ...mockConversation, id: 'conv-2' };

      vi.mocked(mockConversationRepo.create)
        .mockResolvedValueOnce(conversation1)
        .mockResolvedValueOnce(conversation2);

      // Act
      const [result1, result2] = await Promise.all([
        useCase.execute({ userId: 'user-123', title: 'Conversation 1' }),
        useCase.execute({ userId: 'user-123', title: 'Conversation 2' }),
      ]);

      // Assert
      expect(result1.conversation.id).toBe('conv-1');
      expect(result2.conversation.id).toBe('conv-2');
      expect(mockConversationRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should preserve title with leading/trailing spaces after trimming', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getById).mockResolvedValue(mockUser);
      const conversationWithTitle: ConversationDTO = {
        ...mockConversation,
        title: 'Title with internal  spaces',
      };
      vi.mocked(mockConversationRepo.create).mockResolvedValue(conversationWithTitle);

      // Act
      await useCase.execute({
        userId: 'user-123',
        title: '  Title with internal  spaces  ',
      });

      // Assert
      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Title with internal  spaces',
      });
    });
  });
});
