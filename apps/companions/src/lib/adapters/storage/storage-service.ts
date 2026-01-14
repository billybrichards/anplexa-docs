/**
 * Storage Service Adapter
 *
 * Centralized abstraction over browser storage (localStorage, sessionStorage, etc).
 * Provides a single interface for storing and retrieving data.
 *
 * This allows:
 * - Easy switching between storage backends (localStorage, sessionStorage, IndexedDB)
 * - Consistent error handling
 * - JSON serialization/deserialization
 * - Optional expiration support
 * - Mock-friendly interface for testing
 */

export interface StorageOptions {
  expireIn?: number; // milliseconds
}

/**
 * Storage Service class
 *
 * Provides a clean API for browser storage operations.
 * Handles JSON serialization and includes optional expiration support.
 */
export class StorageService {
  private storage: Storage;
  private prefix: string = 'anplexa_';

  constructor(type: 'localStorage' | 'sessionStorage' = 'localStorage') {
    this.storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
  }

  /**
   * Get a value from storage
   * @param key - Storage key
   * @returns Parsed value or null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = this.storage.getItem(prefixedKey);

      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);

      // Check expiration
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        this.remove(key);
        return null;
      }

      return parsed.value as T;
    } catch (error) {
      console.warn(`Failed to get item from storage (${key}):`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options (e.g., expiration)
   */
  set<T>(key: string, value: T, options?: StorageOptions): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const data: { value: T; expiresAt?: number } = { value };

      if (options?.expireIn) {
        data.expiresAt = Date.now() + options.expireIn;
      }

      this.storage.setItem(prefixedKey, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to set item in storage (${key}):`, error);
    }
  }

  /**
   * Remove a value from storage
   * @param key - Storage key
   */
  remove(key: string): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      this.storage.removeItem(prefixedKey);
    } catch (error) {
      console.warn(`Failed to remove item from storage (${key}):`, error);
    }
  }

  /**
   * Clear all storage items with anplexa prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Check if a key exists in storage
   * @param key - Storage key
   * @returns true if key exists and is not expired
   */
  has(key: string): boolean {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = this.storage.getItem(prefixedKey);

      if (!item) {
        return false;
      }

      const parsed = JSON.parse(item);

      // Check expiration
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        this.remove(key);
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`Failed to check storage key (${key}):`, error);
      return false;
    }
  }

  /**
   * Get all keys in storage with anplexa prefix
   */
  keys(): string[] {
    const keys: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }

    return keys;
  }

  /**
   * Get prefixed storage key
   * @private
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}

/**
 * Global storage service instance for localStorage
 */
export const storageService = new StorageService('localStorage');

/**
 * Session storage service instance
 */
export const sessionStorageService = new StorageService('sessionStorage');
