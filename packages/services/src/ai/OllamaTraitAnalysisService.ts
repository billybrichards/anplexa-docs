import type {
  ITraitAnalysisService,
  PersonalitySummary,
} from '@anplexa/core/domain/services/ITraitAnalysisService';
import type { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';
import type { CompatibilityScores } from '@anplexa/core/domain/value-objects/astrology/CompatibilityResult';

/**
 * OllamaTraitAnalysisService - Trait enrichment using Ollama (ssh6 / qwen3.5)
 *
 * Fallback when Anthropic API is unavailable. Uses OpenAI-compatible
 * /v1/chat/completions endpoint exposed by Ollama.
 */
export class OllamaTraitAnalysisService implements ITraitAnalysisService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
  }

  private async chatCompletion(prompt: string, maxTokens: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as any;
    const choice = data.choices?.[0]?.message;

    // qwen3.5 uses thinking mode — content may be empty if max_tokens too low
    // Prefer content, fall back to extracting from reasoning
    if (choice?.content) {
      return choice.content;
    }

    // If content is empty but reasoning exists, the model ran out of tokens
    // during thinking. Try to extract any JSON from reasoning.
    if (choice?.reasoning) {
      const jsonMatch = choice.reasoning.match(/```json\s*([\s\S]*?)```/) ||
                        choice.reasoning.match(/(\{[\s\S]*\})/) ||
                        choice.reasoning.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        return jsonMatch[1].trim();
      }
    }

    throw new Error('No usable content in Ollama response');
  }

  async enrichTraitDescriptions(
    chartData: NatalChartData,
    baseTraits: TraitVisualization[]
  ): Promise<TraitVisualization[]> {
    const prompt = `You are an expert astrologer. Given these astrological traits extracted from a natal chart, write compelling 2-3 sentence descriptions for each trait.

Chart Context:
- Sun: ${chartData.planets.sun.sign.name} in House ${chartData.planets.sun.house}
- Moon: ${chartData.planets.moon.sign.name} in House ${chartData.planets.moon.house}
- Rising: ${chartData.ascendant?.name || 'Unknown'}

Traits to enrich:
${baseTraits.map((t, i) => `${i + 1}. ${t.name} (from ${t.sourcePosition.planet} in ${t.sourcePosition.sign})`).join('\n')}

Return a JSON array of objects with format: [{"description": "..."}, ...]
Each description should be insightful, positive, and 2-3 sentences maximum.

IMPORTANT: Return ONLY valid JSON, no additional text.`;

    try {
      const text = await this.chatCompletion(prompt, 4000);
      const enrichedData = this.parseTraitDescriptions(text, baseTraits);
      return baseTraits.map((trait, index) =>
        trait.withDescription(enrichedData[index].description)
      );
    } catch (error) {
      console.error('[OllamaTraitAnalysis] enrichTraitDescriptions failed:', error);
      return baseTraits.map((t) =>
        t.withDescription(`A ${t.category.toLowerCase()} trait reflecting your ${t.name.toLowerCase()}.`)
      );
    }
  }

  async generatePersonalitySummary(
    chartData: NatalChartData,
    traits: TraitVisualization[]
  ): Promise<PersonalitySummary> {
    const prompt = `Based on this natal chart, write a personality summary (3-4 sentences) and elemental narrative (2-3 sentences).

Chart Details:
- Sun: ${chartData.planets.sun.sign.name} in House ${chartData.planets.sun.house}
- Moon: ${chartData.planets.moon.sign.name} in House ${chartData.planets.moon.house}
- Rising: ${chartData.ascendant?.name || 'Unknown'}
- Dominant Element: ${chartData.dominantElement}
- Dominant Modality: ${chartData.dominantModality}

Key Traits: ${traits.slice(0, 5).map((t) => t.name).join(', ')}

Return JSON: { "summary": "...", "elementalNarrative": "..." }

IMPORTANT: Return ONLY valid JSON, no additional text.`;

    try {
      const text = await this.chatCompletion(prompt, 4000);
      return this.parsePersonalitySummary(text);
    } catch (error) {
      console.error('[OllamaTraitAnalysis] generatePersonalitySummary failed:', error);
      return {
        summary: 'You have a unique astrological profile with distinct personality dimensions that shape how you navigate the world.',
        elementalNarrative: 'Your elemental balance creates a dynamic interplay of energies that influences your approach to challenges and opportunities.',
      };
    }
  }

  async generateCompatibilityNarrative(
    userChart: NatalChartData,
    companionChart: NatalChartData,
    scores: CompatibilityScores
  ): Promise<string> {
    const prompt = `Write a 3-4 sentence compatibility narrative for these two natal charts.

User: Sun ${userChart.planets.sun.sign.name}, Moon ${userChart.planets.moon.sign.name}, Rising ${userChart.ascendant?.name || 'Unknown'}
Companion: Sun ${companionChart.planets.sun.sign.name}, Moon ${companionChart.planets.moon.sign.name}, Rising ${companionChart.ascendant?.name || 'Unknown'}
Overall compatibility: ${scores.overall}%

Write a warm, insightful narrative. Return plain text only, 3-4 sentences.`;

    try {
      return await this.chatCompletion(prompt, 2000);
    } catch (error) {
      console.error('[OllamaTraitAnalysis] generateCompatibilityNarrative failed:', error);
      return 'These two charts share a unique cosmic connection with complementary energies that foster growth and understanding.';
    }
  }

  private parseTraitDescriptions(
    response: string,
    baseTraits: TraitVisualization[]
  ): Array<{ description: string }> {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === baseTraits.length) {
        return parsed;
      }
      throw new Error('Parsed response does not match expected structure');
    } catch {
      return baseTraits.map((t) => ({
        description: `A ${t.category.toLowerCase()} trait reflecting your ${t.name.toLowerCase()}.`,
      }));
    }
  }

  private parsePersonalitySummary(response: string): PersonalitySummary {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.summary && parsed.elementalNarrative) {
        return { summary: parsed.summary, elementalNarrative: parsed.elementalNarrative };
      }
      throw new Error('Missing required fields');
    } catch {
      return {
        summary: 'You have a unique astrological profile with distinct personality dimensions.',
        elementalNarrative: 'Your elemental balance creates a dynamic interplay of energies.',
      };
    }
  }
}
