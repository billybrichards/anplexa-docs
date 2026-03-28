import type { Redis } from 'ioredis';
import type { IRateLimitService, RateLimitResult } from '@anplexa/core';

export interface RateLimitConfig {
  /** Maximum messages per day for free-tier users. Default: 5 */
  freeLimit?: number;
  /** Redis key prefix. Default: 'anplexa:rate' */
  keyPrefix?: string;
}

/**
 * Lua script for atomic check-and-increment.
 *
 * KEYS[1] = rate limit key
 * ARGV[1] = limit (max allowed)
 * ARGV[2] = TTL in seconds (for key expiry at midnight UTC)
 *
 * Returns: current count AFTER increment if allowed, or -1 if over limit.
 */
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local current = tonumber(redis.call('GET', key) or '0')
if current >= limit then
  return -1
end
local newVal = redis.call('INCR', key)
if newVal == 1 then
  redis.call('EXPIRE', key, ttl)
end
return newVal
`;

/**
 * Redis-backed rate limiting service.
 *
 * Free-tier users are limited to N messages per calendar day (UTC).
 * Subscribed users bypass rate limiting entirely.
 *
 * Uses an atomic Lua script to prevent race conditions under concurrent requests.
 *
 * Key format: `{prefix}:{userId}:{YYYY-MM-DD}`
 * Keys expire at midnight UTC automatically.
 */
export class RateLimitService implements IRateLimitService {
  private readonly redis: Redis | null;
  private readonly freeLimit: number;
  private readonly keyPrefix: string;

  constructor(redis: Redis | null, config: RateLimitConfig = {}) {
    this.redis = redis;
    this.freeLimit = config.freeLimit ?? 5;
    this.keyPrefix = config.keyPrefix ?? 'anplexa:rate';
  }

  async checkAndIncrement(userId: string, isSubscribed: boolean): Promise<RateLimitResult> {
    if (isSubscribed) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: this.getResetAt(),
      };
    }

    // No Redis available — fail open (allow the request)
    if (!this.redis) {
      return {
        allowed: true,
        remaining: this.freeLimit,
        resetAt: this.getResetAt(),
      };
    }

    const key = this.buildKey(userId);
    const ttl = this.secondsUntilMidnightUTC();

    // Atomic check-and-increment via Lua script — no race condition
    const result = await this.redis.eval(
      RATE_LIMIT_LUA,
      1,
      key,
      String(this.freeLimit),
      String(ttl),
    ) as number;

    const allowed = result !== -1;
    const currentCount = allowed ? result : this.freeLimit;
    const remaining = Math.max(0, this.freeLimit - currentCount);

    return {
      allowed,
      remaining,
      resetAt: this.getResetAt(),
    };
  }

  async getRemaining(userId: string, isSubscribed: boolean): Promise<number> {
    if (isSubscribed) {
      return Infinity;
    }

    // No Redis available — return full limit
    if (!this.redis) {
      return this.freeLimit;
    }

    const key = this.buildKey(userId);
    const current = await this.redis.get(key);
    const used = current ? parseInt(current, 10) : 0;
    return Math.max(0, this.freeLimit - used);
  }

  private buildKey(userId: string): string {
    const date = this.getTodayUTC();
    return `${this.keyPrefix}:${userId}:${date}`;
  }

  private getTodayUTC(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private getResetAt(): string {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0,
    ));
    return tomorrow.toISOString();
  }

  private secondsUntilMidnightUTC(): number {
    const now = new Date();
    const midnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0,
    ));
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }
}
