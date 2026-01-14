/**
 * API Usage Domain Entity
 *
 * Represents an API usage event in the Anplexa system.
 * Tracks individual API requests made by users for analytics and monitoring.
 */

export class ApiUsage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly endpoint: string,
    public readonly method: string,
    public readonly statusCode: number,
    public readonly tokensUsed: number = 0,
    public readonly latencyMs: number | null = null,
    public readonly apiKeyId: string | null = null,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Check if the request was successful (2xx status code)
   */
  isSuccessful(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  /**
   * Check if the request failed (4xx or 5xx status code)
   */
  hasFailed(): boolean {
    return this.statusCode >= 400;
  }

  /**
   * Create a new ApiUsage instance
   */
  static create(data: {
    id: string;
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    tokensUsed?: number;
    latencyMs?: number | null;
    apiKeyId?: string | null;
    createdAt?: Date;
  }): ApiUsage {
    return new ApiUsage(
      data.id,
      data.userId,
      data.endpoint,
      data.method,
      data.statusCode,
      data.tokensUsed ?? 0,
      data.latencyMs ?? null,
      data.apiKeyId ?? null,
      data.createdAt ?? new Date()
    );
  }
}
