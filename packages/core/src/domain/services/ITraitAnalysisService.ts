/**
 * ITraitAnalysisService - Domain Interface
 *
 * AI-powered service for enriching astrological traits with interpretive descriptions.
 *
 * KEY PRINCIPLE: AI enriches but doesn't determine traits.
 * - Trait structure (positions, strengths, categories) comes from TraitExtractionService (pure math)
 * - AI only adds descriptive, interpretive text to make traits more meaningful to users
 *
 * This keeps the domain clean: logic determines structure, AI adds narrative.
 */

import type { TraitVisualization } from '../value-objects/astrology/TraitVisualization.js';
import type { NatalChartData } from '../value-objects/astrology/NatalChartData.js';
import type { CompatibilityScores } from '../value-objects/astrology/CompatibilityResult.js';

// Re-export CompatibilityScores for convenience
export type { CompatibilityScores } from '../value-objects/astrology/CompatibilityResult.js';

/**
 * Personality summary with elemental narrative
 */
export interface PersonalitySummary {
  /** 2-3 paragraph summary of the personality based on traits */
  summary: string;

  /** Narrative about how the elemental balance shapes the personality */
  elementalNarrative: string;
}

/**
 * ITraitAnalysisService Interface
 *
 * Domain interface for AI-powered trait enrichment and analysis.
 * Implementations use different AI providers (Claude, Ollama) but all
 * follow the same contract.
 */
export interface ITraitAnalysisService {
  /**
   * Enrich base traits with AI-generated descriptions
   *
   * Takes traits with their positions, strengths, and categories (from TraitExtractionService)
   * and adds interpretive descriptions that explain what the trait means for the person.
   *
   * @param chartData - The natal chart providing astrological context
   * @param baseTraits - Base traits from TraitExtractionService
   * @returns Traits with enriched descriptions
   */
  enrichTraitDescriptions(
    chartData: NatalChartData,
    baseTraits: TraitVisualization[]
  ): Promise<TraitVisualization[]>;

  /**
   * Generate a comprehensive personality summary based on enriched traits
   *
   * Creates a cohesive narrative that synthesizes all traits into an overall
   * personality description, including elemental balance interpretation.
   *
   * @param chartData - The natal chart data
   * @param traits - Enriched traits with AI descriptions
   * @returns Personality summary with elemental narrative
   */
  generatePersonalitySummary(
    chartData: NatalChartData,
    traits: TraitVisualization[]
  ): Promise<PersonalitySummary>;

  /**
   * Generate a compatibility narrative between two charts
   *
   * Takes compatibility scores (from CompatibilityCalculationService) and creates a
   * narrative description of relationship dynamics, strengths, and challenges.
   *
   * @param userChart - User's natal chart
   * @param companionChart - Companion's natal chart
   * @param scores - Compatibility scores from CompatibilityCalculationService
   * @returns Narrative explanation of compatibility
   */
  generateCompatibilityNarrative(
    userChart: NatalChartData,
    companionChart: NatalChartData,
    scores: CompatibilityScores
  ): Promise<string>;
}
