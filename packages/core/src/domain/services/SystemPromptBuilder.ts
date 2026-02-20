/**
 * System Prompt Builder Domain Service
 *
 * Responsible for building the final system prompt by merging:
 * - Persona system prompt (from CompanionPersona)
 * - Base companion configuration
 * - Conversation context
 *
 * This is a pure domain service with no external dependencies.
 */

import type { CompanionPersona } from '../entities/CompanionPersona.js';

/**
 * Configuration for system prompt building
 */
export interface SystemPromptConfig {
  /** Default system prompt when no persona is available */
  defaultPrompt?: string;
  /** Whether to include conversation context in the prompt */
  includeContext?: boolean;
  /** Maximum length for the final system prompt */
  maxLength?: number;
}

/**
 * Context about the conversation for prompt building
 */
export interface ConversationContext {
  /** Number of messages in conversation history */
  messageCount?: number;
  /** Topic or summary of conversation (if available) */
  topic?: string;
  /** User's timezone for time-aware responses */
  timezone?: string;
  /** Current date/time for temporal awareness */
  currentDateTime?: Date;
}

/**
 * Default system prompt used when no persona is configured
 */
const DEFAULT_SYSTEM_PROMPT = `You are a helpful, empathetic AI companion. Your role is to:
- Listen actively and respond thoughtfully
- Provide emotional support and guidance when needed
- Help users explore their thoughts and feelings
- Maintain a warm, non-judgmental tone
- Respect boundaries and privacy

Respond naturally and authentically, as if you were a trusted friend.`;

/**
 * System Prompt Builder
 *
 * Builds personalized system prompts for AI conversations.
 * Combines persona configuration with contextual information.
 */
export class SystemPromptBuilder {
  private readonly config: Required<SystemPromptConfig>;

  constructor(config?: SystemPromptConfig) {
    this.config = {
      defaultPrompt: config?.defaultPrompt ?? DEFAULT_SYSTEM_PROMPT,
      includeContext: config?.includeContext ?? true,
      maxLength: config?.maxLength ?? 8000,
    };
  }

  /**
   * Build the complete system prompt
   *
   * Priority order:
   * 1. Persona system prompt (if persona is active)
   * 2. Default system prompt (fallback)
   * 3. Context additions (if enabled)
   *
   * @param persona - The companion persona (optional)
   * @param context - Additional conversation context (optional)
   * @returns The complete system prompt string
   */
  build(persona?: CompanionPersona | null, context?: ConversationContext): string {
    // Start with persona prompt or default
    let basePrompt: string;

    if (persona && persona.isActive && persona.systemPrompt) {
      basePrompt = persona.systemPrompt;
    } else {
      basePrompt = this.config.defaultPrompt;
    }

    // Add context if enabled and available
    if (this.config.includeContext && context) {
      const contextAddition = this.buildContextSection(context);
      if (contextAddition) {
        basePrompt = `${basePrompt}\n\n${contextAddition}`;
      }
    }

    // Ensure prompt doesn't exceed max length
    if (basePrompt.length > this.config.maxLength) {
      basePrompt = basePrompt.substring(0, this.config.maxLength - 3) + '...';
    }

    return basePrompt;
  }

  /**
   * Build a context section to append to the system prompt
   */
  private buildContextSection(context: ConversationContext): string {
    const sections: string[] = [];

    if (context.currentDateTime) {
      const formattedDate = context.currentDateTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: context.timezone || 'UTC',
      });
      sections.push(`Current date and time: ${formattedDate}`);
    }

    if (context.topic) {
      sections.push(`Conversation topic: ${context.topic}`);
    }

    if (sections.length === 0) {
      return '';
    }

    return `[Context]\n${sections.join('\n')}`;
  }

  /**
   * Check if a persona has a valid system prompt
   */
  hasValidPersonaPrompt(persona?: CompanionPersona | null): boolean {
    return !!(
      persona &&
      persona.isActive &&
      persona.systemPrompt &&
      persona.systemPrompt.trim().length > 0
    );
  }

  /**
   * Get the default system prompt
   */
  getDefaultPrompt(): string {
    return this.config.defaultPrompt;
  }
}

/**
 * Factory function for creating a SystemPromptBuilder with default config
 */
export function createSystemPromptBuilder(config?: SystemPromptConfig): SystemPromptBuilder {
  return new SystemPromptBuilder(config);
}
