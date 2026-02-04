/**
 * Claude LLM Service
 *
 * Implementation of ILLMService using Anthropic's Claude API.
 * Generates AI companion personas from astrological birth charts.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ILLMService,
  GeneratePersonaInput,
  GeneratePersonaOutput,
} from '@anplexa/core/domain/services/ILLMService';
import { PersonalityTraits } from '@anplexa/core/domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle } from '@anplexa/core/domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '@anplexa/core/domain/value-objects/companion/EmotionalApproach';
import { buildPersonaGenerationMessages } from './persona-prompt-builder';

export interface ClaudeLLMConfig {
  apiKey: string;
  model?: string; // Default: claude-3-5-sonnet-20241022
  maxTokens?: number; // Default: 4000
  temperature?: number; // Default: 1.0
}

/**
 * Raw JSON response from Claude (before validation)
 */
interface RawPersonaResponse {
  name: string;
  personalityTraits: {
    traits: string[];
    coreArchetype?: string;
  };
  communicationStyle: {
    tone: string;
    directness: string;
    pacing: string;
    verbosity: string;
    formalityLevel: number;
    usesMetaphors: boolean;
    usesHumor: boolean;
    emotionalExpressiveness: string;
  };
  emotionalApproach: {
    empathyLevel: string;
    supportStyle: string;
    depthPreference: string;
    validationStyle: string;
    boundaryRespect: number;
    emotionalMirroring: boolean;
    proactiveCareCheckins: boolean;
  };
  systemPrompt: string;
  reasoning: string;
}

/**
 * Claude LLM Service
 *
 * @example
 * const service = new ClaudeLLMService({
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: 'claude-3-5-sonnet-20241022',
 * });
 *
 * const persona = await service.generateCompanionPersona({
 *   birthChart,
 *   birthData,
 *   preferences: { tone: 'warm' },
 * });
 */
