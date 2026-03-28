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
} from './IAstrologyCalculationService.js';

// LLM Service Interface (for persona generation)
export type {
  ILLMService,
  GeneratePersonaInput,
  GeneratePersonaOutput,
} from './ILLMService.js';

// System Prompt Builder
export {
  SystemPromptBuilder,
  createSystemPromptBuilder,
  type SystemPromptConfig,
  type ConversationContext,
} from './SystemPromptBuilder.js';

// LiveKit Service Interface (for voice/video calls)
export type {
  ILiveKitService,
  LiveKitTokenOptions,
} from './ILiveKitService.js';

// Rate Limit Service Interface
export type {
  IRateLimitService,
  RateLimitResult,
} from './IRateLimitService.js';
