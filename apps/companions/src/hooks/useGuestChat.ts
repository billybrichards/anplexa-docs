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

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseGuestChatOptions {
  userId?: string;
  onUpgradePrompt?: () => void;
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
  const { userId, onUpgradePrompt } = options;

  // State management
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [guestConversation, setGuestConversation] = useState<Conversation | null>(null);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error(`Failed to get item from localStorage (${key}):`, error);
    }
    return null;
  }, []);

  const safeSetItem = useCallback((key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to set item in localStorage (${key}):`, error);
    }
  }, []);

  const safeRemoveItem = useCallback((key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to remove item from localStorage (${key}):`, error);
    }
  }, []);

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
          const parsed = JSON.parse(storedMessages);
          const messages = Array.isArray(parsed)
            ? parsed.map((msg: any) => ({
                ...msg,
                createdAt: new Date(msg.createdAt),
              }))
            : [];
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
          const parsed = JSON.parse(storedConversation);
          const conversation = {
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
          };
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
            safeSetItem(GUEST_MESSAGES_KEY, JSON.stringify(updated));
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
        safeSetItem(GUEST_CONVERSATION_KEY, JSON.stringify(conversation));
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
  };
}
