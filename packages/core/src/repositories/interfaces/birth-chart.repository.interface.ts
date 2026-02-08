/**
 * Birth Chart Repository Interface
 *
 * Defines the contract for persisting and retrieving BirthChart aggregates.
 * Implementation lives in the infrastructure layer.
 */

import type { BirthChart } from '../../domain/entities/BirthChart.js';
import type { BirthData } from '../../domain/value-objects/astrology/BirthData.js';
import type { NatalChartData } from '../../domain/value-objects/astrology/NatalChartData.js';

export interface CreateBirthChartData {
  id: string;
  userId: string;
  birthData: BirthData;
  chartData: NatalChartData;
  displayName?: string;
  isActive?: boolean;
}

export interface UpdateBirthChartData {
  chartData?: NatalChartData;
  displayName?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface IBirthChartRepository {
  /**
   * Get a birth chart by ID
   */
  getById(id: string): Promise<BirthChart | null>;

  /**
   * Get the first birth chart for a user (for simple cases)
   */
  getByUserId(userId: string): Promise<BirthChart | null>;

  /**
   * Get the active birth chart for a user
   */
  getActiveByUserId(userId: string): Promise<BirthChart | null>;

  /**
   * Get all birth charts for a user (supports pagination)
   */
  getAllByUserId(userId: string, options?: PaginationOptions): Promise<BirthChart[]>;

  /**
   * Check if a user has any birth charts
   */
  exists(userId: string): Promise<boolean>;

  /**
   * Create a new birth chart
   */
  create(data: CreateBirthChartData): Promise<BirthChart>;

  /**
   * Update an existing birth chart
   */
  update(id: string, data: UpdateBirthChartData): Promise<BirthChart>;

  /**
   * Delete a birth chart
   */
  delete(id: string): Promise<void>;

  /**
   * Deactivate all charts for a user
   */
  deactivateAllForUser(userId: string): Promise<void>;

  /**
   * Set a specific chart as active (deactivates others)
   */
  setActiveChart(userId: string, chartId: string): Promise<void>;
}
