/**
 * API Client Adapter
 *
 * Centralized HTTP client for all API communications.
 * This adapter enforces a single entry point for all fetch operations,
 * making it easy to:
 * - Add authentication headers
 * - Handle errors globally
 * - Mock for testing
 * - Add logging/monitoring
 * - Correlate requests via X-Request-ID
 */

import { activityLogger } from '@/lib/analytics';

export interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * API Client class
 *
 * Provides a clean interface for making HTTP requests to the API.
 * All requests go through this client to ensure consistent error handling
 * and authentication.
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = (options?.baseUrl || '/api').replace(/\/+$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  }

  /**
   * Make an HTTP request
   * @param endpoint - API endpoint path (e.g., '/chat/send')
   * @param config - Request configuration
   * @returns Promise resolving to the response data
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = config.method || 'GET';

    const requestId = typeof crypto !== 'undefined'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
        'X-Request-ID': requestId,
      },
      signal: config.signal,
    };

    // Add body for methods that support it
    if (config.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(config.body);
    }

    const startTime = Date.now();

    try {
      const response = await fetch(url, fetchOptions);
      const durationMs = Date.now() - startTime;

      // Log the API call (skip logging the logs endpoint itself)
      if (!endpoint.startsWith('/logs')) {
        activityLogger.trackApiCall({
          requestId,
          method,
          path: endpoint,
          statusCode: response.status,
          durationMs,
        });
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = errorData.error || response.statusText;
        const code = errorData.code || `HTTP_${response.status}`;

        throw new ApiError(error, code, response.status);
      }

      // Parse and return response
      if (response.status === 204) {
        // No content
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Re-throw API errors as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Log network errors
      if (!endpoint.startsWith('/logs')) {
        activityLogger.trackApiCall({
          requestId,
          method,
          path: endpoint,
          durationMs,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Wrap other errors
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(message, 'NETWORK_ERROR');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', signal });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, signal });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, signal });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, signal });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', signal });
  }

  /**
   * Set default headers (e.g., for authentication)
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove a default header
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Get current default headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global API client instance
 * Used throughout the application for all API calls
 */
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
});
