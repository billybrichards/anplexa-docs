/**
 * Password Reset Token Repository Implementation
 *
 * Concrete implementation of IPasswordResetTokenRepository using Drizzle ORM.
 * This is part of the infrastructure layer in Clean Architecture.
 */

import { randomUUID } from 'crypto';
import type { Database } from '@anplexa/database';
import { postgres as schema, eq, lt, and, isNull, gt } from '@anplexa/database';
import { PasswordResetToken } from '../domain/entities/PasswordResetToken';
import type {
  IPasswordResetTokenRepository,
  CreatePasswordResetTokenData,
} from './interfaces/password-reset-token.repository.interface';

/**
 * Drizzle ORM implementation of the Password Reset Token Repository
 *
 * Handles all password reset token-related database operations including:
 * - Token creation
 * - Token lookups by token hash
 * - Marking tokens as used
 * - Expired token cleanup
 */
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly db: Database) {}

  /**
   * Creates a new password reset token in the database
   *
   * Generates a unique ID for the token and sets the creation timestamp.
   *
   * @param data - Data required to create the token
   * @returns Promise resolving to the created token
   * @throws Error if database insertion fails
   */
  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    try {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const tokenToInsert = {
        id,
        userId: data.userId,
        tokenHash: data.token,
        expiresAt: data.expiresAt,
        usedAt: null,
        createdAt,
      };

      await this.db.insert(schema.passwordResetTokens).values(tokenToInsert);

      return this.mapToPasswordResetToken({
        ...tokenToInsert,
        usedAt: null,
      });
    } catch (error) {
      throw new Error(
        `Failed to create password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a password reset token by its token hash
   *
   * Used during password reset operations to validate the token
   * and retrieve the associated reset request.
   *
   * @param token - The token hash to search for
   * @returns Promise resolving to token or null if not found
   * @throws Error if database query fails
   */
  async getByToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const results = await this.db
        .select()
        .from(schema.passwordResetTokens)
        .where(eq(schema.passwordResetTokens.tokenHash, token))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.mapToPasswordResetToken(results[0]);
    } catch (error) {
      throw new Error(
        `Failed to retrieve password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Marks a password reset token as used
   *
   * Sets the usedAt timestamp to the current time, preventing token reuse.
   *
   * @param id - The token's unique identifier
   * @returns Promise that resolves when update is complete
   * @throws Error if database update fails
   */
  async markAsUsed(id: string): Promise<void> {
    try {
      const usedAt = new Date().toISOString();

      await this.db
        .update(schema.passwordResetTokens)
        .set({ usedAt })
        .where(eq(schema.passwordResetTokens.id, id));
    } catch (error) {
      throw new Error(
        `Failed to mark password reset token as used: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets all valid (non-expired, unused) password reset tokens
   *
   * @returns Promise resolving to array of valid tokens
   * @throws Error if database query fails
   */
  async getAllValid(): Promise<PasswordResetToken[]> {
    try {
      const now = new Date().toISOString();

      const results = await this.db
        .select()
        .from(schema.passwordResetTokens)
        .where(
          and(
            isNull(schema.passwordResetTokens.usedAt),
            gt(schema.passwordResetTokens.expiresAt, now)
          )
        );

      return results.map(this.mapToPasswordResetToken);
    } catch (error) {
      throw new Error(
        `Failed to get valid password reset tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Removes all expired tokens from the database
   *
   * This method performs a cleanup operation to remove tokens that have
   * passed their expiration time. Should be called periodically (e.g., via
   * a cron job or scheduled task).
   *
   * @returns Promise resolving to the count of deleted tokens
   * @throws Error if database deletion fails
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // First, count the expired tokens
      const expiredTokens = await this.db
        .select()
        .from(schema.passwordResetTokens)
        .where(lt(schema.passwordResetTokens.expiresAt, now));

      const count = expiredTokens.length;

      // Delete expired tokens
      if (count > 0) {
        await this.db
          .delete(schema.passwordResetTokens)
          .where(lt(schema.passwordResetTokens.expiresAt, now));
      }

      return count;
    } catch (error) {
      throw new Error(
        `Failed to delete expired password reset tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Maps a database row to a PasswordResetToken domain entity
   *
   * Converts database string timestamps to Date objects for domain layer
   * and determines if the token has been used based on usedAt field.
   *
   * @param row - The raw database row
   * @returns PasswordResetToken domain entity
   */
  private mapToPasswordResetToken(row: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string | null;
  }): PasswordResetToken {
    return new PasswordResetToken(
      row.id,
      row.userId,
      row.tokenHash,
      row.usedAt !== null, // used = true if usedAt is set
      new Date(row.expiresAt),
      row.createdAt ? new Date(row.createdAt) : new Date()
    );
  }
}
