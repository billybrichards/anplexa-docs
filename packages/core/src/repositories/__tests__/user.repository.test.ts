/**
 * User Repository Unit Tests
 *
 * Comprehensive test suite for UserRepository using SQLite in-memory database.
 * Tests all query and command methods with various edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqlite as schema } from '@anplexa/database';
import type { User } from '@anplexa/database';
import { UserRepository } from '../user.repository.js';
import type { CreateUserData } from '../interfaces/user.repository.interface.js';

describe('UserRepository', () => {
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: UserRepository;

  // Test data
  const testUser: CreateUserData = {
    id: 'test-user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password-123',
    displayName: 'Test User',
    chatName: 'Testy',
    personalityMode: 'nurturing',
    storagePreference: 'cloud',
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    credits: 100,
    accountSource: 'frontend',
  };

  beforeEach(() => {
    // Create in-memory SQLite database
    sqliteDb = new Database(':memory:');

    // Initialize Drizzle with the SQLite connection and schema
    db = drizzle(sqliteDb, { schema });

    // Create the users table - must match schema from @anplexa/database
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        chat_name TEXT,
        personality_mode TEXT DEFAULT 'nurturing',
        preferred_gender TEXT DEFAULT 'female',
        custom_gender TEXT,
        storage_preference TEXT DEFAULT 'cloud',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_admin INTEGER DEFAULT 0,
        subscription_status TEXT DEFAULT 'not_subscribed',
        manual_subscription_override INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 0,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        account_source TEXT DEFAULT 'frontend',
        last_credit_refresh TEXT,
        funnel_type TEXT DEFAULT 'direct',
        persona TEXT,
        stage TEXT DEFAULT 'new',
        entry_source TEXT,
        used_free_messages INTEGER DEFAULT 0,
        email_opened_1 INTEGER DEFAULT 0,
        email_opened_2 INTEGER DEFAULT 0,
        email_opened_3 INTEGER DEFAULT 0,
        clicked_use_app INTEGER DEFAULT 0,
        feedback_submitted INTEGER DEFAULT 0,
        refund_requested INTEGER DEFAULT 0,
        refund_processed INTEGER DEFAULT 0,
        last_activity_at TEXT,
        amplexa_funnel TEXT,
        amplexa_funnel_name TEXT,
        amplexa_responses TEXT,
        amplexa_primary_need TEXT,
        amplexa_communication_style TEXT,
        amplexa_pace TEXT,
        amplexa_tags TEXT,
        amplexa_timestamp TEXT,
        source_channel TEXT
      )
    `);

    // Initialize repository
    repository = new UserRepository(db);
  });

  afterEach(() => {
    // Close database connection
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const user = await repository.create(testUser);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.displayName).toBe(testUser.displayName);
      expect(user.chatName).toBe(testUser.chatName);
      expect(user.credits).toBe(testUser.credits);
      expect(user.isAdmin).toBe(false);
    });

    it('should create a user with minimal required fields', async () => {
      const minimalUser: CreateUserData = {
        id: 'minimal-user-1',
        email: 'minimal@example.com',
        passwordHash: 'hashed-password',
      };

      const user = await repository.create(minimalUser);

      expect(user).toBeDefined();
      expect(user.id).toBe(minimalUser.id);
      expect(user.email).toBe(minimalUser.email);
      expect(user.personalityMode).toBe('nurturing');
      expect(user.storagePreference).toBe('cloud');
      expect(user.credits).toBe(0);
      expect(user.isAdmin).toBe(false);
    });

    it('should throw error when creating user with duplicate email', async () => {
      await repository.create(testUser);

      await expect(
        repository.create({
          ...testUser,
          id: 'different-id',
        })
      ).rejects.toThrow('User with email test@example.com already exists');
    });

    it('should create user with admin privileges', async () => {
      const adminUser: CreateUserData = {
        ...testUser,
        id: 'admin-user-1',
        email: 'admin@example.com',
        isAdmin: true,
      };

      const user = await repository.create(adminUser);

      expect(user.isAdmin).toBe(true);
    });

    it('should create user with custom subscription status', async () => {
      const subscribedUser: CreateUserData = {
        ...testUser,
        id: 'subscribed-user-1',
        email: 'subscribed@example.com',
        subscriptionStatus: 'subscribed',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
      };

      const user = await repository.create(subscribedUser);

      expect(user.subscriptionStatus).toBe('subscribed');
      expect(user.stripeCustomerId).toBe('cus_123456');
      expect(user.stripeSubscriptionId).toBe('sub_123456');
    });
  });

  describe('getById', () => {
    it('should retrieve an existing user by id', async () => {
      await repository.create(testUser);

      const user = await repository.getById(testUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent user id', async () => {
      const user = await repository.getById('non-existent-id');

      expect(user).toBeNull();
    });

    it('should retrieve user with all fields populated', async () => {
      const fullUser: CreateUserData = {
        ...testUser,
        displayName: 'Full Name',
        chatName: 'Chat Name',
        personalityMode: 'playful',
        storagePreference: 'local',
        credits: 500,
        stripeCustomerId: 'cus_test',
        stripeSubscriptionId: 'sub_test',
      };

      await repository.create(fullUser);
      const user = await repository.getById(fullUser.id);

      expect(user?.displayName).toBe('Full Name');
      expect(user?.chatName).toBe('Chat Name');
      expect(user?.personalityMode).toBe('playful');
      expect(user?.storagePreference).toBe('local');
      expect(user?.credits).toBe(500);
    });
  });

  describe('getByEmail', () => {
    it('should retrieve an existing user by email', async () => {
      await repository.create(testUser);

      const user = await repository.getByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await repository.getByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should be case-sensitive for email lookup', async () => {
      await repository.create(testUser);

      const user = await repository.getByEmail(testUser.email.toUpperCase());

      expect(user).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should retrieve all users', async () => {
      await repository.create(testUser);
      await repository.create({
        ...testUser,
        id: 'test-user-2',
        email: 'test2@example.com',
      });
      await repository.create({
        ...testUser,
        id: 'test-user-3',
        email: 'test3@example.com',
      });

      const allUsers = await repository.getAll();

      expect(allUsers).toHaveLength(3);
      expect(allUsers.map(u => u.id)).toContain(testUser.id);
    });

    it('should return empty array when no users exist', async () => {
      const allUsers = await repository.getAll();

      expect(allUsers).toEqual([]);
    });

    it('should respect limit option', async () => {
      await repository.create(testUser);
      await repository.create({
        ...testUser,
        id: 'test-user-2',
        email: 'test2@example.com',
      });
      await repository.create({
        ...testUser,
        id: 'test-user-3',
        email: 'test3@example.com',
      });

      const users = await repository.getAll({ limit: 2 });

      expect(users).toHaveLength(2);
    });

    it('should respect offset option', async () => {
      await repository.create({ ...testUser, id: 'user-1', email: 'user1@example.com' });
      await repository.create({ ...testUser, id: 'user-2', email: 'user2@example.com' });
      await repository.create({ ...testUser, id: 'user-3', email: 'user3@example.com' });

      const users = await repository.getAll({ offset: 1 });

      expect(users).toHaveLength(2);
    });

    it('should respect both limit and offset options', async () => {
      await repository.create({ ...testUser, id: 'user-1', email: 'user1@example.com' });
      await repository.create({ ...testUser, id: 'user-2', email: 'user2@example.com' });
      await repository.create({ ...testUser, id: 'user-3', email: 'user3@example.com' });
      await repository.create({ ...testUser, id: 'user-4', email: 'user4@example.com' });

      const users = await repository.getAll({ limit: 2, offset: 1 });

      expect(users).toHaveLength(2);
      expect(users[0].id).not.toBe('user-1');
    });
  });

  describe('update', () => {
    it('should update user fields successfully', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        displayName: 'Updated Name',
        credits: 200,
      });

      expect(updatedUser.displayName).toBe('Updated Name');
      expect(updatedUser.credits).toBe(200);
      expect(updatedUser.email).toBe(testUser.email);
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(
        repository.update('non-existent-id', { displayName: 'New Name' })
      ).rejects.toThrow('User with id non-existent-id not found');
    });

    it('should update email if new email is unique', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        email: 'newemail@example.com',
      });

      expect(updatedUser.email).toBe('newemail@example.com');
    });

    it('should throw error when updating email to existing email', async () => {
      await repository.create(testUser);
      await repository.create({
        ...testUser,
        id: 'test-user-2',
        email: 'test2@example.com',
      });

      await expect(
        repository.update(testUser.id, { email: 'test2@example.com' })
      ).rejects.toThrow('User with email test2@example.com already exists');
    });

    it('should update subscription status', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        subscriptionStatus: 'subscribed',
        stripeCustomerId: 'cus_new',
        stripeSubscriptionId: 'sub_new',
      });

      expect(updatedUser.subscriptionStatus).toBe('subscribed');
      expect(updatedUser.stripeCustomerId).toBe('cus_new');
      expect(updatedUser.stripeSubscriptionId).toBe('sub_new');
    });

    it('should update admin status', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        isAdmin: true,
      });

      expect(updatedUser.isAdmin).toBe(true);
    });

    it('should update personality mode', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        personalityMode: 'dominant',
      });

      expect(updatedUser.personalityMode).toBe('dominant');
    });

    it('should update multiple fields at once', async () => {
      await repository.create(testUser);

      const updatedUser = await repository.update(testUser.id, {
        displayName: 'Multi Update',
        chatName: 'MultiChat',
        credits: 999,
        personalityMode: 'playful',
        storagePreference: 'local',
      });

      expect(updatedUser.displayName).toBe('Multi Update');
      expect(updatedUser.chatName).toBe('MultiChat');
      expect(updatedUser.credits).toBe(999);
      expect(updatedUser.personalityMode).toBe('playful');
      expect(updatedUser.storagePreference).toBe('local');
    });

    it('should update timestamp on update', async () => {
      await repository.create(testUser);
      const originalUser = await repository.getById(testUser.id);

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = await repository.update(testUser.id, {
        displayName: 'New Name',
      });

      expect(updatedUser.updatedAt).not.toBe(originalUser?.updatedAt);
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      await repository.create(testUser);

      await repository.delete(testUser.id);

      const user = await repository.getById(testUser.id);
      expect(user).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'User with id non-existent-id not found'
      );
    });

    it('should allow creating user with same email after deletion', async () => {
      await repository.create(testUser);
      await repository.delete(testUser.id);

      const newUser = await repository.create({
        ...testUser,
        id: 'new-user-id',
      });

      expect(newUser.email).toBe(testUser.email);
      expect(newUser.id).toBe('new-user-id');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully on getById', async () => {
      sqliteDb.close();

      await expect(repository.getById('any-id')).rejects.toThrow('Failed to get user by id');
    });
  });

  describe('edge cases', () => {
    it('should handle null values correctly', async () => {
      const userWithNulls: CreateUserData = {
        id: 'null-user',
        email: 'null@example.com',
        passwordHash: 'hash',
        displayName: null,
        chatName: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const user = await repository.create(userWithNulls);

      expect(user.displayName).toBeNull();
      expect(user.chatName).toBeNull();
      expect(user.stripeCustomerId).toBeNull();
      expect(user.stripeSubscriptionId).toBeNull();
    });

    it('should handle special characters in email', async () => {
      const specialUser: CreateUserData = {
        ...testUser,
        id: 'special-user',
        email: 'test+special@example.com',
      };

      const user = await repository.create(specialUser);

      expect(user.email).toBe('test+special@example.com');

      const foundUser = await repository.getByEmail('test+special@example.com');
      expect(foundUser?.id).toBe('special-user');
    });

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(255);
      const longUser: CreateUserData = {
        ...testUser,
        id: 'long-user',
        email: 'long@example.com',
        displayName: longString,
      };

      const user = await repository.create(longUser);

      expect(user.displayName).toBe(longString);
    });

    it('should handle zero credits', async () => {
      const zeroCreditsUser: CreateUserData = {
        ...testUser,
        id: 'zero-credits',
        email: 'zero@example.com',
        credits: 0,
      };

      const user = await repository.create(zeroCreditsUser);

      expect(user.credits).toBe(0);
    });

    it('should handle negative credits', async () => {
      const negativeCreditsUser: CreateUserData = {
        ...testUser,
        id: 'negative-credits',
        email: 'negative@example.com',
        credits: -100,
      };

      const user = await repository.create(negativeCreditsUser);

      expect(user.credits).toBe(-100);
    });
  });
});
