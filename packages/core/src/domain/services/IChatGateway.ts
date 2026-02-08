/**
 * Chat Gateway Interface
 *
 * Defines the contract for AI chat services used by core use cases.
 * Implementations may use Ollama, Claude, or other LLM providers.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model: string;
  messages: ChatMessage[];
  options?: Record<string, unknown>;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface IChatGateway {
  generate(options: GenerateOptions): Promise<string>;
  generateStream?(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
}
