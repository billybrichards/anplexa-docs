/**
 * Activity Log Repository Implementation
 *
 * Implements the IActivityLogRepository interface using Drizzle ORM.
 * Handles activity log storage for both frontend events and backend requests.
 */

import type { Database } from '@anplexa/database';
import { activityLogs, type ActivityLog, eq, and, gte, lte, desc, asc } from '@anplexa/database';
import type {
  IActivityLogRepository,
  CreateActivityLogData,
  ActivityLogQuery,
} from './interfaces/activity-log.repository.interface.js';

export class ActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly db: Database) {}

  async create(data: CreateActivityLogData): Promise<ActivityLog> {
    const record = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    await this.db.insert(activityLogs).values(record);

    const results = await this.db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.id, data.id));

    if (!results[0]) {
      throw new Error('Failed to retrieve created activity log record');
    }

    return results[0];
  }

  async createBatch(data: CreateActivityLogData[]): Promise<void> {
    if (data.length === 0) return;

    const records = data.map((d) => ({
      ...d,
      createdAt: new Date().toISOString(),
    }));

    await this.db.insert(activityLogs).values(records);
  }

  async query(filters: ActivityLogQuery): Promise<ActivityLog[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters.sessionId) {
      conditions.push(eq(activityLogs.sessionId, filters.sessionId));
    }
    if (filters.eventType) {
      conditions.push(eq(activityLogs.eventType, filters.eventType));
    }
    if (filters.source) {
      conditions.push(eq(activityLogs.source, filters.source));
    }
    if (filters.startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(filters.startDate).toISOString()));
    }
    if (filters.endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(filters.endDate).toISOString()));
    }

    const query = this.db
      .select()
      .from(activityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(filters.limit ?? 100)
      .offset(filters.offset ?? 0);

    return await query;
  }

  async getByRequestId(requestId: string): Promise<ActivityLog[]> {
    return await this.db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.requestId, requestId))
      .orderBy(asc(activityLogs.createdAt));
  }

  async getUserJourney(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityLog[]> {
    const conditions = [eq(activityLogs.userId, userId)];

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(startDate).toISOString()));
    }
    if (endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(endDate).toISOString()));
    }

    return await this.db
      .select()
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(asc(activityLogs.createdAt));
  }

  async deleteOlderThan(beforeDate: string): Promise<number> {
    const cutoffDate = new Date(beforeDate).toISOString();
    await this.db
      .delete(activityLogs)
      .where(lte(activityLogs.createdAt, cutoffDate));
    return 0;
  }
}
