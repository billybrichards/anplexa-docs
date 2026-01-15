/**
 * CosmicAIService
 *
 * AI service for Cosmic Companion conversations.
 * Integrates with any LLM provider (Ollama, OpenAI, Anthropic, etc.)
 */

import { IAIService, type AIConversationContext, type AIResponse } from '@anplexa/cosmic-companion/use-cases/ports';

export class CosmicAIService implements IAIService {
  constructor(
    private readonly llmProvider: {
      generateCompletion: (messages: Array<{ role: string; content: string }>) => Promise<string>;
    }
  ) {}

  async generateResponse(context: AIConversationContext): Promise<AIResponse> {
    // Build enhanced system prompt with zodiac personality + memory + transits
    const enhancedSystemPrompt = this.buildEnhancedPrompt(context);

    // Prepare messages for LLM
    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...context.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Generate completion
    const content = await this.llmProvider.generateCompletion(messages);

    return {
      content,
      tokens: undefined // Could be tracked if provider returns it
    };
  }

  private buildEnhancedPrompt(context: AIConversationContext): string {
    const parts: string[] = [context.systemPrompt];

    // Add memory context if available
    if (context.memoryContext) {
      parts.push(`\n## Memory Context\n${context.memoryContext}`);
    }

    // Add astrological transit context if available
    if (context.transitContext) {
      parts.push(`\n## Current Astrological Context\n${context.transitContext}`);
      parts.push(`Feel free to reference this naturally in conversation if relevant.`);
    }

    parts.push(`\n## Instructions\n- Stay in character with your astrological personality
- Reference memories when relevant to show continuity
- Be authentic and emotionally present
- For NSFW content, match the intimacy level to your zodiac traits`);

    return parts.join('\n');
  }
}

/**
 * Simple mock LLM provider for development/testing
 */
export class MockLLMProvider {
  async generateCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
    const lastMessage = messages[messages.length - 1];

    // Simple mock responses based on content
    if (lastMessage.content.toLowerCase().includes('hello') || lastMessage.content.toLowerCase().includes('hi')) {
      return "Hello! I'm so glad to connect with you. How are you feeling today?";
    }

    if (lastMessage.content.toLowerCase().includes('birth chart') || lastMessage.content.toLowerCase().includes('zodiac')) {
      return "I love exploring astrological connections! Your birth chart reveals so much about your unique energy and how we resonate together.";
    }

    // Default response
    return "I'm here for you. Tell me more about what's on your mind.";
  }
}
