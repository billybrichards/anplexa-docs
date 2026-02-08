import { useState, useEffect, useCallback } from 'react';

const PREFERENCES_STORAGE_KEY = 'anplexa_companion_preferences';

export interface CompanionPreferences {
  voice?: string;
  personality?: string;
  language?: string;
  responseLength?: 'short' | 'medium' | 'long';
  tone?: 'formal' | 'casual' | 'professional';
  showTypingIndicator?: boolean;
  enableSoundNotifications?: boolean;
}

export interface UsePreferencesReturn {
  preferences: CompanionPreferences;
  updatePreferences: (prefs: Partial<CompanionPreferences>) => void;
  resetPreferences: () => void;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

const DEFAULT_PREFERENCES: CompanionPreferences = {
  voice: 'default',
  personality: 'friendly',
  language: 'en',
  responseLength: 'medium',
  tone: 'casual',
  showTypingIndicator: true,
  enableSoundNotifications: true,
};

/**
 * Hook for managing companion preference settings
 * Handles loading, saving, and resetting user preferences
 * Uses localStorage for persistence
 */
export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] = useState<CompanionPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load preferences from storage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setPreferences((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error('Failed to load preferences');
        console.error('Failed to load preferences:', loadError);
        setError(loadError);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update preferences and persist to storage
  const updatePreferences = useCallback((updates: Partial<CompanionPreferences>) => {
    setError(null);
    // Compute the new preferences first
    const newPreferences = { ...preferences, ...updates };

    // Update state
    setPreferences(newPreferences);

    // Persist to storage outside of the state updater to avoid side effects during render
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPreferences));
      } catch (err) {
        const updateError = err instanceof Error ? err : new Error('Failed to update preferences');
        console.error('Failed to update preferences:', updateError);
        setError(updateError);
      }
    }
  }, [preferences]);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    setError(null);
    try {
      setPreferences(DEFAULT_PREFERENCES);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      }
    } catch (err) {
      const resetError = err instanceof Error ? err : new Error('Failed to reset preferences');
      console.error('Failed to reset preferences:', resetError);
      setError(resetError);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
    error,
    clearError,
  };
}
