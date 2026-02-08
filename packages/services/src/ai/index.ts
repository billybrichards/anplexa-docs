// AI Services

// Ollama Gateway (low-level)
export {
  OllamaGateway,
  MODEL_PRESETS,
  getModelPreset,
  createOllamaGateway,
  getOllamaGateway,
} from './ollama.js';

export type {
  OllamaConfig,
  ChatMessage,
  OllamaOptions,
  GenerateOptions,
} from './ollama.js';

// LLM Services (high-level persona generation)
export {
  ClaudeLLMService,
  createClaudeLLMService,
  type ClaudeLLMConfig,
} from './claude-llm-service.js';

export {
  OllamaLLMService,
  createOllamaLLMService,
} from './ollama-llm-service.js';

// Prompt builder utilities
export {
  buildSystemPrompt,
  buildChartAnalysisPrompt,
  buildPersonaGenerationMessages,
} from './persona-prompt-builder.js';
