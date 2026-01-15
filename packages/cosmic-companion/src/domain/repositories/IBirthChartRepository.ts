/**
 * IBirthChartRepository
 *
 * Repository interface for BirthChart aggregate.
 * Defines persistence operations without implementation details.
 */

import { BirthChart } from '../entities/BirthChart.js';

export interface IBirthChartRepository {
  /**
   * Save a birth chart (create or update)
   */
  save(birthChart: BirthChart): Promise<void>;

  /**
   * Find birth chart by ID
   */
  findById(id: string): Promise<BirthChart | null>;

  /**
   * Find birth chart by user ID
   */
  findByUserId(userId: string): Promise<BirthChart | null>;

  /**
   * Delete a birth chart
   */
  delete(id: string): Promise<void>;
}
