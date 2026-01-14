/**
 * CreateConversationUseCase Tests
 *
 * Tests the conversation creation business logic including:
 * - User existence validation
 * - Title validation
 * - Conversation creation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateConversationUseCase,
  UserNotFoundError,
  InvalidTitleError,
} from '../../chat/CreateConversationUseCase';
import type { IConversationRepository } from '../../../repositories/interfaces/conversation.repository.interface';
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface';
import type { User } from '@anplexa/database';
import type { ConversationDTO } from '@anplexa/contracts';

describe('CreateConversationUseCase', () => {
  let useCase: CreateConversationUseCase;
  let mockConversationRepository: IConversationRepository;
  let mockUserRepository: IUserRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    chatName: null,
    personalityMode: null,
    storagePreference: null,
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    credits: 100,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    accountSource: 'direct',
    sourceChannel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockConversation: ConversationDTO = {
    id: 'conv-123',
    userId: 'user-123',
    title: 'Test Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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

    mockUserRepository = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      getByStripeCustomerId: vi.fn(),
      getByStripeSubscriptionId: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateConversationUseCase(
      mockConversationRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should create conversation with valid title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue(mockConversation);

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        title: 'Test Conversation',
      });

      // Verify
      expect(result.conversation).toEqual(mockConversation);
      expect(mockUserRepository.getById).toHaveBeenCalledWith('user-123');
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          title: 'Test Conversation',
        })
      );
    });

    it('should create conversation without title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: null,
      });

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
      });

      // Verify
      expect(result.conversation).toBeDefined();
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          title: undefined,
        })
      );
    });

    it('should create conversation with null title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: null,
      });

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        title: null,
      });

      // Verify
      expect(result.conversation).toBeDefined();
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          title: null,
        })
      );
    });

    it('should trim whitespace from title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue(mockConversation);

      // Execute
      await useCase.execute({
        userId: 'user-123',
        title: '  Test Conversation  ',
      });

      // Verify
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Conversation',
        })
      );
    });

    it('should convert empty string title to null', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: null,
      });

      // Execute
      await useCase.execute({
        userId: 'user-123',
        title: '   ',
      });

      // Verify
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: null,
        })
      );
    });

    it('should generate unique conversation ID', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue(mockConversation);

      // Execute
      await useCase.execute({
        userId: 'user-123',
        title: 'Test',
      });

      // Verify that create was called with an id
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        })
      );
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      // Execute & Verify
      await expect(
        useCase.execute({
          userId: 'non-existent-user',
          title: 'Test',
        })
      ).rejects.toThrow(UserNotFoundError);

      await expect(
        useCase.execute({
          userId: 'non-existent-user',
          title: 'Test',
        })
      ).rejects.toThrow('User not found: non-existent-user');
    });

    it('should throw InvalidTitleError for title exceeding max length', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);

      // Create a title longer than 500 characters
      const longTitle = 'a'.repeat(501);

      // Execute & Verify
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
    });

    it('should accept title at exactly 500 characters', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue(mockConversation);

      // Create a title of exactly 500 characters
      const maxTitle = 'a'.repeat(500);

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        title: maxTitle,
      });

      // Verify
      expect(result.conversation).toBeDefined();
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: maxTitle,
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Execute & Verify
      await expect(
        useCase.execute({
          userId: 'user-123',
          title: 'Test',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle conversation creation errors', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockRejectedValue(
        new Error('Failed to create conversation')
      );

      // Execute & Verify
      await expect(
        useCase.execute({
          userId: 'user-123',
          title: 'Test',
        })
      ).rejects.toThrow('Failed to create conversation');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: 'Test 🚀 Conversation!',
      });

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        title: 'Test 🚀 Conversation!',
      });

      // Verify
      expect(result.conversation).toBeDefined();
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test 🚀 Conversation!',
        })
      );
    });

    it('should handle unicode characters in title', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: '你好世界',
      });

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        title: '你好世界',
      });

      // Verify
      expect(result.conversation).toBeDefined();
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '你好世界',
        })
      );
    });

    it('should handle title with only whitespace', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockConversationRepository.create).mockResolvedValue({
        ...mockConversation,
        title: null,
      });

      // Execute
      await useCase.execute({
        userId: 'user-123',
        title: '\t\n  \r',
      });

      // Verify - should convert to null
      expect(mockConversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: null,
        })
      );
    });
  });
});
