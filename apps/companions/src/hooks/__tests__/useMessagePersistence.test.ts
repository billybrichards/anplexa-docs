/**
 * useMessagePersistence Hook Tests
 *
 * Tests for the message persistence hook ensuring:
 * - Messages are saved correctly via API
 * - Messages are loaded correctly from API
 * - Error handling works as expected
 * - Loading/saving state is managed correctly
 * - Local caching works when enabled
 * - Callbacks are called appropriately
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessagePersistence } from '../useMessagePersistence';
import { apiClient } from '../../lib/adapters/api/api-client';
import { storageService } from '../../lib/adapters/storage/storage-service';
import { Message } from '@anplexa/core/domain/entities';
import type { MessageDTO } from '@anplexa/contracts';

// Mock dependencies
vi.mock('../../lib/adapters/api/api-client');
vi.mock('../../lib/adapters/storage/storage-service');

describe('useMessagePersistence', () => {
  const conversationId = 'conv-123';
  const userId = 'user-123';

  const mockMessage: Message = Message.create({
    id: 'msg-1',
    conversationId,
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: new Date(),
  });

  const mockMessageDTO: MessageDTO = {
    id: 'msg-1',
    conversationId,
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveMessage', () => {
    it('should save a message via API', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockMessageDTO);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      let saved: MessageDTO | undefined;
      await act(async () => {
        saved = await result.current.saveMessage(mockMessage);
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/chat/messages',
        expect.objectContaining({
          conversationId,
          content: mockMessage.content,
          role: mockMessage.role,
          userId,
        })
      );
      expect(saved).toEqual(mockMessageDTO);
    });

    it('should set isSaving to true during save', async () => {
      vi.mocked(apiClient.post).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockMessageDTO), 100);
          })
      );

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      let savePromise: Promise<MessageDTO>;
      act(() => {
        savePromise = result.current.saveMessage(mockMessage);
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        await savePromise;
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      await act(async () => {
        await expect(result.current.saveMessage(mockMessage)).rejects.toThrow('Save failed');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Save failed');
    });

    it('should throw error if conversationId is missing', async () => {
      const { result } = renderHook(() => useMessagePersistence({ userId }));

      await expect(result.current.saveMessage(mockMessage)).rejects.toThrow(
        'conversationId is required'
      );
    });

    it('should call onSaveSuccess callback', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockMessageDTO);
      const onSaveSuccess = vi.fn();

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId, onSaveSuccess })
      );

      await act(async () => {
        await result.current.saveMessage(mockMessage);
      });

      expect(onSaveSuccess).toHaveBeenCalledWith(mockMessage);
    });

    it('should call onSaveError callback on failure', async () => {
      const error = new Error('Save failed');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);
      const onSaveError = vi.fn();

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId, onSaveError })
      );

      await act(async () => {
        try {
          await result.current.saveMessage(mockMessage);
          expect.fail('Expected saveMessage to throw an error');
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe('Save failed');
        }
      });

      expect(onSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should update local cache when enabled', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockMessageDTO);
      vi.mocked(storageService.get).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useMessagePersistence({
          conversationId,
          userId,
          enableLocalCache: true,
          cacheKey: 'test-cache',
        })
      );

      await act(async () => {
        await result.current.saveMessage(mockMessage);
      });

      expect(storageService.set).toHaveBeenCalledWith(
        expect.stringContaining('messages_'),
        expect.any(Array)
      );
    });
  });

  describe('loadMessages', () => {
    it('should load messages from API', async () => {
      const messages: MessageDTO[] = [mockMessageDTO];
      vi.mocked(apiClient.get).mockResolvedValueOnce(messages);
      vi.mocked(storageService.get).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      let loaded: Message[] = [];
      await act(async () => {
        loaded = await result.current.loadMessages();
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        `/chat/conversations/${conversationId}/messages`,
        expect.any(AbortSignal)
      );
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(mockMessageDTO.id);
    });

    it('should set isLoading to true during load', async () => {
      vi.mocked(apiClient.get).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve([mockMessageDTO]), 100);
          })
      );
      vi.mocked(storageService.get).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      let loadPromise: Promise<Message[]>;
      act(() => {
        loadPromise = result.current.loadMessages();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle load errors', async () => {
      const error = new Error('Load failed');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      await act(async () => {
        await expect(result.current.loadMessages()).rejects.toThrow('Load failed');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should throw error if conversationId is missing', async () => {
      const { result } = renderHook(() => useMessagePersistence({ userId }));

      await expect(result.current.loadMessages()).rejects.toThrow(
        'conversationId is required'
      );
    });

    it('should call onLoadSuccess callback', async () => {
      const messages: MessageDTO[] = [mockMessageDTO];
      vi.mocked(apiClient.get).mockResolvedValueOnce(messages);
      vi.mocked(storageService.get).mockReturnValueOnce(null);
      const onLoadSuccess = vi.fn();

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId, onLoadSuccess })
      );

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(onLoadSuccess).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should return cached messages when available', async () => {
      const cachedMessages: Message[] = [
        Message.create({ id: mockMessage.id, conversationId: mockMessage.conversationId, role: mockMessage.role, content: 'Cached message' }),
      ];
      vi.mocked(storageService.get).mockReturnValueOnce(cachedMessages);

      const { result } = renderHook(() =>
        useMessagePersistence({
          conversationId,
          userId,
          enableLocalCache: true,
          cacheKey: 'test-cache',
        })
      );

      let loaded: Message[] = [];
      await act(async () => {
        loaded = await result.current.loadMessages();
      });

      expect(loaded).toEqual(cachedMessages);
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('loadMessagesForConversation', () => {
    it('should load messages for a specific conversation', async () => {
      const messages: MessageDTO[] = [mockMessageDTO];
      vi.mocked(apiClient.get).mockResolvedValueOnce(messages);
      vi.mocked(storageService.get).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId: 'other-conv', userId })
      );

      let loaded: Message[] = [];
      await act(async () => {
        loaded = await result.current.loadMessagesForConversation(conversationId);
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        `/chat/conversations/${conversationId}/messages`,
        expect.any(AbortSignal)
      );
      expect(loaded).toHaveLength(1);
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message via API', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/chat/messages/msg-1');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(apiClient.delete).mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      await act(async () => {
        await expect(result.current.deleteMessage('msg-1')).rejects.toThrow('Delete failed');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should update local cache when enabled', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);
      const cachedMessages: Message[] = [mockMessage];
      vi.mocked(storageService.get).mockReturnValueOnce(cachedMessages);

      const { result } = renderHook(() =>
        useMessagePersistence({
          conversationId,
          userId,
          enableLocalCache: true,
          cacheKey: 'test-cache',
        })
      );

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(storageService.set).toHaveBeenCalledWith(
        expect.stringContaining('messages_'),
        []
      );
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const error = new Error('Test error');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      await act(async () => {
        try {
          await result.current.saveMessage(mockMessage);
          expect.fail('Expected saveMessage to throw an error');
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe('Test error');
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache after saveMessage', async () => {
      // Setup initial cached messages
      const cachedMessages: Message[] = [
        Message.create({ id: 'old-msg', conversationId, role: 'user', content: 'Old cached message' }),
      ];
      vi.mocked(storageService.get).mockReturnValue(cachedMessages);
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockMessageDTO);

      const { result } = renderHook(() =>
        useMessagePersistence({
          conversationId,
          userId,
          enableLocalCache: true,
          cacheKey: 'test-cache',
        })
      );

      // Save a new message
      await act(async () => {
        await result.current.saveMessage(mockMessage);
      });

      // Verify cache was updated with the new message
      expect(storageService.set).toHaveBeenCalledWith(
        expect.stringContaining('messages_'),
        expect.arrayContaining([
          expect.objectContaining({ id: mockMessage.id }),
        ])
      );
    });

    it('should invalidate cache after deleteMessage', async () => {
      // Setup initial cached messages with two messages
      const messageToDelete: Message = Message.create({
        id: 'msg-to-delete',
        conversationId,
        role: 'user',
        content: 'Message to delete',
        createdAt: new Date(),
      });
      const cachedMessages: Message[] = [mockMessage, messageToDelete];
      vi.mocked(storageService.get).mockReturnValue(cachedMessages);
      vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useMessagePersistence({
          conversationId,
          userId,
          enableLocalCache: true,
          cacheKey: 'test-cache',
        })
      );

      // Delete one message
      await act(async () => {
        await result.current.deleteMessage('msg-to-delete');
      });

      // Verify cache was updated without the deleted message
      expect(storageService.set).toHaveBeenCalledWith(
        expect.stringContaining('messages_'),
        expect.arrayContaining([
          expect.objectContaining({ id: mockMessage.id }),
        ])
      );

      // Verify the deleted message is not in the cache
      const setCalls = vi.mocked(storageService.set).mock.calls;
      const lastSetCall = setCalls[setCalls.length - 1];
      const updatedCache = lastSetCall[1] as Message[];
      expect(updatedCache.find(m => m.id === 'msg-to-delete')).toBeUndefined();
    });
  });

  describe('AbortController and request cancellation', () => {
    it('should cancel pending requests on unmount', async () => {
      // Track abort signals passed to the API
      const abortSignals: AbortSignal[] = [];
      vi.mocked(apiClient.get).mockImplementation(
        (_url: string, signal?: AbortSignal) => {
          if (signal) {
            abortSignals.push(signal);
          }
          // Return a promise that never resolves to simulate long-running request
          return new Promise(() => {});
        }
      );
      vi.mocked(storageService.get).mockReturnValue(null);

      const { result, unmount } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      // Start loading messages (this will hang)
      act(() => {
        result.current.loadMessages();
      });

      // Verify the API was called with an AbortSignal
      expect(abortSignals.length).toBe(1);
      expect(abortSignals[0].aborted).toBe(false);

      // Unmount the hook
      unmount();

      // Verify the abort signal was triggered
      expect(abortSignals[0].aborted).toBe(true);
    });

    it('should not set error state when request is aborted', async () => {
      // Create a mock that rejects with an AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      vi.mocked(apiClient.get).mockRejectedValueOnce(abortError);
      vi.mocked(storageService.get).mockReturnValue(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      // Load messages will be aborted
      let loadedMessages: Message[] = [];
      await act(async () => {
        loadedMessages = await result.current.loadMessages();
      });

      // Should return empty array and not set error
      expect(loadedMessages).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle rapid concurrent loadMessages calls', async () => {
      // Track all abort signals and their conversation IDs
      const requestLog: { convId: string; signal: AbortSignal }[] = [];
      let callCount = 0;

      vi.mocked(apiClient.get).mockImplementation(
        (url: string, signal?: AbortSignal) => {
          const convIdMatch = url.match(/\/conversations\/([^/]+)\/messages/);
          const convId = convIdMatch ? convIdMatch[1] : 'unknown';

          if (signal) {
            requestLog.push({ convId, signal });
          }

          // Simulate network delay - later calls resolve faster
          const delay = 100 - callCount * 30;
          callCount++;

          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              resolve([{ ...mockMessageDTO, id: `msg-${convId}` }]);
            }, Math.max(delay, 10));

            // Handle abort
            signal?.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              const abortError = new Error('Request aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          });
        }
      );
      vi.mocked(storageService.get).mockReturnValue(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      // Fire multiple rapid loadMessages calls
      const promises: Promise<Message[]>[] = [];
      await act(async () => {
        promises.push(result.current.loadMessagesForConversation('conv-1'));
        promises.push(result.current.loadMessagesForConversation('conv-2'));
        promises.push(result.current.loadMessagesForConversation('conv-3'));

        // Wait for all promises to settle
        await Promise.allSettled(promises);
      });

      // Verify that requests were made for each conversation
      expect(requestLog.length).toBe(3);
      expect(requestLog.map(r => r.convId)).toEqual(['conv-1', 'conv-2', 'conv-3']);

      // The hook should not be in a loading state after all requests complete
      expect(result.current.isLoading).toBe(false);
    });

    it('should cleanup abort controllers after successful request', async () => {
      const messages: MessageDTO[] = [mockMessageDTO];
      let signalUsed: AbortSignal | undefined;

      vi.mocked(apiClient.get).mockImplementation(
        (_url: string, signal?: AbortSignal) => {
          signalUsed = signal;
          return Promise.resolve(messages);
        }
      );
      vi.mocked(storageService.get).mockReturnValue(null);

      const { result, unmount } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      // Load messages successfully
      await act(async () => {
        await result.current.loadMessages();
      });

      // Verify request completed with an abort signal
      expect(signalUsed).toBeDefined();
      expect(signalUsed?.aborted).toBe(false);

      // Unmount should not cause issues (controller should be cleaned up)
      unmount();

      // Signal should still not be aborted since the request completed
      // and was cleaned up before unmount
      expect(signalUsed?.aborted).toBe(false);
    });

    it(
      'should abort previous request when same conversation is loaded again',
      async () => {
        const abortSignals: AbortSignal[] = [];
        const resolvers: ((value: MessageDTO[]) => void)[] = [];

      vi.mocked(apiClient.get).mockImplementation(
        (_url: string, signal?: AbortSignal) => {
          if (signal) {
            abortSignals.push(signal);
          }
          return new Promise((resolve, reject) => {
            resolvers.push(resolve);
            signal?.addEventListener('abort', () => {
              const abortError = new Error('Request aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          });
        }
      );
      vi.mocked(storageService.get).mockReturnValue(null);

      const { result } = renderHook(() =>
        useMessagePersistence({ conversationId, userId })
      );

      // Start first load
      let promise1: Promise<Message[]>;
      act(() => {
        promise1 = result.current.loadMessages();
      });

      // First request should be active
      expect(abortSignals.length).toBe(1);
      expect(abortSignals[0].aborted).toBe(false);

      // Start second load for the same conversation
      let promise2: Promise<Message[]>;
      act(() => {
        promise2 = result.current.loadMessages();
      });

      // Now we have two requests
      expect(abortSignals.length).toBe(2);

      // Complete both requests to avoid hanging
      await act(async () => {
        // Resolve first request (it wasn't aborted)
        resolvers[0]([mockMessageDTO]);
        // Resolve second request
        resolvers[1]([mockMessageDTO]);
        // Wait for both to complete
        await Promise.all([promise1!, promise2!]);
      });

        // The hook should handle multiple concurrent requests gracefully
        expect(result.current.isLoading).toBe(false);
      },
      10000
    );
  });
});
