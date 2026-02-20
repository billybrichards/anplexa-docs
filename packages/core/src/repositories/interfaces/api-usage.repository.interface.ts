/**
 * API Usage Repository Interface
 *
 * Defines the contract for API usage data access operations.
 * Part of the Clean Architecture repository pattern.
 */

import type { ApiUsage } from '@anplexa/database';

export interface CreateApiUsageData {
  id: string;
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  tokensUsed?: number;
  latencyMs?: number | null;
  apiKeyId?: string | null;
}

export interface ApiUsageStats {
  totalRequests: number;
  uniqueUsers: number;
  avgRequestsPerUser: number;
  avgLatencyMs: number | null;
  successRate: number;
}

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface IApiUsageRepository {
  /**
   * Get all API usage records
   */
  getAll(): Promise<ApiUsage[]>;

  /**
   * Get API usage records by user ID
   * @param userId - The user ID to filter by
   */
  getByUserId(userId: string): Promise<ApiUsage[]>;

  /**
   * Get API usage records within a date range
   * @param startDate - Start date in ISO format (YYYY-MM-DD or ISO 8601)
   * @param endDate - End date in ISO format (YYYY-MM-DD or ISO 8601)
   */
  getByDateRange(startDate: string, endDate: string): Promise<ApiUsage[]>;

  /**
   * Get API usage records by endpoint
   * @param endpoint - The endpoint path to filter by
   */
  getByEndpoint(endpoint: string): Promise<ApiUsage[]>;

  /**
   * Get API usage statistics
   * Returns aggregated metrics across all usage records
   */
  getUsageStats(): Promise<ApiUsageStats>;

  /**
   * Get API usage statistics for a specific user
   * @param userId - The user ID to get stats for
   */
  getUserStats(userId: string): Promise<ApiUsageStats>;

  /**
   * Get API usage statistics within a date range
   * @param startDate - Start date in ISO format
   * @param endDate - End date in ISO format
   */
  getStatsByDateRange(startDate: string, endDate: string): Promise<ApiUsageStats>;

  /**
   * Create a new API usage record
   * @param data - API usage creation data
   */
  create(data: CreateApiUsageData): Promise<ApiUsage>;

  /**
   * Delete API usage records older than a certain date
   * @param beforeDate - Date in ISO format; records before this date will be deleted
   */
  deleteOlderThan(beforeDate: string): Promise<number>;
}
