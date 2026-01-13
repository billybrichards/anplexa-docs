/**
 * User Repository Interface
 *
 * Defines the contract for user data access operations.
 * Part of the Clean Architecture repository pattern.
 */

import type { User } from '@anplexa/database';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface CreateUserData {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string | null;
  chatName?: string | null;
  personalityMode?: string | null;
  storagePreference?: string | null;
  isAdmin?: boolean;
  subscriptionStatus?: string;
  credits?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  accountSource?: string;
  sourceChannel?: string | null;
}

export interface IUserRepository {
  /**
   * Query Methods
   */
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getAll(options?: PaginationOptions): Promise<User[]>;

  /**
   * Command Methods
   */
  create(userData: CreateUserData): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
