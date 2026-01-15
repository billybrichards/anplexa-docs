/**
 * useMessagePersistence Hook
 *
 * Custom React hook for managing message persistence operations.
 * Handles saving and loading messages using the API client adapter.
 *
 * Features:
 * - Message persistence via API
 * - Loading and saving state indicators
 * - Error handling and reporting
 * - Optional local caching
 * - Optimistic updates support
 *
 * Usage:
 * ```typescript
 * const {
 *   saveMessage,
 *   loadMessages,
 *   isSaving,
 *   isLoading,
 *   error,
 * } = useMessagePersistence({ conversationId: 'abc-123' });
 *
 * // Save a message
 * await saveMessage(message);
 *
 * // Load all messages for conversation
 * const messages = await loadMessages();
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../lib/adapters/api/api-client';
import { storageService } from '../lib/adapters/storage/storage-service';
import type { Message } from '../lib/domain/entities/Message';
import type { MessageDTO } from '@anplexa/contracts';

/**
 * Options for the useMessagePersistence hook
 */
export interface UseMessagePersistenceOptions {
  conversationId?: string;
  userId?: string;
  enableLocalCache?: boolean;
  cacheKey?: string;
  onSaveSuccess?: (message: Message) => void;
  onSaveError?: (error: Error) => void;
  onLoadSuccess?: (messages: Message[]) => void;
  onLoadError?: (error: Error) => void;
}

/**
 * Return type for the useMessagePersistence hook
 */
export interface UseMessagePersistenceReturn {
  saveMessage: (message: Message) => Promise<MessageDTO>;
  loadMessages: () => Promise<Message[]>;
  loadMessagesForConversation: (conversationId: string) => Promise<Message[]>;
  deleteMessage: (messageId: string) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

/**
 * useMessagePersistence Hook
 *
 * Provides an interface for persisting messages to a backend API.
 * All operations go through the apiClient adapter to ensure consistent
 * error handling and testing capabilities.
 */
export function useMessagePersistence(
  options: UseMessagePersistenceOptions
): UseMessagePersistenceReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track abort controllers for request cancellation
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Save a message to the backend
   *
   * @param message - The message to save
   * @returns The saved message DTO from the server
   * @throws Error if save fails
   */
  const saveMessage = useCallback(
    async (message: Message): Promise<MessageDTO> => {
      if (!options.conversationId) {
        throw new Error('conversationId is required to save a message');
      }

      setIsSaving(true);
      setError(null);

      try {
        // Call API to save message
        const response = await apiClient.post<MessageDTO>(
          `/chat/messages`,
          {
            conversationId: options.conversationId,
            content: message.content,
            role: message.role,
            userId: options.userId,
          }
        );

        // Update local cache if enabled
        if (options.enableLocalCache && options.cacheKey) {
          const cacheKey = `messages_${options.cacheKey}`;
          const cached = storageService.get<Message[]>(cacheKey) || [];
          const updated = [
            ...cached.filter(m => m.id !== message.id),
            { ...message, ...response } as Message,
          ];
          storageService.set(cacheKey, updated);
        }

        // Call success callback
        options.onSaveSuccess?.(message);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save message');
        setError(error);
        options.onSaveError?.(error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [options]
  );

  /**
   * Load messages for a specific conversation
   *
   * @param conversationId - The conversation ID to load messages for
   * @returns Array of messages for the conversation
   * @throws Error if load fails
   */
  const loadMessagesForConversation = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      setIsLoading(true);
      setError(null);

      // Create an abort controller for this request
      const abortController = new AbortController();
      const requestKey = `load_${conversationId}`;
      abortControllersRef.current.set(requestKey, abortController);

      try {
        // Check local cache first if enabled
        if (options.enableLocalCache) {
          const cacheKey = `messages_${options.cacheKey || conversationId}`;
          const cached = storageService.get<Message[]>(cacheKey);
          if (cached && cached.length > 0) {
            return cached;
          }
        }

        // Fetch messages from API
        const response = await apiClient.get<MessageDTO[]>(
          `/chat/conversations/${conversationId}/messages`,
          abortController.signal
        );

        // Transform DTOs to Message entities
        const messages: Message[] = response.map((dto: MessageDTO) => ({
          id: dto.id,
          conversationId: dto.conversationId,
          role: dto.role,
          content: dto.content,
          createdAt: dto.createdAt,
        }));

        // Update local cache if enabled
        if (options.enableLocalCache) {
          const cacheKey = `messages_${options.cacheKey || conversationId}`;
          storageService.set(cacheKey, messages);
        }

        // Call success callback
        options.onLoadSuccess?.(messages);

        return messages;
      } catch (err) {
        // Don't set error if request was aborted
        if (err instanceof Error && err.name !== 'AbortError') {
          const error = err instanceof Error ? err : new Error('Failed to load messages');
          setError(error);
          options.onLoadError?.(error);
          throw error;
        }
        return [];
      } finally {
        setIsLoading(false);
        abortControllersRef.current.delete(requestKey);
      }
    },
    [options]
  );

  /**
   * Load messages for the current conversation
   *
   * @returns Array of messages for the conversation
   * @throws Error if load fails
   */
  const loadMessages = useCallback(async (): Promise<Message[]> => {
    if (!options.conversationId) {
      throw new Error('conversationId is required to load messages');
    }

    return loadMessagesForConversation(options.conversationId);
  }, [options.conversationId, loadMessagesForConversation]);

  /**
   * Delete a message
   *
   * @param messageId - The message ID to delete
   * @throws Error if delete fails
   */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      setError(null);

      try {
        await apiClient.delete(`/chat/messages/${messageId}`);

        // Update local cache if enabled
        if (options.enableLocalCache && options.cacheKey && options.conversationId) {
          const cacheKey = `messages_${options.cacheKey}`;
          const cached = storageService.get<Message[]>(cacheKey) || [];
          const updated = cached.filter(m => m.id !== messageId);
          storageService.set(cacheKey, updated);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete message');
        setError(error);
        throw error;
      }
    },
    [options]
  );

  // Cleanup: cancel all pending requests when hook unmounts
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    saveMessage,
    loadMessages,
    loadMessagesForConversation,
    deleteMessage,
    isSaving,
    isLoading,
    error,
    clearError,
  };
}
