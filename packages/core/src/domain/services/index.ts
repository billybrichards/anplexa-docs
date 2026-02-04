/**
 * Domain Services
 *
 * Domain services encapsulate business logic that doesn't naturally fit within
 * a single entity. These are pure domain concepts with no infrastructure dependencies.
 */

// Astrology Calculation Service Interface
export type {
  IAstrologyCalculationService,
  CalculationOptions,
} from './IAstrologyCalculationService';

// LLM Service Interface (for persona generation)
export type {
  ILLMService,
  GeneratePersonaInput,
  GeneratePersonaOutput,
} from './ILLMService';

// System Prompt Builder
export {
  SystemPromptBuilder,
  createSystemPromptBuilder,
  type SystemPromptConfig,
  type ConversationContext,
} from './SystemPromptBuilder';
