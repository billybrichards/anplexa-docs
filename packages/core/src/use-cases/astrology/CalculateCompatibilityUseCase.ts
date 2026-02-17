import type { ICompatibilityCalculationService } from '../../domain/services/ICompatibilityCalculationService.js';
import type { ITraitAnalysisService } from '../../domain/services/ITraitAnalysisService.js';
import {
  CompatibilityResult,
  type CompatibilityResultProps,
} from '../../domain/value-objects/astrology/CompatibilityResult.js';
import type { NatalChartData } from '../../domain/value-objects/astrology/NatalChartData.js';

/**
 * Input DTO for CalculateCompatibilityUseCase
 */
export interface CalculateCompatibilityInput {
  userChart: NatalChartData;
  companionChart: NatalChartData;
  userId: string;
  companionPersonaId: string;
}

/**
 * Output DTO for CalculateCompatibilityUseCase
 */
export interface CalculateCompatibilityOutput {
  compatibilityResult: CompatibilityResult;
}

/**
 * CalculateCompatibilityUseCase - Orchestrates compatibility analysis
 *
 * This use case coordinates the synastry analysis pipeline:
 * 1. Calculate mathematical compatibility scores (elemental harmony, aspect patterns, etc.)
 * 2. Extract synastry highlights (key aspects between charts)
 * 3. Generate AI-powered compatibility narrative
 *
 * The result is a comprehensive CompatibilityResult that explains how two
 * natal charts interact and what that means for relationship dynamics.
 *
 * Architecture:
 * - Uses CompatibilityCalculationService for pure math/logic
 * - Uses ITraitAnalysisService (Claude) for narrative generation
 * - Returns immutable CompatibilityResult value object
 */
export class CalculateCompatibilityUseCase {
  constructor(
    private readonly compatibilityCalculationService: ICompatibilityCalculationService,
    private readonly traitAnalysisService: ITraitAnalysisService
  ) {}

  async execute(input: CalculateCompatibilityInput): Promise<CalculateCompatibilityOutput> {
    const { userChart, companionChart, userId, companionPersonaId } = input;

    // Step 1: Calculate compatibility breakdown (pure mathematics)
    // Analyzes elemental balance, modality harmony, Sun-Moon synastry, etc.
    const compatibilityBreakdown =
      await this.compatibilityCalculationService.calculateCompatibility(userChart, companionChart);

    // Step 2: Generate AI narrative
    // Transforms scores and strengths/challenges into warm, insightful relationship narrative
    const narrative = await this.traitAnalysisService.generateCompatibilityNarrative(
      userChart,
      companionChart,
      compatibilityBreakdown.scores
    );

    // Step 3: Build CompatibilityResult value object
    // Use strengths from compatibility breakdown as synastry highlights
    const compatibilityResultProps: CompatibilityResultProps = {
      userId,
      companionPersonaId,
      scores: compatibilityBreakdown.scores,
      synastryHighlights: compatibilityBreakdown.strengths,
      narrative,
      calculatedAt: new Date(),
    };

    const compatibilityResult = CompatibilityResult.create(compatibilityResultProps);

    return {
      compatibilityResult,
    };
  }
}
