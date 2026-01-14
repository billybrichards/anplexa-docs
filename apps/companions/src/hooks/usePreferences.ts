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
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update preferences and persist to storage
  const updatePreferences = useCallback((updates: Partial<CompanionPreferences>) => {
    try {
      setPreferences((prev) => {
        const updated = { ...prev, ...updates };
        if (typeof window !== 'undefined') {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, []);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    try {
      setPreferences(DEFAULT_PREFERENCES);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
}
