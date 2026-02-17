/**
 * Agent Provisioner — Orchestrates full Letta agent creation for a companion persona.
 *
 * Flow:
 * 1. Build persona text from CompanionPersona data (PersonaBuilder)
 * 2. Create cognitive memory blocks on Letta (CognitiveBlockFactory)
 * 3. Build system prompt with cognitive instructions (CognitivePromptService)
 * 4. Create agent on Letta server (LettaGateway)
 * 5. Persist mapping to letta_agents table (ILettaAgentRepository)
 *
 * Ported from Letta-Lonely's agent provisioning, adapted for:
 * - Single agent per companion (no NSFW/SFW split)
 * - Awilix DI injection
 * - CompanionPersona entity as input (not LL's assistant + profile)
 */

import type { LettaGateway } from './LettaGateway.js';
import { PersonaBuilder, type PersonaInput } from './PersonaBuilder.js';
import { CognitiveBlockFactory } from './CognitiveBlockFactory.js';
import { CognitivePromptService } from './CognitivePromptService.js';

export interface LettaAgentRepoLike {
  create(data: {
    id: string;
    userId: string;
    companionPersonaId: string;
    conversationId?: string;
    lettaAgentId: string;
    agentType: 'companion' | 'prompt_enhancer';
    agentName: string;
    modelHandle?: string;
    blockIds?: string[];
    contextWindowLimit?: number;
  }): Promise<unknown>;
  findByCompanionPersona(companionPersonaId: string): Promise<{ lettaAgentId: string } | null>;
}

export interface ProvisionInput {
  userId: string;
  companionPersonaId: string;
  companionName: string;
  gender?: 'female' | 'male' | 'non-binary' | null;
  goal?: string;
  style?: string;
  description?: string | null;
  conversationId?: string;
}

export interface ProvisionResult {
  lettaAgentId: string;
  agentName: string;
  blockIds: string[];
}

export interface AgentProvisionerConfig {
  chatModel: string;
  embeddingModel: string;
}

const DEFAULT_CONFIG: AgentProvisionerConfig = {
  chatModel: 'ollama/qwen3-8b-nsfw:latest',
  embeddingModel: 'ollama/nomic-embed-text:latest',
};

export class AgentProvisioner {
  private personaBuilder = new PersonaBuilder();
  private blockFactory = new CognitiveBlockFactory();
  private promptService = new CognitivePromptService();

  constructor(
    private lettaGateway: LettaGateway,
    private lettaAgentRepository?: LettaAgentRepoLike,
    private config: AgentProvisionerConfig = DEFAULT_CONFIG,
  ) {}

  /**
   * Provision a Letta agent for a companion persona.
   * If an agent already exists for this persona, returns the existing one.
   */
  async provisionCompanionAgent(input: ProvisionInput): Promise<ProvisionResult> {
    // Check if agent already exists
    if (this.lettaAgentRepository) {
      const existing = await this.lettaAgentRepository.findByCompanionPersona(input.companionPersonaId);
      if (existing) {
        console.log(`[AgentProvisioner] Agent already exists for persona ${input.companionPersonaId}`);
        return {
          lettaAgentId: existing.lettaAgentId,
          agentName: `companion_${input.companionName}`,
          blockIds: [],
        };
      }
    }

    console.log(`[AgentProvisioner] Provisioning agent for ${input.companionName}`);

    // 1. Build persona text
    const personaInput: PersonaInput = {
      name: input.companionName,
      gender: input.gender,
      goal: input.goal,
      style: input.style,
      description: input.description,
    };
    const personaText = this.personaBuilder.buildPersona(personaInput);

    // 2. Create persona + cognitive blocks on Letta
    const cognitiveBlockDefs = this.blockFactory.getCognitiveBlockDefinitions(input.companionName);
    const allBlockDefs = [
      { label: 'persona', value: personaText, limit: 4000 },
      ...cognitiveBlockDefs,
    ];
    const allBlocks = await this.lettaGateway.createMemoryBlocks(allBlockDefs);

    // 4. Build system prompt with cognitive instructions
    const cognitiveInstructions = this.promptService.getCognitiveInstructions();
    const systemPrompt = [
      `You are ${input.companionName}, a companion created to connect with the user.`,
      cognitiveInstructions,
    ].join('\n\n');

    // 5. Collect all block IDs
    const allBlockIds = allBlocks.map((b) => b.id);

    // 6. Create agent on Letta server
    const agentName = `companion_${input.companionName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const agent = await this.lettaGateway.createAgent({
      name: agentName,
      conversationId: input.conversationId || '',
      agentType: 'companion',
      blockIds: allBlockIds,
      system: systemPrompt,
      modelHandle: this.config.chatModel,
      embeddingHandle: this.config.embeddingModel,
      metadata: {
        companionPersonaId: input.companionPersonaId,
        userId: input.userId,
      },
    });

    console.log(`[AgentProvisioner] Agent created: ${agent.id} (${agentName})`);

    // 7. Persist to DB
    if (this.lettaAgentRepository) {
      try {
        await this.lettaAgentRepository.create({
          id: `la_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId: input.userId,
          companionPersonaId: input.companionPersonaId,
          conversationId: input.conversationId,
          lettaAgentId: agent.id,
          agentType: 'companion',
          agentName,
          modelHandle: this.config.chatModel,
          blockIds: allBlockIds,
        });
      } catch (err) {
        console.warn(`[AgentProvisioner] DB persist failed, agent still created on Letta`, err);
      }
    }

    return {
      lettaAgentId: agent.id,
      agentName,
      blockIds: allBlockIds,
    };
  }
}
