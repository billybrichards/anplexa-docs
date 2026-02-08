/**
 * Tests for useGuestChat Hook
 *
 * Tests cover:
 * - Guest message state management
 * - localStorage persistence
 * - Guest message limits and upgrade prompts
 * - Conversation handling
 * - Cleanup on user login
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGuestChat, Message, Conversation } from '../useGuestChat';

/**
 * Mock localStorage implementation for testing
 */
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Store original localStorage and window
const originalLocalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;

/**
 * Helper to create a test message
 */
function createTestMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Hello, assistant!',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to create a test conversation
 */
function createTestConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: 'conv-1',
    userId: 'guest',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('useGuestChat Hook', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Create a fresh localStorage mock for each test
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    // Restore window if it was modified
    if (globalThis.window !== originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('Guest Detection', () => {
    it('should detect guest when userId is not provided', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      await waitFor(() => {
        expect(result.current.isGuest).toBe(true);
      });
    });

    it('should detect authenticated user when userId is provided', async () => {
      const { result } = renderHook(() => useGuestChat({ userId: 'user-123' }));
      await waitFor(() => {
        expect(result.current.isGuest).toBe(false);
      });
    });
  });

  describe('Message Management', () => {
    it('should start with empty guest messages', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      await waitFor(() => {
        expect(result.current.guestMessages).toEqual([]);
      });
    });

    it('should add a guest message when guest', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      const message = createTestMessage();

      act(() => {
        result.current.addGuestMessage(message);
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(1);
        expect(result.current.guestMessages[0]).toEqual(message);
      });
    });

    it('should not add message when user is authenticated', async () => {
      const { result } = renderHook(() => useGuestChat({ userId: 'user-123' }));
      const message = createTestMessage();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.addGuestMessage(message);
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(0);
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'addGuestMessage called for authenticated user'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should persist messages to localStorage', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      const message = createTestMessage();

      act(() => {
        result.current.addGuestMessage(message);
      });

      await waitFor(() => {
        const stored = localStorage.getItem('anplexa_guest_messages');
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe('msg-1');
      });
    });

    it('should add multiple messages in order', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      const message1 = createTestMessage({ id: 'msg-1' });
      const message2 = createTestMessage({ id: 'msg-2' });
      const message3 = createTestMessage({ id: 'msg-3' });

      act(() => {
        result.current.addGuestMessage(message1);
        result.current.addGuestMessage(message2);
        result.current.addGuestMessage(message3);
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(3);
        expect(result.current.guestMessages[0].id).toBe('msg-1');
        expect(result.current.guestMessages[1].id).toBe('msg-2');
        expect(result.current.guestMessages[2].id).toBe('msg-3');
      });
    });
  });

  describe('Message Count & Upgrade Prompts', () => {
    it('should track guest message count', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      await waitFor(() => {
        expect(result.current.guestMessageCount).toBe(0);
      });

      act(() => {
        result.current.addGuestMessage(createTestMessage());
      });

      await waitFor(() => {
        expect(result.current.guestMessageCount).toBe(1);
      });
    });

    it('should increment count for each message', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.addGuestMessage(
            createTestMessage({ id: `msg-${i}` })
          );
        }
      });

      await waitFor(() => {
        expect(result.current.guestMessageCount).toBe(4);
      });
    });

    it('should not prompt upgrade when under limit', async () => {
      const onUpgradePrompt = vi.fn();
      const { result } = renderHook(() =>
        useGuestChat({ onUpgradePrompt })
      );

      await waitFor(() => {
        expect(result.current.shouldPromptUpgrade).toBe(false);
      });
    });

    it('should prompt upgrade when limit is reached', async () => {
      const onUpgradePrompt = vi.fn();
      const { result } = renderHook(() =>
        useGuestChat({ onUpgradePrompt })
      );

      // Add 6 messages (limit)
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.addGuestMessage(
            createTestMessage({ id: `msg-${i}` })
          );
        }
      });

      await waitFor(() => {
        expect(result.current.shouldPromptUpgrade).toBe(true);
        expect(onUpgradePrompt).toHaveBeenCalledOnce();
      });
    });

    it('should only call upgrade prompt once per session', async () => {
      const onUpgradePrompt = vi.fn();
      const { result } = renderHook(() =>
        useGuestChat({ onUpgradePrompt })
      );

      // Add 6 messages
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.addGuestMessage(
            createTestMessage({ id: `msg-${i}` })
          );
        }
      });

      await waitFor(() => {
        expect(onUpgradePrompt).toHaveBeenCalledOnce();
      });

      // Add another message (should not call again)
      act(() => {
        result.current.addGuestMessage(
          createTestMessage({ id: 'msg-7' })
        );
      });

      // Verify still only called once
      expect(onUpgradePrompt).toHaveBeenCalledOnce();
    });

    it('should persist message count to localStorage', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      act(() => {
        result.current.addGuestMessage(createTestMessage());
      });

      await waitFor(() => {
        const stored = localStorage.getItem('anplexa_guest_message_count');
        expect(stored).toBe('1');
      });
    });
  });

  describe('Loading Messages', () => {
    it('should load persisted messages from localStorage', async () => {
      // Pre-populate localStorage
      const messages = [
        createTestMessage({ id: 'msg-1' }),
        createTestMessage({ id: 'msg-2' }),
      ];
      localStorage.setItem(
        'anplexa_guest_messages',
        JSON.stringify(messages)
      );
      localStorage.setItem('anplexa_guest_message_count', '2');

      const { result } = renderHook(() => useGuestChat({}));

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(2);
        expect(result.current.guestMessageCount).toBe(2);
      });
    });

    it('should load persisted conversation from localStorage', async () => {
      const conversation = createTestConversation();
      localStorage.setItem(
        'anplexa_guest_conversation',
        JSON.stringify(conversation)
      );

      const { result } = renderHook(() => useGuestChat({}));

      await waitFor(() => {
        expect(result.current.guestConversation).toBeDefined();
        expect(result.current.guestConversation?.id).toBe('conv-1');
      });
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('anplexa_guest_messages', 'invalid json');

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useGuestChat({}));

      await waitFor(() => {
        expect(result.current.guestMessages).toEqual([]);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse guest messages'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should manually load guest messages', async () => {
      // Test that loadGuestMessages can be called manually to reload messages
      // (useful for resyncing state after external localStorage changes)
      const messages = [createTestMessage({ id: 'msg-1' })];
      localStorage.setItem(
        'anplexa_guest_messages',
        JSON.stringify(messages)
      );

      // Use a guest user (no userId) since authenticated users have
      // guest data cleared by design when they have messages
      const { result } = renderHook(() => useGuestChat({}));

      // Wait for initial load from useEffect
      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(1);
      });

      // Clear messages manually
      act(() => {
        result.current.clearGuestMessages();
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(0);
      });

      // Re-add to localStorage (simulating external change)
      const newMessages = [
        createTestMessage({ id: 'msg-2' }),
        createTestMessage({ id: 'msg-3' }),
      ];
      localStorage.setItem(
        'anplexa_guest_messages',
        JSON.stringify(newMessages)
      );
      localStorage.setItem('anplexa_guest_message_count', '2');

      // Manually reload guest messages
      await act(async () => {
        await result.current.loadGuestMessages();
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(2);
        expect(result.current.guestMessageCount).toBe(2);
      });
    });
  });

  describe('Conversation Management', () => {
    it('should start with null conversation', () => {
      const { result } = renderHook(() => useGuestChat({}));
      expect(result.current.guestConversation).toBeNull();
    });

    it('should save a guest conversation', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      const conversation = createTestConversation();

      act(() => {
        result.current.saveGuestConversation(conversation);
      });

      await waitFor(() => {
        expect(result.current.guestConversation).toEqual(conversation);
      });
    });

    it('should persist conversation to localStorage', async () => {
      const { result } = renderHook(() => useGuestChat({}));
      const conversation = createTestConversation();

      act(() => {
        result.current.saveGuestConversation(conversation);
      });

      await waitFor(() => {
        const stored = localStorage.getItem('anplexa_guest_conversation');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.id).toBe('conv-1');
      });
    });

    it('should not save conversation when authenticated', () => {
      const { result } = renderHook(() => useGuestChat({ userId: 'user-123' }));
      const conversation = createTestConversation();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.saveGuestConversation(conversation);
      });

      expect(result.current.guestConversation).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'saveGuestConversation called for authenticated user'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Clearing Data', () => {
    it('should clear all guest messages', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      // Add messages first
      act(() => {
        result.current.addGuestMessage(createTestMessage({ id: 'msg-1' }));
        result.current.addGuestMessage(createTestMessage({ id: 'msg-2' }));
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(2);
      });

      // Clear messages
      act(() => {
        result.current.clearGuestMessages();
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toEqual([]);
        expect(result.current.guestConversation).toBeNull();
        expect(result.current.guestMessageCount).toBe(0);
      });
    });

    it('should remove all data from localStorage', async () => {
      const { result } = renderHook(() => useGuestChat({}));

      // Add messages
      act(() => {
        result.current.addGuestMessage(createTestMessage());
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(1);
      });

      // Clear
      act(() => {
        result.current.clearGuestMessages();
      });

      await waitFor(() => {
        expect(localStorage.getItem('anplexa_guest_messages')).toBeNull();
        expect(localStorage.getItem('anplexa_guest_message_count')).toBeNull();
        expect(localStorage.getItem('anplexa_guest_conversation')).toBeNull();
      });
    });

    it('should clear guest data when user logs in', async () => {
      const { result, rerender } = renderHook(
        ({ userId }: { userId?: string }) => useGuestChat({ userId }),
        { initialProps: {} }
      );

      // Add messages as guest
      act(() => {
        result.current.addGuestMessage(createTestMessage());
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(1);
      });

      // User logs in
      rerender({ userId: 'user-123' });

      await waitFor(() => {
        expect(result.current.guestMessages).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create a mock that throws on setItem
      const errorThrowingMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      };

      Object.defineProperty(globalThis, 'localStorage', {
        value: errorThrowingMock,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useGuestChat({}));

      act(() => {
        result.current.addGuestMessage(createTestMessage());
      });

      // Should still update state even if storage fails
      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(1);
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing window object gracefully', async () => {
      // Instead of removing window entirely (which breaks React),
      // test that localStorage operations are guarded by checking typeof window
      // by making localStorage throw and verifying the hook still functions
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create a mock that throws on all operations to simulate inaccessible storage
      const inaccessibleStorageMock = {
        getItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        setItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        removeItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      };

      Object.defineProperty(globalThis, 'localStorage', {
        value: inaccessibleStorageMock,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useGuestChat({}));

      // Should still work, just not persist
      await waitFor(() => {
        expect(result.current.isGuest).toBe(true);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete guest chat workflow', async () => {
      const onUpgradePrompt = vi.fn();
      const { result } = renderHook(() =>
        useGuestChat({ onUpgradePrompt })
      );

      // 1. Start as guest with no messages
      expect(result.current.isGuest).toBe(true);
      expect(result.current.guestMessages).toHaveLength(0);
      expect(result.current.shouldPromptUpgrade).toBe(false);

      // 2. Add a conversation
      const conversation = createTestConversation();
      act(() => {
        result.current.saveGuestConversation(conversation);
      });

      await waitFor(() => {
        expect(result.current.guestConversation?.id).toBe('conv-1');
      });

      // 3. Add messages up to limit
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.addGuestMessage(
            createTestMessage({ id: `msg-${i}` })
          );
        }
      });

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(6);
        expect(result.current.guestMessageCount).toBe(6);
        expect(result.current.shouldPromptUpgrade).toBe(true);
        expect(onUpgradePrompt).toHaveBeenCalledOnce();
      });

      // 4. Verify all data persisted
      const storedMessages = JSON.parse(
        localStorage.getItem('anplexa_guest_messages') || '[]'
      );
      expect(storedMessages).toHaveLength(6);
    });

    it('should recover persisted state on remount', async () => {
      // First render: add messages
      const { unmount } = renderHook(() => useGuestChat({}));

      // Note: In a real test, we'd add messages here
      // For this test, we'll pre-populate localStorage

      const messages = Array.from({ length: 3 }, (_, i) =>
        createTestMessage({ id: `msg-${i}` })
      );
      localStorage.setItem(
        'anplexa_guest_messages',
        JSON.stringify(messages)
      );
      localStorage.setItem('anplexa_guest_message_count', '3');

      unmount();

      // Second render: should restore state
      const { result } = renderHook(() => useGuestChat({}));

      await waitFor(() => {
        expect(result.current.guestMessages).toHaveLength(3);
        expect(result.current.guestMessageCount).toBe(3);
      });
    });
  });
});
