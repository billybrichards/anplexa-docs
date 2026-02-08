import Anthropic from '@anthropic-ai/sdk';
import type {
  ITraitAnalysisService,
  PersonalitySummary,
} from '@anplexa/core/domain/services/ITraitAnalysisService';
import type { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';
import type { CompatibilityScores } from '@anplexa/core/domain/value-objects/astrology/CompatibilityResult';

/**
 * ClaudeTraitAnalysisService - Real AI-powered trait enrichment using Claude
 *
 * Implements ITraitAnalysisService using Anthropic's Claude API to:
 * - Enrich trait descriptions with insightful, personalized narratives
 * - Generate personality summaries based on full natal chart analysis
 * - Create compatibility narratives from synastry scores
 *
 * This service bridges the gap between mathematical astrology calculations
 * and human-readable insights, leveraging Claude's natural language abilities
 * to create compelling, accurate astrological narratives.
 */
export class ClaudeTraitAnalysisService implements ITraitAnalysisService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Enriches base trait definitions with AI-generated descriptions
   *
   * Takes mathematically-derived traits and adds compelling descriptions
   * that explain what each trait means for the individual's personality.
   *
   * @param chartData - Full natal chart context
   * @param baseTraits - Traits extracted from chart positions
   * @returns Enriched traits with AI-generated descriptions
   */
  async enrichTraitDescriptions(
    chartData: NatalChartData,
    baseTraits: TraitVisualization[]
  ): Promise<TraitVisualization[]> {
    const prompt = this.buildTraitEnrichmentPrompt(chartData, baseTraits);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    const enrichedData = this.parseTraitDescriptions(textContent.text, baseTraits);

    return baseTraits.map((trait, index) =>
      trait.withDescription(enrichedData[index].description)
    );
  }

  /**
   * Generates high-level personality summary from natal chart
   *
   * Synthesizes the chart's key elements (Sun, Moon, Rising, dominants)
   * into a cohesive personality narrative.
   *
   * @param chartData - Full natal chart
   * @param traits - Extracted trait visualizations
   * @returns Personality summary and elemental narrative
   */
  async generatePersonalitySummary(
    chartData: NatalChartData,
    traits: TraitVisualization[]
  ): Promise<PersonalitySummary> {
    const prompt = this.buildPersonalitySummaryPrompt(chartData, traits);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    return this.parsePersonalitySummary(textContent.text);
  }

  /**
   * Creates compatibility narrative from synastry scores
   *
   * Transforms mathematical compatibility scores into warm, insightful
   * narratives about relationship potential.
   *
   * @param userChart - User's natal chart
   * @param companionChart - Companion's natal chart
   * @param scores - Calculated compatibility scores
   * @returns Compatibility narrative
   */
  async generateCompatibilityNarrative(
    userChart: NatalChartData,
    companionChart: NatalChartData,
    scores: CompatibilityScores
  ): Promise<string> {
    const prompt = this.buildCompatibilityNarrativePrompt(userChart, companionChart, scores);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    return textContent.text.trim();
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Methods - Prompt Construction
  // ─────────────────────────────────────────────────────────────────

  private buildTraitEnrichmentPrompt(
    chartData: NatalChartData,
    traits: TraitVisualization[]
  ): string {
    return `You are an expert astrologer. Given these astrological traits extracted from a natal chart, write compelling 2-3 sentence descriptions for each trait.

Chart Context:
- Sun: ${chartData.planets.sun.sign.name} in House ${chartData.planets.sun.house}
- Moon: ${chartData.planets.moon.sign.name} in House ${chartData.planets.moon.house}
- Rising: ${chartData.ascendant?.name || 'Unknown'}

Traits to enrich:
${traits.map((t, i) => `${i + 1}. ${t.name} (from ${t.sourcePosition.planet} in ${t.sourcePosition.sign})`).join('\n')}

Return a JSON array of objects with format: [{"description": "..."}, ...]
Each description should be:
- Insightful and specific to the chart position
- Positive and empowering in tone
- Actionable where possible
- 2-3 sentences maximum

IMPORTANT: Return ONLY valid JSON, no additional text.`;
  }

  private buildPersonalitySummaryPrompt(
    chartData: NatalChartData,
    traits: TraitVisualization[]
  ): string {
    return `Based on this natal chart, write a personality summary (3-4 sentences) and elemental narrative (2-3 sentences).

Chart Details:
- Sun: ${chartData.planets.sun.sign.name} in House ${chartData.planets.sun.house}
- Moon: ${chartData.planets.moon.sign.name} in House ${chartData.planets.moon.house}
- Rising: ${chartData.ascendant?.name || 'Unknown'}
- Dominant Element: ${chartData.dominantElement}
- Dominant Modality: ${chartData.dominantModality}

Key Traits: ${traits.slice(0, 5).map((t) => t.name).join(', ')}

Return JSON: { "summary": "...", "elementalNarrative": "..." }

Summary should synthesize the Big Three (Sun, Moon, Rising) into a cohesive personality portrait.
Elemental narrative should explain how the dominant element shapes their approach to life.

IMPORTANT: Return ONLY valid JSON, no additional text.`;
  }

  private buildCompatibilityNarrativePrompt(
    userChart: NatalChartData,
    companionChart: NatalChartData,
    scores: CompatibilityScores
  ): string {
    return `Write a 3-4 sentence compatibility narrative for these two natal charts.

User Chart:
- Sun: ${userChart.planets.sun.sign.name}
- Moon: ${userChart.planets.moon.sign.name}
- Rising: ${userChart.ascendant?.name || 'Unknown'}

Companion Chart:
- Sun: ${companionChart.planets.sun.sign.name}
- Moon: ${companionChart.planets.moon.sign.name}
- Rising: ${companionChart.ascendant?.name || 'Unknown'}

Compatibility Scores:
- Overall: ${scores.overall}%
- Elemental Harmony: ${scores.elementalHarmony}%
- Modal Synergy: ${scores.modalSynergy}%
- Communication Alignment: ${scores.communicationAlignment}%
- Emotional Resonance: ${scores.emotionalResonance}%

Write a warm, insightful narrative that:
- Highlights the strengths of this pairing
- Acknowledges any complementary differences
- Focuses on growth potential and mutual understanding
- Maintains an encouraging, positive tone

Return plain text (not JSON), 3-4 sentences.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Methods - Response Parsing
  // ─────────────────────────────────────────────────────────────────

  private parseTraitDescriptions(
    response: string,
    baseTraits: TraitVisualization[]
  ): Array<{ description: string }> {
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      // Validate we have the right number of descriptions
      if (Array.isArray(parsed) && parsed.length === baseTraits.length) {
        return parsed;
      }

      throw new Error('Parsed response does not match expected structure');
    } catch (error) {
      console.error('Failed to parse trait descriptions from Claude:', error);
      // Fallback to generic descriptions
      return baseTraits.map((t) => ({
        description: `A ${t.category.toLowerCase()} trait reflecting your ${t.name.toLowerCase()}.`,
      }));
    }
  }

  private parsePersonalitySummary(response: string): PersonalitySummary {
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      if (parsed.summary && parsed.elementalNarrative) {
        return {
          summary: parsed.summary,
          elementalNarrative: parsed.elementalNarrative,
        };
      }

      throw new Error('Missing required fields in response');
    } catch (error) {
      console.error('Failed to parse personality summary from Claude:', error);
      return {
        summary:
          'You have a unique astrological profile with distinct personality dimensions that shape how you navigate the world.',
        elementalNarrative:
          'Your elemental balance creates a dynamic interplay of energies that influences your approach to challenges and opportunities.',
      };
    }
  }
}
