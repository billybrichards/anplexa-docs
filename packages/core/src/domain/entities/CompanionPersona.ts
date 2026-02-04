/**
 * Companion Persona Entity (Aggregate Root)
 *
 * Represents an AI companion personality generated from a user's birth chart.
 * Contains the system prompt and behavioral parameters that personalize the AI.
 */

import { CommunicationStyle, type CommunicationStyleProps } from '../value-objects/companion/CommunicationStyle';
import { EmotionalApproach, type EmotionalApproachProps } from '../value-objects/companion/EmotionalApproach';
import { PersonalityTraits, type PersonalityTraitsProps } from '../value-objects/companion/PersonalityTraits';

export interface CompanionPersonaProps {
  id: string;
  userId: string;
  birthChartId: string;
  name: string; // Generated companion name
  personalityTraits: PersonalityTraits;
  communicationStyle: CommunicationStyle;
  emotionalApproach: EmotionalApproach;
  systemPrompt: string; // The full custom system prompt
  generationMetadata: {
    llmModel: string; // Which model generated this
    reasoning?: string; // Why these choices were made
    generatedAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanionPersona {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly birthChartId: string,
    public readonly name: string,
    public readonly personalityTraits: PersonalityTraits,
    public readonly communicationStyle: CommunicationStyle,
    public readonly emotionalApproach: EmotionalApproach,
    public readonly systemPrompt: string,
    public readonly generationMetadata: CompanionPersonaProps['generationMetadata'],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Create a new CompanionPersona entity
   */
  static create(
    id: string,
    userId: string,
    birthChartId: string,
    name: string,
    personalityTraits: PersonalityTraits,
    communicationStyle: CommunicationStyle,
    emotionalApproach: EmotionalApproach,
    systemPrompt: string,
    llmModel: string,
    reasoning?: string
  ): CompanionPersona {
    if (!id || id.trim().length === 0) {
      throw new Error('Companion persona ID is required');
    }
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!birthChartId || birthChartId.trim().length === 0) {
      throw new Error('Birth chart ID is required');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Companion name is required');
    }
    if (name.length > 50) {
      throw new Error('Companion name must be 50 characters or less');
    }
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      throw new Error('System prompt is required');
    }
    if (systemPrompt.length < 50) {
      throw new Error('System prompt must be at least 50 characters (too short to be meaningful)');
    }
    if (systemPrompt.length > 10000) {
      throw new Error('System prompt must be 10000 characters or less');
    }

    const now = new Date();

    return new CompanionPersona(
      id,
      userId,
      birthChartId,
      name,
      personalityTraits,
      communicationStyle,
      emotionalApproach,
      systemPrompt,
      {
        llmModel,
        reasoning,
        generatedAt: now,
      },
      true, // New personas are active by default
      now,
      now
    );
  }

  /**
   * Reconstruct from persistence (for repository)
   */
  static fromPersistence(props: CompanionPersonaProps): CompanionPersona {
    return new CompanionPersona(
      props.id,
      props.userId,
      props.birthChartId,
      props.name,
      props.personalityTraits,
      props.communicationStyle,
      props.emotionalApproach,
      props.systemPrompt,
      props.generationMetadata,
      props.isActive,
      props.createdAt,
      props.updatedAt
    );
  }

  /**
   * Deactivate this persona (when user generates a new one)
   */
  deactivate(): CompanionPersona {
    if (!this.isActive) {
      return this; // Already inactive
    }

    return new CompanionPersona(
      this.id,
      this.userId,
      this.birthChartId,
      this.name,
      this.personalityTraits,
      this.communicationStyle,
      this.emotionalApproach,
      this.systemPrompt,
      this.generationMetadata,
      false,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Activate this persona
   */
  activate(): CompanionPersona {
    if (this.isActive) {
      return this; // Already active
    }

    return new CompanionPersona(
      this.id,
      this.userId,
      this.birthChartId,
      this.name,
      this.personalityTraits,
      this.communicationStyle,
      this.emotionalApproach,
      this.systemPrompt,
      this.generationMetadata,
      true,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update system prompt (regenerate with same parameters)
   */
  updateSystemPrompt(newPrompt: string, llmModel: string, reasoning?: string): CompanionPersona {
    if (!newPrompt || newPrompt.trim().length === 0) {
      throw new Error('System prompt is required');
    }
    if (newPrompt.length < 50) {
      throw new Error('System prompt must be at least 50 characters');
    }
    if (newPrompt.length > 10000) {
      throw new Error('System prompt must be 10000 characters or less');
    }

    return new CompanionPersona(
      this.id,
      this.userId,
      this.birthChartId,
      this.name,
      this.personalityTraits,
      this.communicationStyle,
      this.emotionalApproach,
      newPrompt,
      {
        llmModel,
        reasoning,
        generatedAt: new Date(),
      },
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Get a summary of the persona
   */
  getSummary(): string {
    return `${this.name} - ${this.personalityTraits.getSummary()} | ${this.communicationStyle.getSummary()} | ${this.emotionalApproach.getSummary()}`;
  }

  /**
   * Get a sample greeting based on the persona
   */
  generateSampleGreeting(): string {
    // This would ideally be generated by an LLM, but for now we can create a template
    const { tone } = this.communicationStyle;
    const { supportStyle } = this.emotionalApproach;

    const greetings: Record<typeof tone, string> = {
      warm: `Hello! I'm ${this.name}, and I'm here to support you. How are you feeling today?`,
      intellectual: `Greetings. I'm ${this.name}. I'm here to explore ideas and insights with you.`,
      playful: `Hey there! ${this.name} here! Ready for an adventure? What's on your mind?`,
      grounded: `Hi, I'm ${this.name}. Let's keep things real and practical. What can I help with?`,
      mystical: `Welcome, dear soul. I am ${this.name}, here to guide you through the mysteries of your journey.`,
      professional: `Good day. I'm ${this.name}, your dedicated companion. How may I assist you today?`,
      friendly: `Hi! I'm ${this.name}, your friendly companion. What's going on with you?`,
    };

    return greetings[tone] || greetings.friendly;
  }

  /**
   * Entity equality (by ID)
   */
  equals(other: CompanionPersona): boolean {
    return this.id === other.id;
  }

  /**
   * Serialize to JSON for persistence
   */
  toJSON(): object {
    return {
      id: this.id,
      userId: this.userId,
      birthChartId: this.birthChartId,
      name: this.name,
      personalityTraits: this.personalityTraits.toJSON(),
      communicationStyle: this.communicationStyle.toJSON(),
      emotionalApproach: this.emotionalApproach.toJSON(),
      systemPrompt: this.systemPrompt,
      generationMetadata: {
        llmModel: this.generationMetadata.llmModel,
        reasoning: this.generationMetadata.reasoning,
        generatedAt: this.generationMetadata.generatedAt.toISOString(),
      },
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): CompanionPersona {
    return CompanionPersona.fromPersistence({
      id: data.id,
      userId: data.userId,
      birthChartId: data.birthChartId,
      name: data.name,
      personalityTraits: PersonalityTraits.fromJSON(data.personalityTraits),
      communicationStyle: CommunicationStyle.fromJSON(data.communicationStyle),
      emotionalApproach: EmotionalApproach.fromJSON(data.emotionalApproach),
      systemPrompt: data.systemPrompt,
      generationMetadata: {
        llmModel: data.generationMetadata.llmModel,
        reasoning: data.generationMetadata.reasoning,
        generatedAt: new Date(data.generationMetadata.generatedAt),
      },
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
