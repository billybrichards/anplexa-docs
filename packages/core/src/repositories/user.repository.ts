/**
 * User Repository Implementation
 *
 * Implements the IUserRepository interface using Drizzle ORM.
 * Handles all user data access operations with proper error handling
 * and transaction support where appropriate.
 */

import { eq } from 'drizzle-orm';
import type { Database } from '@anplexa/database';
import { users, type User, type NewUser } from '@anplexa/database';
import type {
  IUserRepository,
  CreateUserData,
  PaginationOptions,
} from './interfaces/user.repository.interface.js';

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  /**
   * Get a user by ID
   */
  async getById(id: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get user by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a user by email address
   */
  async getByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all users with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<User[]> {
    try {
      let query = this.db.select().from(users);

      // Apply pagination - limit must be set before offset in SQL
      if (options?.limit !== undefined) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        // If offset is used without limit, we need a large default limit
        if (options?.limit === undefined) {
          query = query.limit(1000000); // Large number to effectively get all
        }
        query = query.offset(options.offset);
      }

      return await query;
    } catch (error) {
      throw new Error(`Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.getByEmail(userData.email);
      if (existingUser) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      // Prepare user data with defaults
      const newUser: NewUser = {
        id: userData.id,
        email: userData.email,
        passwordHash: userData.passwordHash,
        displayName: userData.displayName ?? null,
        chatName: userData.chatName ?? null,
        personalityMode: userData.personalityMode ?? 'nurturing',
        storagePreference: userData.storagePreference ?? 'cloud',
        isAdmin: userData.isAdmin ?? false,
        subscriptionStatus: userData.subscriptionStatus ?? 'not_subscribed',
        credits: userData.credits ?? 0,
        stripeCustomerId: userData.stripeCustomerId ?? null,
        stripeSubscriptionId: userData.stripeSubscriptionId ?? null,
        accountSource: userData.accountSource ?? 'frontend',
        sourceChannel: userData.sourceChannel ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualSubscriptionOverride: false,
        lastCreditRefresh: null,
      };

      // Insert user
      await this.db.insert(users).values(newUser);

      // Return the created user
      const createdUser = await this.getById(userData.id);
      if (!createdUser) {
        throw new Error('Failed to retrieve created user');
      }

      return createdUser;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.getById(id);
      if (!existingUser) {
        throw new Error(`User with id ${id} not found`);
      }

      // If email is being updated, check for conflicts
      if (updates.email && updates.email !== existingUser.email) {
        const userWithEmail = await this.getByEmail(updates.email);
        if (userWithEmail && userWithEmail.id !== id) {
          throw new Error(`User with email ${updates.email} already exists`);
        }
      }

      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Remove undefined values to avoid Drizzle issues
      const cleanedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      // Update user
      await this.db
        .update(users)
        .set(cleanedUpdateData)
        .where(eq(users.id, id));

      // Return the updated user
      const updatedUser = await this.getById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('already exists'))) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await this.getById(id);
      if (!existingUser) {
        throw new Error(`User with id ${id} not found`);
      }

      // Delete user
      await this.db.delete(users).where(eq(users.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
