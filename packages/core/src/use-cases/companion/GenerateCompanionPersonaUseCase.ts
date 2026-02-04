/**
 * Generate Companion Persona Use Case
 *
 * Orchestrates the generation of a personalized AI companion from a user's birth chart.
 * This is the primary entry point for creating companion personas.
 *
 * Responsibilities:
 * 1. Fetch user's active birth chart (or specified chart)
 * 2. Check if a persona already exists (unless regenerate=true)
 * 3. Call LLM service to generate persona from chart data
 * 4. Create CompanionPersona domain entity
 * 5. Deactivate old personas if necessary
 * 6. Persist new persona
 * 7. Return preview data for immediate UI feedback
 */

import type { IBirthChartRepository } from '../../repositories/interfaces/birth-chart.repository.interface';
import type { ICompanionPersonaRepository } from '../../repositories/interfaces/companion-persona.repository.interface';
import type { ILLMService, GeneratePersonaInput } from '../../domain/services/ILLMService';
import { CompanionPersona } from '../../domain/entities/CompanionPersona';
import { PersonalityTraits } from '../../domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle, type ToneType } from '../../domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '../../domain/value-objects/companion/EmotionalApproach';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { DomainError } from '../../domain/errors/DomainError';

// ============================================================================
// Input/Output DTOs
// ============================================================================

/**
 * User preferences for persona generation
 */
export interface PersonaPreferences {
  /** Preferred name gender style */
  nameGender?: 'masculine' | 'feminine' | 'neutral' | 'any';

  /** Aspects of personality to emphasize */
  personalityEmphasis?: ('nurturing' | 'intellectual' | 'playful' | 'grounded' | 'mystical')[];

  /** Preferred communication style */
  communicationPreference?: 'formal' | 'casual' | 'supportive' | 'challenging';
}

/**
 * Input DTO for GenerateCompanionPersona use case
 */
export interface GenerateCompanionPersonaInput {
  /** User requesting the persona generation */
  userId: string;

  /**
   * Specific birth chart to use
   * If not provided, uses the user's active birth chart
   */
  birthChartId?: string;

  /**
   * Force regeneration even if a persona already exists
   * When true, the existing persona will be deactivated
   */
  regenerate?: boolean;

  /**
   * User preferences for persona customization
   */
  preferences?: PersonaPreferences;
}

/**
 * Preview data returned immediately after generation
 */
export interface PersonaPreview {
  /** Generated companion name */
  name: string;

  /** Brief description of the persona */
  description: string;

  /** Sample greeting demonstrating the persona's voice */
  sampleGreeting: string;
}

/**
 * Output DTO for GenerateCompanionPersona use case
 */
export interface GenerateCompanionPersonaOutput {
  /** The generated companion persona entity */
  persona: CompanionPersona;

  /** Preview data for immediate UI feedback */
  preview: PersonaPreview;

  /** Whether an existing persona was deactivated */
  previousPersonaDeactivated: boolean;

  /** ID of the deactivated persona (if any) */
  previousPersonaId?: string;
}

// ============================================================================
// Custom Errors
// ============================================================================

/**
 * Thrown when user already has a persona and regenerate=false
 */
export class PersonaAlreadyExistsError extends DomainError {
  constructor(
    public readonly userId: string,
    public readonly existingPersonaId: string
  ) {
    super(
      `User ${userId} already has an active companion persona. Set regenerate=true to create a new one.`,
      'PERSONA_ALREADY_EXISTS'
    );
  }
}

/**
 * Thrown when persona generation fails in the LLM service
 */
export class PersonaGenerationError extends DomainError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 'PERSONA_GENERATION_ERROR');
  }
}

/**
 * Thrown when the LLM service is not available
 */
export class LLMServiceUnavailableError extends DomainError {
  constructor() {
    super('LLM service is not available. Please try again later.', 'LLM_SERVICE_UNAVAILABLE');
  }
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * Generate Companion Persona Use Case
 *
 * Creates a personalized AI companion based on the user's astrological birth chart.
 * Uses LLM to analyze the chart and generate appropriate personality traits,
 * communication style, and a tailored system prompt.
 */
export class GenerateCompanionPersonaUseCase {
  constructor(
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly companionPersonaRepository: ICompanionPersonaRepository,
    private readonly llmService: ILLMService
  ) {}

