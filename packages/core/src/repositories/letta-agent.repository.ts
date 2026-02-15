/**
 * Letta Agent Repository Implementation
 *
 * Drizzle ORM implementation for letta_agents table.
 */

import type { Database } from '@anplexa/database';
import { lettaAgents, eq, and } from '@anplexa/database';
import type {
  ILettaAgentRepository,
  LettaAgentRecord,
  CreateLettaAgentData,
} from './interfaces/letta-agent.repository.interface.js';

export class LettaAgentRepository implements ILettaAgentRepository {
  constructor(private readonly db: Database) {}

  async create(data: CreateLettaAgentData): Promise<LettaAgentRecord> {
    const [result] = await this.db
      .insert(lettaAgents)
      .values({
        id: data.id,
        userId: data.userId,
        companionPersonaId: data.companionPersonaId,
        conversationId: data.conversationId || null,
        lettaAgentId: data.lettaAgentId,
        agentType: data.agentType,
        agentName: data.agentName,
        modelHandle: data.modelHandle || null,
        blockIds: data.blockIds ? JSON.stringify(data.blockIds) : null,
        contextWindowLimit: data.contextWindowLimit || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async findByLettaAgentId(lettaAgentId: string): Promise<LettaAgentRecord | null> {
    const results = await this.db
      .select()
      .from(lettaAgents)
      .where(and(eq(lettaAgents.lettaAgentId, lettaAgentId), eq(lettaAgents.isActive, true)))
      .limit(1);

    return results[0] || null;
  }

  async findByCompanionPersona(companionPersonaId: string): Promise<LettaAgentRecord | null> {
    const results = await this.db
      .select()
      .from(lettaAgents)
      .where(and(
        eq(lettaAgents.companionPersonaId, companionPersonaId),
        eq(lettaAgents.agentType, 'companion'),
        eq(lettaAgents.isActive, true),
      ))
      .limit(1);

    return results[0] || null;
  }

  async findByConversation(conversationId: string): Promise<LettaAgentRecord | null> {
    const results = await this.db
      .select()
      .from(lettaAgents)
      .where(and(eq(lettaAgents.conversationId, conversationId), eq(lettaAgents.isActive, true)))
      .limit(1);

    return results[0] || null;
  }

  async findActiveByUserId(userId: string): Promise<LettaAgentRecord[]> {
    return this.db
      .select()
      .from(lettaAgents)
      .where(and(eq(lettaAgents.userId, userId), eq(lettaAgents.isActive, true)));
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(lettaAgents)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(lettaAgents.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(lettaAgents).where(eq(lettaAgents.id, id));
  }
}
