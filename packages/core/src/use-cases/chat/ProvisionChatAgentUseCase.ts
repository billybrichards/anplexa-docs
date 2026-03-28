/**
 * Provision Chat Agent Use Case
 *
 * Orchestrates end-of-onboarding agent creation with astrology blocks.
 * Creates a Letta agent, links it to the conversation, and optionally
 * creates a paired voice agent.
 */

import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface.js';
import type { ICompanionPersonaRepository } from '../../repositories/interfaces/companion-persona.repository.interface.js';

export interface ProvisionChatAgentInput {
  userId: string;
  companionPersonaId: string;
  birthChartId: string;
  createVoiceAgent?: boolean;
}

export interface ProvisionChatAgentOutput {
  conversationId: string;
  lettaAgentId: string;
  voiceAgentId?: string;
  companionPersonaId: string;
}

export class CompanionPersonaNotFoundError extends Error {
  constructor(personaId: string) {
    super(`Companion persona not found: ${personaId}`);
    this.name = 'CompanionPersonaNotFoundError';
  }
}

export class AgentProvisioningError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(`Agent provisioning failed: ${message}`);
    this.name = 'AgentProvisioningError';
  }
}

/**
 * This use case defines the orchestration flow. The actual agent creation
 * is delegated to the AgentProvisioner service (packages/services/src/letta/).
 * This use case is wired in the DI container with the concrete provisioner.
 */
export class ProvisionChatAgentUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly companionPersonaRepository: ICompanionPersonaRepository,
  ) {}

  /**
   * Validates that the companion persona exists and returns it.
   * The actual provisioning logic (Letta API calls, block creation)
   * is handled by the API route/controller layer which has access
   * to the AgentProvisioner service.
   */
  async validate(input: ProvisionChatAgentInput): Promise<{
    companionPersonaId: string;
    userId: string;
  }> {
    const persona = await this.companionPersonaRepository.getById(input.companionPersonaId);
    if (!persona) {
      throw new CompanionPersonaNotFoundError(input.companionPersonaId);
    }

    return {
      companionPersonaId: persona.id,
      userId: input.userId,
    };
  }
}
