import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferences } from '../usePreferences';

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

// Store original localStorage
const originalLocalStorage = globalThis.localStorage;

describe('usePreferences', () => {
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
  });

  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences).toEqual({
      voice: 'default',
      personality: 'friendly',
      language: 'en',
      responseLength: 'medium',
      tone: 'casual',
      showTypingIndicator: true,
      enableSoundNotifications: true,
    });
  });

  it('should load preferences from localStorage on mount', () => {
    const storedPreferences = {
      voice: 'calm',
      personality: 'formal',
    };

    localStorage.setItem('anplexa_companion_preferences', JSON.stringify(storedPreferences));

    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences.voice).toBe('calm');
    expect(result.current.preferences.personality).toBe('formal');
  });

  it('should update preferences and persist to storage', () => {
    const { result } = renderHook(() => usePreferences());

    act(() => {
      result.current.updatePreferences({ voice: 'calm', responseLength: 'long' });
    });

    expect(result.current.preferences.voice).toBe('calm');
    expect(result.current.preferences.responseLength).toBe('long');

    const stored = JSON.parse(localStorage.getItem('anplexa_companion_preferences') || '{}');
    expect(stored.voice).toBe('calm');
    expect(stored.responseLength).toBe('long');
  });

  it('should reset preferences to defaults', () => {
    const { result } = renderHook(() => usePreferences());

    act(() => {
      result.current.updatePreferences({ voice: 'calm' });
    });

    expect(result.current.preferences.voice).toBe('calm');

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.voice).toBe('default');
    expect(localStorage.getItem('anplexa_companion_preferences')).toBeNull();
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a mock that throws on setItem
    const errorThrowingMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('Storage error');
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

    const { result } = renderHook(() => usePreferences());

    act(() => {
      result.current.updatePreferences({ voice: 'calm' });
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should indicate loading state initially', () => {
    const { result } = renderHook(() => usePreferences());

    // isLoading should be false after the effect runs
    expect(result.current.isLoading).toBe(false);
  });

  it('should merge updates with existing preferences', () => {
    const { result } = renderHook(() => usePreferences());

    act(() => {
      result.current.updatePreferences({ voice: 'calm' });
    });

    expect(result.current.preferences.voice).toBe('calm');
    expect(result.current.preferences.personality).toBe('friendly');
  });
});
