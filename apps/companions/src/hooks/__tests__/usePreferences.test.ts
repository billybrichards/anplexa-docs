import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferences } from '../usePreferences';

describe('usePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
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
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => usePreferences());

    act(() => {
      result.current.updatePreferences({ voice: 'calm' });
    });

    expect(consoleSpy).toHaveBeenCalled();
    storageSpy.mockRestore();
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
