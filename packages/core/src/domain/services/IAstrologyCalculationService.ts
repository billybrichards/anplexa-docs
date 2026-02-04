/**
 * Astrology Calculation Service Interface
 *
 * Domain service interface for natal chart calculations.
 * Implementation lives in infrastructure layer (services package).
 */

import type { BirthData } from '../value-objects/astrology/BirthData';
import type { NatalChartData } from '../value-objects/astrology/NatalChartData';

export interface CalculationOptions {
  houseSystem?: 'placidus' | 'whole_sign' | 'koch' | 'equal';
  includeMinorAspects?: boolean;
  includeAsteroids?: boolean;
}

export interface IAstrologyCalculationService {
  /**
   * Calculate complete natal chart from birth data
   */
  calculateNatalChart(
    birthData: BirthData,
    options?: CalculationOptions
  ): Promise<NatalChartData>;

  /**
   * Generate human-readable interpretation
   */
  generateInterpretation(chartData: NatalChartData): Promise<string>;

  /**
   * Generate AI companion system prompt context
   */
  generateCompanionContext(chartData: NatalChartData): Promise<string>;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}
