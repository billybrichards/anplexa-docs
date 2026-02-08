/**
 * useGuestChat Hook
 *
 * Manages guest mode chat logic including:
 * - Guest message state management
 * - localStorage access for guest messages
 * - Guest message persistence
 * - Upgrade modal triggers for guests
 * - Guest conversation handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '@anplexa/core/domain/entities';
import {
  conversationToStored,
  storedToConversation,
  messagesToStored,
  storedToMessages,
  type StoredMessage,
  type StoredConversation,
} from '../lib/adapters/domain-adapters';

export interface UseGuestChatOptions {
  userId?: string;
  onUpgradePrompt?: () => void;
  onPersistError?: (error: Error) => void;
}

export interface UseGuestChatReturn {
  guestMessages: Message[];
  addGuestMessage: (message: Message) => void;
  loadGuestMessages: () => Promise<void>;
  clearGuestMessages: () => void;
  isGuest: boolean;
  shouldPromptUpgrade: boolean;
  guestMessageCount: number;
  guestConversation: Conversation | null;
  saveGuestConversation: (conversation: Conversation) => void;
  error: Error | null;
  clearError: () => void;
}

/**
 * Storage keys for guest data
 */
const GUEST_MESSAGES_KEY = 'anplexa_guest_messages';
const GUEST_CONVERSATION_KEY = 'anplexa_guest_conversation';
const GUEST_MESSAGE_COUNT_KEY = 'anplexa_guest_message_count';

/**
 * Maximum messages allowed for guest users before prompt to upgrade
 */
const GUEST_MESSAGE_LIMIT = 6;

/**
 * Hook for managing guest chat functionality
 *
 * Provides:
 * - Storage and retrieval of guest messages from localStorage
 * - Tracking of guest message count for upgrade prompts
 * - Guest conversation management
 * - Upgrade prompt triggers
 *
 * @param options - Configuration options
 * @returns Guest chat management interface
 *
 * @example
 * ```tsx
 * const {
 *   guestMessages,
 *   addGuestMessage,
 *   shouldPromptUpgrade,
 *   guestMessageCount,
 * } = useGuestChat({ userId: user?.id, onUpgradePrompt: showUpgradeModal });
 *
 * // Add a guest message
 * if (!user && guestMessageCount < GUEST_MESSAGE_LIMIT) {
 *   addGuestMessage(newMessage);
 * }
 *
 * // Check if we should show upgrade prompt
 * if (shouldPromptUpgrade) {
 *   // Show upgrade modal
 * }
 * ```
 */
