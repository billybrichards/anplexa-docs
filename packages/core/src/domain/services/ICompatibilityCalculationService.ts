/**
 * ICompatibilityCalculationService - Domain Interface
 *
 * Pure logic service interface for calculating astrological compatibility between two charts.
 * No external dependencies - operates only on domain value objects.
 *
 * Implements synastry analysis using:
 * - Elemental harmony (fire/earth/air/water compatibility)
 * - Modal synergy (cardinal/fixed/mutable dynamics)
 * - Inter-chart aspects (Sun-Moon, Venus-Mars, Mercury-Mercury, etc.)
 * - House overlays (how one person's planets fall in another's houses)
 */

import type { NatalChartData } from '../value-objects/astrology/NatalChartData.js';
import type { CompatibilityScores } from '../value-objects/astrology/CompatibilityResult.js';

/**
 * Detailed compatibility breakdown
 */
export interface CompatibilityBreakdown {
  /** Numeric compatibility scores (0-100) */
  scores: CompatibilityScores;

  /** Key strengths in the relationship */
  strengths: string[];

  /** Potential challenges to be aware of */
  challenges: string[];

  /** Advice for navigating the relationship */
  advice: string[];
}

/**
 * ICompatibilityCalculationService Interface
 *
 * Domain interface for deterministic compatibility calculation.
 * Implementations must be pure (no side effects) and deterministic
 * (same input always produces same output).
 */
export interface ICompatibilityCalculationService {
  /**
   * Calculate compatibility between two natal charts
   *
   * Analyzes:
   * - Element compatibility (same/trine/square/opposition)
   * - Modality dynamics (cardinal/fixed/mutable interactions)
   * - Communication (Mercury-Mercury aspects)
   * - Emotional resonance (Moon-Moon aspects)
   * - Romantic chemistry (Venus-Mars cross-aspects)
   * - Life goals (Sun-Sun aspects)
   *
   * @param chart1 - First person's natal chart
   * @param chart2 - Second person's natal chart
   * @returns Compatibility breakdown with scores and insights
   */
  calculateCompatibility(
    chart1: NatalChartData,
    chart2: NatalChartData
  ): Promise<CompatibilityBreakdown>;
}
