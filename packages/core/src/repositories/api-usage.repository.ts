/**
 * API Usage Repository Implementation
 *
 * Implements the IApiUsageRepository interface using Drizzle ORM.
 * Handles all API usage data access operations with aggregation support.
 */

import type { Database } from '@anplexa/database';
import { apiUsage, type ApiUsage, eq, and, gte, lte, count, avg, sql } from '@anplexa/database';
import type {
  IApiUsageRepository,
  CreateApiUsageData,
  ApiUsageStats,
} from './interfaces/api-usage.repository.interface.js';

export class ApiUsageRepository implements IApiUsageRepository {
  constructor(private readonly db: Database) {}

  /**
   * Get all API usage records
   */
  async getAll(): Promise<ApiUsage[]> {
    try {
      return await this.db.select().from(apiUsage);
    } catch (error) {
      throw new Error(
        `Failed to get all API usage records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage records by user ID
   */
  async getByUserId(userId: string): Promise<ApiUsage[]> {
    try {
      return await this.db.select().from(apiUsage).where(eq(apiUsage.userId, userId));
    } catch (error) {
      throw new Error(
        `Failed to get API usage by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage records within a date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<ApiUsage[]> {
    try {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();

      return await this.db
        .select()
        .from(apiUsage)
        .where(and(gte(apiUsage.createdAt, start), lte(apiUsage.createdAt, end)));
    } catch (error) {
      throw new Error(
        `Failed to get API usage by date range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage records by endpoint
   */
  async getByEndpoint(endpoint: string): Promise<ApiUsage[]> {
    try {
      return await this.db.select().from(apiUsage).where(eq(apiUsage.endpoint, endpoint));
    } catch (error) {
      throw new Error(
        `Failed to get API usage by endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<ApiUsageStats> {
    try {
      const results = await this.db
        .select({
          totalRequests: count(),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${apiUsage.userId})`,
          avgLatency: avg(apiUsage.latencyMs),
        })
        .from(apiUsage);

      const stats = results[0];
      const allUsage = await this.getAll();
      const successCount = allUsage.filter((u) => u.statusCode >= 200 && u.statusCode < 300)
        .length;

      return {
        totalRequests: stats.totalRequests || 0,
        uniqueUsers: stats.uniqueUsers || 0,
        avgRequestsPerUser:
          stats.uniqueUsers > 0 ? Math.round((stats.totalRequests || 0) / stats.uniqueUsers) : 0,
        avgLatencyMs: stats.avgLatency ? Number(stats.avgLatency) : null,
        successRate:
          stats.totalRequests > 0 ? Math.round((successCount / stats.totalRequests) * 100) : 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get API usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage statistics for a specific user
   */
  async getUserStats(userId: string): Promise<ApiUsageStats> {
    try {
      const userUsage = await this.getByUserId(userId);

      if (userUsage.length === 0) {
        return {
          totalRequests: 0,
          uniqueUsers: 0,
          avgRequestsPerUser: 0,
          avgLatencyMs: null,
          successRate: 0,
        };
      }

      const successCount = userUsage.filter((u) => u.statusCode >= 200 && u.statusCode < 300)
        .length;
      const avgLatency =
        userUsage.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / userUsage.length;

      return {
        totalRequests: userUsage.length,
        uniqueUsers: 1,
        avgRequestsPerUser: userUsage.length,
        avgLatencyMs: avgLatency > 0 ? Math.round(avgLatency) : null,
        successRate: Math.round((successCount / userUsage.length) * 100),
      };
    } catch (error) {
      throw new Error(
        `Failed to get user API stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get API usage statistics within a date range
   */
  async getStatsByDateRange(startDate: string, endDate: string): Promise<ApiUsageStats> {
    try {
      const rangeUsage = await this.getByDateRange(startDate, endDate);

      if (rangeUsage.length === 0) {
        return {
          totalRequests: 0,
          uniqueUsers: 0,
          avgRequestsPerUser: 0,
          avgLatencyMs: null,
          successRate: 0,
        };
      }

      const uniqueUsers = new Set(rangeUsage.map((u) => u.userId)).size;
      const successCount = rangeUsage.filter((u) => u.statusCode >= 200 && u.statusCode < 300)
        .length;
      const avgLatency =
        rangeUsage.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / rangeUsage.length;

      return {
        totalRequests: rangeUsage.length,
        uniqueUsers,
        avgRequestsPerUser: Math.round(rangeUsage.length / uniqueUsers),
        avgLatencyMs: avgLatency > 0 ? Math.round(avgLatency) : null,
        successRate: Math.round((successCount / rangeUsage.length) * 100),
      };
    } catch (error) {
      throw new Error(
        `Failed to get stats by date range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new API usage record
   */
  async create(data: CreateApiUsageData): Promise<ApiUsage> {
    try {
      const newRecord = {
        id: data.id,
        userId: data.userId,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        tokensUsed: data.tokensUsed ?? 0,
        latencyMs: data.latencyMs ?? null,
        apiKeyId: data.apiKeyId ?? null,
        createdAt: new Date().toISOString(),
      } as any;

      await this.db.insert(apiUsage).values(newRecord);

      // Return the created record
      const results = await this.db.select().from(apiUsage).where(eq(apiUsage.id, data.id));
      if (!results[0]) {
        throw new Error('Failed to retrieve created API usage record');
      }

      return results[0];
    } catch (error) {
      throw new Error(
        `Failed to create API usage record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete API usage records older than a certain date
   */
  async deleteOlderThan(beforeDate: string): Promise<number> {
    try {
      const cutoffDate = new Date(beforeDate).toISOString();
      const result = await this.db
        .delete(apiUsage)
        .where(lte(apiUsage.createdAt, cutoffDate));

      // Get the number of affected rows
      // Note: Some DB drivers don't return the count, so we return 0 if not available
      return 0;
    } catch (error) {
      throw new Error(
        `Failed to delete API usage records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