export function useGuestChat(options: UseGuestChatOptions): UseGuestChatReturn {
  const { userId, onUpgradePrompt, onPersistError } = options;

  // State management
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [guestConversation, setGuestConversation] = useState<Conversation | null>(null);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Helper to handle storage errors consistently
   */
  const handleStorageError = useCallback((err: unknown, operation: string): void => {
    const storageError = err instanceof Error ? err : new Error(`Failed to ${operation}`);
    console.error(`Failed to ${operation}:`, storageError);
    setError(storageError);
    onPersistError?.(storageError);
  }, [onPersistError]);

  // Track whether upgrade prompt has been shown to avoid multiple triggers
  const upgradePromptShownRef = useRef(false);

  /**
   * Check if current user is a guest
   * A guest is someone without a userId
   */
  const isGuest = !userId;

  /**
   * Determine if we should prompt for upgrade
   * True when guest has reached message limit
   */
  const shouldPromptUpgrade = isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT;

  /**
   * Storage helper - Safe localStorage access with try/catch
   */
  const safeGetItem = useCallback((key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (err) {
      handleStorageError(err, `get item from localStorage (${key})`);
    }
    return null;
  }, [handleStorageError]);

  const safeSetItem = useCallback((key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (err) {
      handleStorageError(err, `set item in localStorage (${key})`);
    }
  }, [handleStorageError]);

  const safeRemoveItem = useCallback((key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (err) {
      handleStorageError(err, `remove item from localStorage (${key})`);
    }
  }, [handleStorageError]);

  /**
   * Load guest messages from localStorage
   */
  const loadGuestMessages = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Load messages
      const storedMessages = safeGetItem(GUEST_MESSAGES_KEY);
      if (storedMessages) {
        try {
          const parsed: StoredMessage[] = JSON.parse(storedMessages);
          const messages = Array.isArray(parsed) ? storedToMessages(parsed) : [];
          setGuestMessages(messages);
        } catch (error) {
          console.error('Failed to parse guest messages:', error);
          setGuestMessages([]);
        }
      }

      // Load conversation
      const storedConversation = safeGetItem(GUEST_CONVERSATION_KEY);
      if (storedConversation) {
        try {
          const parsed: StoredConversation = JSON.parse(storedConversation);
          const conversation = storedToConversation(parsed);
          setGuestConversation(conversation);
        } catch (error) {
          console.error('Failed to parse guest conversation:', error);
          setGuestConversation(null);
        }
      }

      // Load message count
      const storedCount = safeGetItem(GUEST_MESSAGE_COUNT_KEY);
      const count = storedCount ? parseInt(storedCount, 10) : 0;
      setGuestMessageCount(isNaN(count) ? 0 : count);
    } catch (error) {
      console.error('Failed to load guest messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [safeGetItem]);

  /**
   * Add a new guest message and persist to storage
   */
  const addGuestMessage = useCallback(
    (message: Message): void => {
      if (!isGuest) {
        console.warn('addGuestMessage called for authenticated user');
        return;
      }

      try {
        // Update messages state
        setGuestMessages((prev) => {
          const updated = [...prev, message];

          // Persist to localStorage
          try {
            safeSetItem(GUEST_MESSAGES_KEY, JSON.stringify(messagesToStored(updated)));
          } catch (error) {
            console.error('Failed to persist guest messages:', error);
          }

          return updated;
        });

        // Increment and persist count
        setGuestMessageCount((prev) => {
          const newCount = prev + 1;
          safeSetItem(GUEST_MESSAGE_COUNT_KEY, String(newCount));
          return newCount;
        });
      } catch (error) {
        console.error('Failed to add guest message:', error);
      }
    },
    [isGuest, safeSetItem]
  );

  /**
   * Save guest conversation to storage
   */
  const saveGuestConversation = useCallback(
    (conversation: Conversation): void => {
      if (!isGuest) {
        console.warn('saveGuestConversation called for authenticated user');
        return;
      }

      try {
        setGuestConversation(conversation);
        safeSetItem(GUEST_CONVERSATION_KEY, JSON.stringify(conversationToStored(conversation)));
      } catch (error) {
        console.error('Failed to save guest conversation:', error);
      }
    },
    [isGuest, safeSetItem]
  );

  /**
   * Clear all guest data from storage and state
   */
  const clearGuestMessages = useCallback((): void => {
    try {
      setGuestMessages([]);
      setGuestConversation(null);
      setGuestMessageCount(0);
      upgradePromptShownRef.current = false;

      // Clear from storage
      safeRemoveItem(GUEST_MESSAGES_KEY);
      safeRemoveItem(GUEST_CONVERSATION_KEY);
      safeRemoveItem(GUEST_MESSAGE_COUNT_KEY);
    } catch (error) {
      console.error('Failed to clear guest messages:', error);
    }
  }, [safeRemoveItem]);

  /**
   * Trigger upgrade prompt callback when threshold is reached
   * Only triggers once per session to avoid spam
   */
  useEffect(() => {
    if (shouldPromptUpgrade && !upgradePromptShownRef.current && onUpgradePrompt) {
      upgradePromptShownRef.current = true;
      onUpgradePrompt();
    }
  }, [shouldPromptUpgrade, onUpgradePrompt]);

  /**
   * Clear guest data when user logs in
   */
  useEffect(() => {
    if (!isGuest && guestMessages.length > 0) {
      clearGuestMessages();
    }
  }, [isGuest, guestMessages.length, clearGuestMessages]);

  // Load guest messages on mount
  useEffect(() => {
    if (isGuest) {
      loadGuestMessages();
    } else {
      setIsLoading(false);
    }
  }, [isGuest, loadGuestMessages]);

  return {
    guestMessages,
    addGuestMessage,
    loadGuestMessages,
    clearGuestMessages,
    isGuest,
    shouldPromptUpgrade,
    guestMessageCount,
    guestConversation,
    saveGuestConversation,
    error,
    clearError,
  };
}
