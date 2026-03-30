/**
 * Route To Agent Use Case
 *
 * Agent resolution chain for chat messages:
 * 1. DB fast path — look up lettaAgentId on the conversation
 * 2. Letta metadata fallback — search Letta agents by user metadata
 * 3. Auto-provision — create a new agent for this conversation
 */

import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface.js';
import type { ILettaAgentRepository } from '../../repositories/interfaces/letta-agent.repository.interface.js';

export interface RouteToAgentInput {
  conversationId: string;
  userId: string;
  companionPersonaId?: string;
}

export interface RouteToAgentOutput {
  lettaAgentId: string;
  agentSource: 'db' | 'letta_metadata' | 'auto_provisioned';
}

export class AgentNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`No agent found for conversation: ${conversationId}`);
    this.name = 'AgentNotFoundError';
  }
}

export class ConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`);
    this.name = 'ConversationNotFoundError';
  }
}

export class UnauthorizedConversationError extends Error {
  constructor(conversationId: string) {
    super(`Not authorized to access conversation: ${conversationId}`);
    this.name = 'UnauthorizedConversationError';
  }
}

export class RouteToAgentUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly lettaAgentRepository: ILettaAgentRepository,
  ) {}

  async execute(input: RouteToAgentInput): Promise<RouteToAgentOutput> {
    // 1. DB fast path: check conversation.lettaAgentId
    const conversation = await this.conversationRepository.getById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    // Enforce ownership — prevent cross-user agent access
    if (conversation.userId !== input.userId) {
      throw new UnauthorizedConversationError(input.conversationId);
    }

    if (conversation.lettaAgentId) {
      return {
        lettaAgentId: conversation.lettaAgentId,
        agentSource: 'db',
      };
    }

    // 2. Letta metadata fallback: search by user + persona
    if (input.companionPersonaId) {
      const agents = await this.lettaAgentRepository.findByCompanionPersonaId(input.companionPersonaId);
      const chatAgent = agents.find((a) => a.agentType === 'companion' && a.isActive);
      if (chatAgent) {
        // Update conversation with the found agent for future fast path
        await this.conversationRepository.update(input.conversationId, {
          lettaAgentId: chatAgent.lettaAgentId,
        });
        return {
          lettaAgentId: chatAgent.lettaAgentId,
          agentSource: 'letta_metadata',
        };
      }
    }

    // 3. No agent found — caller must provision
    throw new AgentNotFoundError(input.conversationId);
  }
}