  /**
   * Execute the persona generation use case
   *
   * @param input - User ID, optional chart ID, and preferences
   * @returns Generated persona with preview data
   * @throws {NotFoundError} If birth chart not found
   * @throws {PersonaAlreadyExistsError} If persona exists and regenerate=false
   * @throws {LLMServiceUnavailableError} If LLM service is not available
   * @throws {PersonaGenerationError} If LLM generation fails
   */
  async execute(input: GenerateCompanionPersonaInput): Promise<GenerateCompanionPersonaOutput> {
    // 1. Validate LLM service availability
    const connectionTest = await this.llmService.testConnection();
    if (!connectionTest.success) {
      throw new LLMServiceUnavailableError();
    }

    // 2. Fetch the birth chart (specified or active)
    const birthChart = input.birthChartId
      ? await this.birthChartRepository.getById(input.birthChartId)
      : await this.birthChartRepository.getActiveByUserId(input.userId);

    if (!birthChart) {
      if (input.birthChartId) {
        throw new NotFoundError('BirthChart', input.birthChartId);
      }
      throw new NotFoundError('Active BirthChart for user', input.userId);
    }

    // Verify the birth chart belongs to the user
    if (birthChart.userId !== input.userId) {
      throw new DomainError(
        'Cannot generate persona from another user\'s birth chart',
        'AUTHORIZATION_ERROR'
      );
    }

    // 3. Check for existing persona
    const existingPersona = await this.companionPersonaRepository.getActiveByUserId(input.userId);
    let previousPersonaDeactivated = false;
    let previousPersonaId: string | undefined;

    if (existingPersona) {
      if (!input.regenerate) {
        throw new PersonaAlreadyExistsError(input.userId, existingPersona.id);
      }

      // Will deactivate after successful generation
      previousPersonaId = existingPersona.id;
    }

    // 4. Prepare LLM input with chart data and preferences
    const llmInput: GeneratePersonaInput = {
      birthChart: birthChart.chartData,
      birthData: birthChart.birthData,
      preferences: this.mapPreferencesToLLMFormat(input.preferences),
    };

    // 5. Generate persona via LLM
    let generatedPersona;
    try {
      generatedPersona = await this.llmService.generateCompanionPersona(llmInput);
    } catch (error) {
      throw new PersonaGenerationError(
        error instanceof Error ? error.message : 'Failed to generate companion persona',
        error
      );
    }

    // 6. Validate generated data (LLM might return unexpected formats)
    this.validateGeneratedPersona(generatedPersona);

    // 7. Deactivate existing personas for this user
    if (existingPersona) {
      await this.companionPersonaRepository.deactivateAllForUser(input.userId);
      previousPersonaDeactivated = true;
    }

    // 8. Generate unique ID for the new persona
    const personaId = this.generatePersonaId();

    // 9. Create the CompanionPersona entity
    const persona = CompanionPersona.create(
      personaId,
      input.userId,
      birthChart.id,
      generatedPersona.name,
      generatedPersona.personalityTraits,
      generatedPersona.communicationStyle,
      generatedPersona.emotionalApproach,
      generatedPersona.systemPrompt,
      this.llmService.getModelId(),
      generatedPersona.reasoning
    );

    // 10. Persist the persona
    const savedPersona = await this.companionPersonaRepository.create({
      id: persona.id,
      userId: persona.userId,
      birthChartId: persona.birthChartId,
      name: persona.name,
      personalityTraits: persona.personalityTraits,
      communicationStyle: persona.communicationStyle,
      emotionalApproach: persona.emotionalApproach,
      systemPrompt: persona.systemPrompt,
      llmModel: persona.generationMetadata.llmModel,
      reasoning: persona.generationMetadata.reasoning,
      isActive: true,
    });

    // 11. Build preview data
    const preview: PersonaPreview = {
      name: savedPersona.name,
      description: this.buildPersonaDescription(savedPersona),
      sampleGreeting: savedPersona.generateSampleGreeting(),
    };

    // 12. Return output DTO
    return {
      persona: savedPersona,
      preview,
      previousPersonaDeactivated,
      previousPersonaId,
    };
  }

  /**
   * Map user preferences to LLM input format
   */
  private mapPreferencesToLLMFormat(
    preferences?: PersonaPreferences
  ): GeneratePersonaInput['preferences'] | undefined {
    if (!preferences) return undefined;

    // Map personality emphasis to tone
    let tone: ToneType | undefined;
    if (preferences.personalityEmphasis?.length) {
      const emphasisToTone: Record<string, ToneType> = {
        nurturing: 'warm',
        intellectual: 'intellectual',
        playful: 'playful',
        grounded: 'grounded',
        mystical: 'mystical',
      };
      tone = emphasisToTone[preferences.personalityEmphasis[0]] as ToneType;
    }

    // Map communication preference to formality
    let formality: 'casual' | 'balanced' | 'formal' | undefined;
    switch (preferences.communicationPreference) {
      case 'formal':
        formality = 'formal';
        break;
      case 'casual':
        formality = 'casual';
        break;
      case 'supportive':
      case 'challenging':
        formality = 'balanced';
        break;
      default:
        formality = undefined;
    }

    return {
      tone,
      formality,
      detailLevel: 'moderate',
    };
  }

  /**
   * Validate the generated persona data from LLM
   */
  private validateGeneratedPersona(data: {
    name: string;
    personalityTraits: PersonalityTraits;
    communicationStyle: CommunicationStyle;
    emotionalApproach: EmotionalApproach;
    systemPrompt: string;
    reasoning: string;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new PersonaGenerationError('LLM generated empty companion name');
    }

    if (data.name.length > 50) {
      throw new PersonaGenerationError('LLM generated name exceeds 50 characters');
    }

    if (!data.systemPrompt || data.systemPrompt.length < 50) {
      throw new PersonaGenerationError('LLM generated system prompt is too short');
    }

    if (data.systemPrompt.length > 10000) {
      throw new PersonaGenerationError('LLM generated system prompt exceeds 10000 characters');
    }

    // Value objects validate themselves, but we should have them by now
    if (!data.personalityTraits) {
      throw new PersonaGenerationError('LLM did not generate personality traits');
    }

    if (!data.communicationStyle) {
      throw new PersonaGenerationError('LLM did not generate communication style');
    }

    if (!data.emotionalApproach) {
      throw new PersonaGenerationError('LLM did not generate emotional approach');
    }
  }

  /**
   * Generate a unique persona ID
   */
  private generatePersonaId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 11);
    return `persona_${timestamp}_${randomSuffix}`;
  }

  /**
   * Build a human-readable description of the persona
   */
  private buildPersonaDescription(persona: CompanionPersona): string {
    const traits = persona.personalityTraits.getSummary();
    const style = persona.communicationStyle.getSummary();
    const approach = persona.emotionalApproach.getSummary();

    return `${persona.name} is a ${traits} companion who communicates in a ${style} way, ` +
      `offering ${approach}.`;
  }
}
