/**
 * ITraitExtractionService - Domain Interface
 *
 * Pure logic service interface for extracting personality traits from natal chart data.
 * No external dependencies - operates only on domain value objects.
 *
 * Implementations use deterministic algorithms based on:
 * - Planet-sign combinations
 * - House placements
 * - Planetary dignities (rulership, exaltation, etc.)
 * - Major aspects between planets
 */

import type { NatalChartData } from '../value-objects/astrology/NatalChartData.js';
import type { TraitVisualization } from '../value-objects/astrology/TraitVisualization.js';
import type { Element, Modality } from '../value-objects/astrology/ZodiacSign.js';

/**
 * Elemental balance in the chart
 */
export interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

/**
 * Modal balance in the chart
 */
export interface ModalBalance {
  cardinal: number;
  fixed: number;
  mutable: number;
}

/**
 * Dominant planets by strength
 */
export interface DominantPlanets {
  primary: string;
  secondary: string;
  tertiary: string;
}

/**
 * Result of trait extraction
 */
export interface TraitExtractionResult {
  /** Extracted personality traits with positions and strengths */
  traits: TraitVisualization[];

  /** Elemental distribution in the chart */
  elementalBalance: ElementalBalance;

  /** Modal distribution in the chart */
  modalBalance: ModalBalance;

  /** Three most influential planets */
  dominantPlanets: DominantPlanets;
}

/**
 * ITraitExtractionService Interface
 *
 * Domain interface for deterministic trait extraction from birth charts.
 * Implementations must be pure (no side effects) and deterministic
 * (same input always produces same output).
 */
export interface ITraitExtractionService {
  /**
   * Extract personality traits from a natal chart
   *
   * Uses astrological algorithms to:
   * - Identify 1-2 core traits per planet placement
   * - Calculate trait strength based on dignities, houses, and aspects
   * - Assign ecliptic coordinates for 3D visualization
   * - Categorize traits by planet type (identity, emotional, mental, etc.)
   *
   * @param chartData - The natal chart data to analyze
   * @returns Trait extraction result with traits and astrological metadata
   */
  extractTraits(chartData: NatalChartData): Promise<TraitExtractionResult>;
}
