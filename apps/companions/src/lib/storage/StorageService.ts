/**
 * StorageService - Type-safe wrapper for browser storage
 *
 * Provides type-safe, error-handled access to sessionStorage and localStorage.
 * Prevents direct usage of raw storage APIs throughout the application.
 *
 * Benefits:
 * - Type safety for stored data
 * - Automatic JSON serialization/deserialization
 * - Error handling for malformed data
 * - Consistent API across the application
 * - Easy to mock for testing
 */

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageService {
  /**
   * Retrieve an item from sessionStorage with type safety
   *
   * @param key - Storage key
   * @returns Parsed value or null if not found/invalid
   * @throws StorageError if parsing fails
   */
  static getSessionItem<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      throw new StorageError(
        `Failed to retrieve or parse sessionStorage item: ${key}`,
        key,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Store an item in sessionStorage with automatic serialization
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON.stringify'd)
   * @throws StorageError if serialization fails
   */
  static setSessionItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      throw new StorageError(
        `Failed to serialize and store sessionStorage item: ${key}`,
        key,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Remove an item from sessionStorage
   *
   * @param key - Storage key to remove
   */
  static removeSessionItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all sessionStorage items
   */
  static clearSession(): void {
    sessionStorage.clear();
  }

  /**
   * Retrieve an item from localStorage with type safety
   *
   * @param key - Storage key
   * @returns Parsed value or null if not found/invalid
   * @throws StorageError if parsing fails
   */
  static getLocalItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      throw new StorageError(
        `Failed to retrieve or parse localStorage item: ${key}`,
        key,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Store an item in localStorage with automatic serialization
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON.stringify'd)
   * @throws StorageError if serialization fails
   */
  static setLocalItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      throw new StorageError(
        `Failed to serialize and store localStorage item: ${key}`,
        key,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Remove an item from localStorage
   *
   * @param key - Storage key to remove
   */
  static removeLocalItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all localStorage items
   */
  static clearLocal(): void {
    localStorage.clear();
  }

  /**
   * Check if sessionStorage is available
   * (may be disabled in private browsing or due to security settings)
   */
  static isSessionStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * (may be disabled in private browsing or due to security settings)
   */
  static isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Type definitions for known storage keys
 * Add new keys here to maintain type safety across the application
 */
export interface BirthDataStorage {
  userId: string;
  date: string;
  time: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  timestamp: string;
}

/**
 * Storage key constants
 * Use these instead of magic strings
 */
export const STORAGE_KEYS = {
  BIRTH_DATA: 'birthData',
  COMPANION: 'companion',
  USER_PREFERENCES: 'userPreferences',
  ONBOARDING_PROGRESS: 'onboardingProgress',
} as const;
