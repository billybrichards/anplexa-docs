/**
 * Activity Log Repository Interface
 *
 * Defines the contract for activity log data access operations.
 * Supports both frontend event ingestion and backend request logging.
 */

import type { ActivityLog } from '@anplexa/database';

export interface CreateActivityLogData {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  eventName: string;
  source: 'frontend' | 'backend';
  requestId?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  metadata?: string | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
}

export interface ActivityLogQuery {
  userId?: string;
  sessionId?: string;
  eventType?: string;
  source?: 'frontend' | 'backend';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface IActivityLogRepository {
  create(data: CreateActivityLogData): Promise<ActivityLog>;

  createBatch(data: CreateActivityLogData[]): Promise<void>;

  query(filters: ActivityLogQuery): Promise<ActivityLog[]>;

  getByRequestId(requestId: string): Promise<ActivityLog[]>;

  getUserJourney(userId: string, startDate?: string, endDate?: string): Promise<ActivityLog[]>;

  deleteOlderThan(beforeDate: string): Promise<number>;
}
