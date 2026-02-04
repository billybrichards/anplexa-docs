// AI Services

// Ollama Gateway (low-level)
export {
  OllamaGateway,
  MODEL_PRESETS,
  getModelPreset,
  createOllamaGateway,
  getOllamaGateway,
} from './ollama';

export type {
  OllamaConfig,
  ChatMessage,
  OllamaOptions,
  GenerateOptions,
} from './ollama';

// LLM Services (high-level persona generation)
export {
  ClaudeLLMService,
  createClaudeLLMService,
  type ClaudeLLMConfig,
} from './claude-llm-service';

export {
  OllamaLLMService,
  createOllamaLLMService,
} from './ollama-llm-service';

// Prompt builder utilities
export {
  buildSystemPrompt,
  buildChartAnalysisPrompt,
  buildPersonaGenerationMessages,
} from './persona-prompt-builder';