export class ClaudeLLMService implements ILLMService {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ClaudeLLMConfig) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('Claude API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature ?? 1.0;
  }

  /**
   * Generate a companion persona from a birth chart
   */
  async generateCompanionPersona(input: GeneratePersonaInput): Promise<GeneratePersonaOutput> {
    try {
      // Build the prompt messages
      const messages = buildPersonaGenerationMessages(input);

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: messages[0].content, // System message
        messages: [
          {
            role: 'user',
            content: messages[1].content, // User message with chart data
          },
        ],
      });

      // Extract text content
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const rawText = content.text;

      // Parse JSON response
      const rawPersona = this.parsePersonaJSON(rawText);

      // Validate and construct value objects
      return this.validateAndConstructPersona(rawPersona);
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse JSON from Claude's response
   * Handles cases where Claude wraps JSON in markdown code blocks
   */
  private parsePersonaJSON(rawText: string): RawPersonaResponse {
    let jsonText = rawText.trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    try {
      return JSON.parse(jsonText) as RawPersonaResponse;
    } catch (error) {
      throw new Error(`Failed to parse JSON from Claude response: ${error instanceof Error ? error.message : 'Unknown error'}\n\nRaw text:\n${rawText}`);
    }
  }

  /**
   * Validate raw JSON and construct domain value objects
   */
  private validateAndConstructPersona(raw: RawPersonaResponse): GeneratePersonaOutput {
    // Validate name
    if (!raw.name || raw.name.trim().length === 0) {
      throw new Error('Generated persona missing name');
    }
    if (raw.name.length > 50) {
      throw new Error('Generated name is too long (max 50 characters)');
    }

    // Validate system prompt
    if (!raw.systemPrompt || raw.systemPrompt.trim().length === 0) {
      throw new Error('Generated persona missing system prompt');
    }
    if (raw.systemPrompt.length < 100) {
      throw new Error('Generated system prompt is too short (min 100 characters)');
    }
    if (raw.systemPrompt.length > 10000) {
      throw new Error('Generated system prompt is too long (max 10000 characters)');
    }

    // Validate reasoning
    if (!raw.reasoning || raw.reasoning.trim().length === 0) {
      throw new Error('Generated persona missing reasoning');
    }

    // Construct PersonalityTraits
    const personalityTraits = PersonalityTraits.create({
      traits: raw.personalityTraits.traits,
      coreArchetype: raw.personalityTraits.coreArchetype,
    });

    // Construct CommunicationStyle
    const communicationStyle = CommunicationStyle.create({
      tone: this.validateEnum(
        raw.communicationStyle.tone,
        ['warm', 'intellectual', 'playful', 'grounded', 'mystical', 'professional', 'friendly'],
        'tone'
      ) as any,
      directness: this.validateEnum(
        raw.communicationStyle.directness,
        ['direct', 'gentle', 'exploratory', 'nuanced'],
        'directness'
      ) as any,
      pacing: this.validateEnum(
        raw.communicationStyle.pacing,
        ['quick', 'thoughtful', 'patient', 'adaptive'],
        'pacing'
      ) as any,
      verbosity: this.validateEnum(
        raw.communicationStyle.verbosity,
        ['concise', 'moderate', 'detailed'],
        'verbosity'
      ) as any,
      formalityLevel: this.validateScore(raw.communicationStyle.formalityLevel, 'formalityLevel', 0, 10),
      usesMetaphors: raw.communicationStyle.usesMetaphors,
      usesHumor: raw.communicationStyle.usesHumor,
      emotionalExpressiveness: this.validateEnum(
        raw.communicationStyle.emotionalExpressiveness,
        ['reserved', 'balanced', 'expressive'],
        'emotionalExpressiveness'
      ) as any,
    });

    // Construct EmotionalApproach
    const emotionalApproach = EmotionalApproach.create({
      empathyLevel: this.validateEnum(
        raw.emotionalApproach.empathyLevel,
        ['high', 'balanced', 'practical'],
        'empathyLevel'
      ) as any,
      supportStyle: this.validateEnum(
        raw.emotionalApproach.supportStyle,
        ['nurturing', 'coaching', 'reflective', 'analytical', 'empowering'],
        'supportStyle'
      ) as any,
      depthPreference: this.validateEnum(
        raw.emotionalApproach.depthPreference,
        ['surface', 'moderate', 'deep', 'profound'],
        'depthPreference'
      ) as any,
      validationStyle: this.validateEnum(
        raw.emotionalApproach.validationStyle,
        ['immediate', 'balanced', 'exploratory'],
        'validationStyle'
      ) as any,
      boundaryRespect: this.validateScore(raw.emotionalApproach.boundaryRespect, 'boundaryRespect', 0, 10),
      emotionalMirroring: raw.emotionalApproach.emotionalMirroring,
      proactiveCareCheckins: raw.emotionalApproach.proactiveCareCheckins,
    });

    return {
      name: raw.name.trim(),
      personalityTraits,
      communicationStyle,
      emotionalApproach,
      systemPrompt: raw.systemPrompt.trim(),
      reasoning: raw.reasoning.trim(),
    };
  }

  /**
   * Validate a numeric score
   */
  private validateScore(value: number, fieldName: string, min: number = 0, max: number = 100): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid ${fieldName}: must be a number`);
    }
    if (value < min || value > max) {
      throw new Error(`Invalid ${fieldName}: must be between ${min} and ${max}, got ${value}`);
    }
    return value;
  }

  /**
   * Validate an enum value
   */
  private validateEnum(value: string, allowedValues: string[], fieldName: string): string {
    if (!allowedValues.includes(value)) {
      throw new Error(
        `Invalid ${fieldName}: must be one of [${allowedValues.join(', ')}], got "${value}"`
      );
    }
    return value;
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple test message
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Respond with "OK" if you can read this.',
          },
        ],
      });

      if (response.content[0].type === 'text') {
        return { success: true };
      }

      return { success: false, error: 'Unexpected response format' };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        return { success: false, error: `API Error: ${error.message}` };
      }
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get the model identifier being used
   */
  getModelId(): string {
    return this.model;
  }
}

/**
 * Create a Claude LLM service from environment variables
 */
export function createClaudeLLMService(): ClaudeLLMService {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  return new ClaudeLLMService({
    apiKey,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: process.env.ANTHROPIC_MAX_TOKENS
      ? parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10)
      : 4000,
    temperature: process.env.ANTHROPIC_TEMPERATURE
      ? parseFloat(process.env.ANTHROPIC_TEMPERATURE)
      : 1.0,
  });
}
