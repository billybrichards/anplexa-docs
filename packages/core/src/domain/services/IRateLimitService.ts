/**
 * Rate Limit Service Interface
 *
 * Defines the contract for rate limiting chat messages.
 * Free tier users are limited to a configurable number of messages per day.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string; // ISO datetime when the limit resets
}

export interface IRateLimitService {
  /**
   * Check if a user can send a message and increment the counter if allowed.
   * Subscribed users bypass rate limiting entirely.
   */
  checkAndIncrement(userId: string, isSubscribed: boolean): Promise<RateLimitResult>;

  /**
   * Get the remaining message count for a user without incrementing.
   */
  getRemaining(userId: string, isSubscribed: boolean): Promise<number>;
}
