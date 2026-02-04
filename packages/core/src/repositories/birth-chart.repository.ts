/**
 * Birth Chart Repository Implementation
 *
 * Implements IBirthChartRepository using Drizzle ORM.
 * Stores birth charts with JSON-serialized value objects.
 */

import type { Database } from '@anplexa/database';
import { birthCharts, eq, and, desc } from '@anplexa/database';
import type { IBirthChartRepository, CreateBirthChartData, UpdateBirthChartData, PaginationOptions } from './interfaces/birth-chart.repository.interface';
import { BirthChart } from '../domain/entities/BirthChart';
import { BirthData } from '../domain/value-objects/astrology/BirthData';
import { NatalChartData } from '../domain/value-objects/astrology/NatalChartData';

export class BirthChartRepository implements IBirthChartRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<BirthChart | null> {
    const result = await this.db
      .select()
      .from(birthCharts)
      .where(eq(birthCharts.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async getByUserId(userId: string): Promise<BirthChart | null> {
    const result = await this.db
      .select()
      .from(birthCharts)
      .where(eq(birthCharts.userId, userId))
      .orderBy(desc(birthCharts.createdAt))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async getActiveByUserId(userId: string): Promise<BirthChart | null> {
    const result = await this.db
      .select()
      .from(birthCharts)
      .where(and(eq(birthCharts.userId, userId), eq(birthCharts.isActive, true)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async getAllByUserId(userId: string, options?: PaginationOptions): Promise<BirthChart[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const results = await this.db
      .select()
      .from(birthCharts)
      .where(eq(birthCharts.userId, userId))
      .orderBy(desc(birthCharts.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((row) => this.toDomain(row));
  }

  async exists(userId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: birthCharts.id })
      .from(birthCharts)
      .where(eq(birthCharts.userId, userId))
      .limit(1);

    return result.length > 0;
  }

  async create(data: CreateBirthChartData): Promise<BirthChart> {
    const now = new Date().toISOString();

    const insertData = {
      id: data.id,
      userId: data.userId,
      birthData: JSON.stringify(data.birthData),
      chartData: JSON.stringify(data.chartData),
      displayName: data.displayName ?? null,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.db
      .insert(birthCharts)
      .values(insertData)
      .returning();

    return this.toDomain(result[0]);
  }

  async update(id: string, data: UpdateBirthChartData): Promise<BirthChart> {
    const now = new Date().toISOString();

    const updateData: any = {
      updatedAt: now,
    };

    if (data.chartData !== undefined) {
      updateData.chartData = JSON.stringify(data.chartData);
    }
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const result = await this.db
      .update(birthCharts)
      .set(updateData)
      .where(eq(birthCharts.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Birth chart with id ${id} not found`);
    }

    return this.toDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(birthCharts).where(eq(birthCharts.id, id));
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.db
      .update(birthCharts)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(birthCharts.userId, userId));
  }

  async setActiveChart(userId: string, chartId: string): Promise<void> {
    // First deactivate all charts for user
    await this.deactivateAllForUser(userId);

    // Then activate the specified chart
    await this.db
      .update(birthCharts)
      .set({ isActive: true, updatedAt: new Date().toISOString() })
      .where(eq(birthCharts.id, chartId));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: any): BirthChart {
    const birthDataJson = typeof row.birthData === 'string' ? JSON.parse(row.birthData) : row.birthData;
    const chartDataJson = typeof row.chartData === 'string' ? JSON.parse(row.chartData) : row.chartData;

    return BirthChart.fromPersistence({
      id: row.id,
      userId: row.userId,
      birthData: BirthData.fromJSON(birthDataJson),
      chartData: NatalChartData.fromJSON(chartDataJson),
      displayName: row.displayName,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}
