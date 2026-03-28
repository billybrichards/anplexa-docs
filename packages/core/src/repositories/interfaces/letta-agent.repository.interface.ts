/**
 * Letta Agent Repository Interface
 *
 * Persists the mapping between companion personas and Letta server agents.
 */

export interface LettaAgentRecord {
  id: string;
  userId: string;
  companionPersonaId: string;
  conversationId: string | null;
  lettaAgentId: string;
  agentType: string;
  agentName: string;
  modelHandle: string | null;
  blockIds: string | null; // JSON array
  contextWindowLimit: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateLettaAgentData {
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
}

export interface ILettaAgentRepository {
  create(data: CreateLettaAgentData): Promise<LettaAgentRecord>;
  findByLettaAgentId(lettaAgentId: string): Promise<LettaAgentRecord | null>;
  findByCompanionPersona(companionPersonaId: string): Promise<LettaAgentRecord | null>;
  findByCompanionPersonaId(companionPersonaId: string): Promise<LettaAgentRecord[]>;
  findByConversation(conversationId: string): Promise<LettaAgentRecord | null>;
  findActiveByUserId(userId: string): Promise<LettaAgentRecord[]>;
  deactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
