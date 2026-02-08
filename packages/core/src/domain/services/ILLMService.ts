/**
 * LLM Service Interface
 *
 * Domain service for generating AI companion personas using Large Language Models.
 * This interface defines the contract for LLM providers (Claude API, Ollama, etc.)
 * to generate personalized companion personalities from astrological birth charts.
 */

import type { NatalChartData } from '../value-objects/astrology/NatalChartData.js';
import type { BirthData } from '../value-objects/astrology/BirthData.js';
import type { PersonalityTraits } from '../value-objects/companion/PersonalityTraits.js';
import type { CommunicationStyle } from '../value-objects/companion/CommunicationStyle.js';
import type { EmotionalApproach } from '../value-objects/companion/EmotionalApproach.js';

/**
 * Input for persona generation
 */
export interface GeneratePersonaInput {
  birthChart: NatalChartData;
  birthData: BirthData;
  preferences?: {
    tone?: 'warm' | 'intellectual' | 'playful' | 'grounded' | 'mystical' | 'professional' | 'friendly';
    formality?: 'casual' | 'balanced' | 'formal';
    detailLevel?: 'concise' | 'moderate' | 'elaborate';
  };
}

/**
 * Output from persona generation
 */
export interface GeneratePersonaOutput {
  name: string;
  personalityTraits: PersonalityTraits;
  communicationStyle: CommunicationStyle;
  emotionalApproach: EmotionalApproach;
  systemPrompt: string;
  reasoning: string; // Why these choices were made based on the chart
}

/**
 * LLM Service Interface
 *
 * Implementations:
 * - ClaudeLLMService: Uses Anthropic's Claude API
 * - OllamaLLMService: Uses local Ollama models
 */
export interface ILLMService {
  /**
   * Generate a companion persona from a birth chart
   *
   * @param input Birth chart data and user preferences
   * @returns Generated persona with traits, style, and system prompt
   * @throws Error if generation fails or returns invalid JSON
   */
  generateCompanionPersona(input: GeneratePersonaInput): Promise<GeneratePersonaOutput>;

  /**
   * Test connection to the LLM service
   *
   * @returns Success status and optional error message
   */
  testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Get the model identifier being used
   *
   * @returns Model name/ID (e.g., "claude-3-opus-20240229", "violet-lotus:latest")
   */
  getModelId(): string;
}
