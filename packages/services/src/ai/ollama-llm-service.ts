/**
 * Ollama LLM Service
 *
 * Implementation of ILLMService using local Ollama models.
 * Generates AI companion personas from astrological birth charts.
 */

import type {
  ILLMService,
  GeneratePersonaInput,
  GeneratePersonaOutput,
} from '@anplexa/core/domain/services/ILLMService';
import { PersonalityTraits } from '@anplexa/core/domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle } from '@anplexa/core/domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '@anplexa/core/domain/value-objects/companion/EmotionalApproach';
import { OllamaGateway, type OllamaConfig } from './ollama';
import { buildPersonaGenerationMessages } from './persona-prompt-builder';

/**
 * Raw JSON response from Ollama (before validation)
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
 * Ollama LLM Service
 *
 * @example
 * const service = new OllamaLLMService({
 *   baseUrl: 'http://localhost:11434',
 *   apiKey: '',
 *   generalModel: 'dolphin-mixtral:latest',
 *   longFormModel: 'dolphin-mixtral:latest',
 * });
 *
 * const persona = await service.generateCompanionPersona({
 *   birthChart,
 *   birthData,
 *   preferences: { tone: 'warm' },
 * });
 */
export class OllamaLLMService implements ILLMService {
  private gateway: OllamaGateway;
  private model: string;

  constructor(config: OllamaConfig) {
    this.gateway = new OllamaGateway(config);
    // Use longFormModel for persona generation (needs detailed output)
    this.model = config.longFormModel || config.generalModel;
  }

  /**
   * Generate a companion persona from a birth chart
   */
  async generateCompanionPersona(input: GeneratePersonaInput): Promise<GeneratePersonaOutput> {
    try {
      // Build the prompt messages
      const messages = buildPersonaGenerationMessages(input);

      // Convert to Ollama format (system + user messages)
      const ollamaMessages = [
        { role: 'system' as const, content: messages[0].content },
        { role: 'user' as const, content: messages[1].content },
      ];

      // Call Ollama with optimized settings for JSON generation
      const response = await this.gateway.generate({
        model: this.model,
        messages: ollamaMessages,
        options: {
          temperature: 0.7, // Lower temperature for more consistent JSON
          num_predict: 4000, // Allow for detailed response
          top_p: 0.9,
          repeat_penalty: 1.1,
        },
      });

      // Parse JSON response
      const rawPersona = this.parsePersonaJSON(response);

      // Validate and construct value objects
      return this.validateAndConstructPersona(rawPersona);
    } catch (error) {
      throw new Error(`Ollama persona generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JSON from Ollama's response
   * Handles cases where Ollama wraps JSON in markdown code blocks or adds extra text
   */
  private parsePersonaJSON(rawText: string): RawPersonaResponse {
    let jsonText = rawText.trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Try to find JSON object if Ollama added extra text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonText) as RawPersonaResponse;
    } catch (error) {
      throw new Error(`Failed to parse JSON from Ollama response: ${error instanceof Error ? error.message : 'Unknown error'}\n\nRaw text:\n${rawText}`);
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
   * Test connection to Ollama
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.gateway.testConnection();
  }

  /**
   * Get the model identifier being used
   */
  getModelId(): string {
    return this.model;
  }
}

/**
 * Create an Ollama LLM service from environment variables
 */
export function createOllamaLLMService(): OllamaLLMService {
  return new OllamaLLMService({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    apiKey: process.env.OLLAMA_API_KEY || '',
    generalModel: process.env.OLLAMA_GENERAL_MODEL || 'dolphin-mixtral:latest',
    longFormModel: process.env.OLLAMA_LONGFORM_MODEL || 'dolphin-mixtral:latest',
  });
}
