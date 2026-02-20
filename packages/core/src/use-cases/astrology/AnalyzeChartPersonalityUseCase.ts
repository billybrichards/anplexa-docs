import type { ITraitExtractionService } from '../../domain/services/ITraitExtractionService.js';
import type { ITraitAnalysisService } from '../../domain/services/ITraitAnalysisService.js';
import { TraitProfile, type TraitProfileProps } from '../../domain/value-objects/astrology/TraitProfile.js';
import type { NatalChartData } from '../../domain/value-objects/astrology/NatalChartData.js';
import type { TraitVisualization } from '../../domain/value-objects/astrology/TraitVisualization.js';

/**
 * Input DTO for AnalyzeChartPersonalityUseCase
 */
export interface AnalyzeChartPersonalityInput {
  chartData: NatalChartData;
  userId: string;
  birthChartId: string;
}

/**
 * Output DTO for AnalyzeChartPersonalityUseCase
 */
export interface AnalyzeChartPersonalityOutput {
  traitProfile: TraitProfile;
}

/**
 * AnalyzeChartPersonalityUseCase - Orchestrates trait extraction and AI enrichment
 *
 * This use case coordinates the personality analysis pipeline:
 * 1. Extract base traits from planetary positions (logic-based)
 * 2. Enrich traits with AI-generated descriptions
 * 3. Generate overall personality summary
 * 4. Identify dominant traits
 * 5. Create elemental narrative
 *
 * The result is a comprehensive TraitProfile that powers the 3D trait globe
 * visualization and provides deep personality insights.
 *
 * Architecture:
 * - Uses TraitExtractionService for mathematical trait derivation
 * - Uses ITraitAnalysisService (Claude) for AI enrichment
 * - Returns immutable TraitProfile value object
 */
export class AnalyzeChartPersonalityUseCase {
  constructor(
    private readonly traitExtractionService: ITraitExtractionService,
    private readonly traitAnalysisService: ITraitAnalysisService
  ) {}

  async execute(input: AnalyzeChartPersonalityInput): Promise<AnalyzeChartPersonalityOutput> {
    const { chartData, userId, birthChartId } = input;

    // Step 1: Extract base traits using pure astrological logic
    // This uses house positions, planetary dignity, aspect patterns, etc.
    const extractionResult = await this.traitExtractionService.extractTraits(chartData);
    const baseTraits = extractionResult.traits;

    // Step 2: Enrich traits with AI-generated descriptions
    // Transforms mathematical positions into human-readable insights
    const enrichedTraits = await this.traitAnalysisService.enrichTraitDescriptions(
      chartData,
      baseTraits
    );

    // Step 3: Generate personality summary and elemental narrative
    // Creates high-level synthesis of the chart's key themes
    const personalitySummaryResult =
      await this.traitAnalysisService.generatePersonalitySummary(chartData, enrichedTraits);

    // Step 4: Select dominant traits (top 3-5 by strength)
    const dominantTraitIds = this.selectDominantTraits(enrichedTraits);

    // Step 5: Build TraitProfile value object
    const traitProfileProps: TraitProfileProps = {
      userId,
      birthChartId,
      traits: enrichedTraits,
      personalitySummary: personalitySummaryResult.summary,
      dominantTraits: dominantTraitIds,
      elementalNarrative: personalitySummaryResult.elementalNarrative,
      generatedAt: new Date(),
    };

    const traitProfile = TraitProfile.create(traitProfileProps);

    return {
      traitProfile,
    };
  }

  /**
   * Selects the most dominant traits from the full set
   *
   * Uses strength score to identify the traits that have the strongest
   * influence on the personality. These are highlighted in the UI.
   *
   * @param traits - All extracted traits
   * @returns Top 3-5 dominant trait IDs
   */
  private selectDominantTraits(traits: TraitVisualization[]): string[] {
    // Sort by strength (descending)
    const sorted = [...traits].sort((a, b) => b.strength - a.strength);

    // Take top 5, but require strength > 70 for inclusion
    const dominant = sorted.filter((t) => t.strength > 70).slice(0, 5);

    // If we have fewer than 3 high-strength traits, just take top 3
    if (dominant.length < 3) {
      return sorted.slice(0, 3).map((t) => t.id);
    }

    return dominant.map((t) => t.id);
  }
}
