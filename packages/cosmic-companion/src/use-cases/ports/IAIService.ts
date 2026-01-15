/**
 * IAIService Port
 *
 * Interface for AI conversation generation.
 * Implementation will extend OllamaGateway with zodiac-aware prompts.
 */

export interface AIConversationContext {
  systemPrompt: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  memoryContext?: string;
  transitContext?: string;
}

export interface AIResponse {
  content: string;
  tokens?: number;
}

export interface IAIService {
  /**
   * Generate AI response for companion
   */
  generateResponse(context: AIConversationContext): Promise<AIResponse>;
}
