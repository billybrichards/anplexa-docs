/**
 * Mock Trait Analysis Service
 *
 * Temporary mock implementation of ITraitAnalysisService for testing and development.
 * This should be replaced with ClaudeTraitAnalysisService or OllamaTraitAnalysisService
 * when AI integration is complete.
 *
 * Returns placeholder descriptions instead of making actual AI calls.
 */

import type {
  ITraitAnalysisService,
  PersonalitySummary,
  CompatibilityScores,
} from '@anplexa/core/domain/services/ITraitAnalysisService';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';
import type { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';

/**
 * MockTraitAnalysisService
 *
 * Simple mock implementation that returns basic trait descriptions.
 * Used as a fallback when no AI service is configured.
 */
export class MockTraitAnalysisService implements ITraitAnalysisService {
  /**
   * Enrich traits with placeholder descriptions
   */
  async enrichTraitDescriptions(
    _chartData: NatalChartData,
    baseTraits: TraitVisualization[]
  ): Promise<TraitVisualization[]> {
    // Add simple descriptions to each trait
    return baseTraits.map((trait) =>
      trait.withDescription(
        trait.description ||
          `This trait represents ${trait.name.toLowerCase()} influenced by your astrological placements. ` +
            `It has a strength of ${trait.strength.toFixed(0)} and falls under the ${trait.category} category.`
      )
    );
  }

  /**
   * Generate a basic personality summary
   */
  async generatePersonalitySummary(
    _chartData: NatalChartData,
    traits: TraitVisualization[]
  ): Promise<PersonalitySummary> {
    const dominantTraits = traits
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map((t) => t.name);

    const summary = `Your personality is characterized by ${dominantTraits.join(', ')}. ` +
      `With ${traits.length} distinct personality traits derived from your birth chart, ` +
      `you have a unique blend of qualities that shape who you are.`;

    const elementalNarrative =
      `Your astrological chart shows a balance of elemental energies. ` +
      `These elements work together to create your distinctive personality and approach to life.`;

    return {
      summary,
      elementalNarrative,
    };
  }

  /**
   * Generate a basic compatibility narrative
   */
  async generateCompatibilityNarrative(
    _userChart: NatalChartData,
    _companionChart: NatalChartData,
    scores: CompatibilityScores
  ): Promise<string> {
    const overallLevel =
      scores.overall >= 80
        ? 'excellent'
        : scores.overall >= 65
          ? 'high'
          : scores.overall >= 50
            ? 'moderate'
            : 'developing';

    return (
      `Your compatibility shows ${overallLevel} potential for connection. ` +
      `Elemental harmony: ${scores.elementalHarmony.toFixed(0)}%, ` +
      `Communication alignment: ${scores.communicationAlignment.toFixed(0)}%, ` +
      `Emotional resonance: ${scores.emotionalResonance.toFixed(0)}%. ` +
      `This combination suggests a relationship with both strengths and areas for growth.`
    );
  }
}
