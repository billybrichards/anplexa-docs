/**
 * Companion Persona Repository Implementation
 *
 * Implements ICompanionPersonaRepository using Drizzle ORM.
 * Stores companion personas with JSON-serialized value objects.
 */

import type { Database } from '@anplexa/database';
import { companionPersonas, eq, and, desc } from '@anplexa/database';
import type {
  ICompanionPersonaRepository,
  CreateCompanionPersonaData,
  UpdateCompanionPersonaData,
} from './interfaces/companion-persona.repository.interface';
import { CompanionPersona } from '../domain/entities/CompanionPersona';
import { PersonalityTraits } from '../domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle } from '../domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '../domain/value-objects/companion/EmotionalApproach';

export class CompanionPersonaRepository implements ICompanionPersonaRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<CompanionPersona | null> {
    const result = await this.db
      .select()
      .from(companionPersonas)
      .where(eq(companionPersonas.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async getActiveByUserId(userId: string): Promise<CompanionPersona | null> {
    const result = await this.db
      .select()
      .from(companionPersonas)
      .where(and(eq(companionPersonas.userId, userId), eq(companionPersonas.isActive, true)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async getAllByUserId(userId: string): Promise<CompanionPersona[]> {
    const results = await this.db
      .select()
      .from(companionPersonas)
      .where(eq(companionPersonas.userId, userId))
      .orderBy(desc(companionPersonas.createdAt));

    return results.map((row) => this.toDomain(row));
  }

  async getByBirthChartId(birthChartId: string): Promise<CompanionPersona | null> {
    const result = await this.db
      .select()
      .from(companionPersonas)
      .where(eq(companionPersonas.birthChartId, birthChartId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async create(data: CreateCompanionPersonaData): Promise<CompanionPersona> {
    const now = new Date().toISOString();

    const insertData = {
      id: data.id,
      userId: data.userId,
      birthChartId: data.birthChartId,
      name: data.name,
      personalityTraits: JSON.stringify(data.personalityTraits.toJSON()),
      communicationStyle: JSON.stringify(data.communicationStyle.toJSON()),
      emotionalApproach: JSON.stringify(data.emotionalApproach.toJSON()),
      systemPrompt: data.systemPrompt,
      llmModel: data.llmModel,
      generationReasoning: data.reasoning ?? null,
      generatedAt: now,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.db
      .insert(companionPersonas)
      .values(insertData)
      .returning();

    return this.toDomain(result[0]);
  }

  async update(id: string, data: UpdateCompanionPersonaData): Promise<CompanionPersona> {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.systemPrompt !== undefined) {
      updateData.systemPrompt = data.systemPrompt;
    }
    if (data.llmModel !== undefined) {
      updateData.llmModel = data.llmModel;
      updateData.generatedAt = now;
    }
    if (data.reasoning !== undefined) {
      updateData.generationReasoning = data.reasoning;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const result = await this.db
      .update(companionPersonas)
      .set(updateData)
      .where(eq(companionPersonas.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Companion persona with id ${id} not found`);
    }

    return this.toDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(companionPersonas).where(eq(companionPersonas.id, id));
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.db
      .update(companionPersonas)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(companionPersonas.userId, userId));
  }

  async setActivePersona(userId: string, personaId: string): Promise<void> {
    // First deactivate all personas for user
    await this.deactivateAllForUser(userId);

    // Then activate the specified persona
    await this.db
      .update(companionPersonas)
      .set({ isActive: true, updatedAt: new Date().toISOString() })
      .where(eq(companionPersonas.id, personaId));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: typeof companionPersonas.$inferSelect): CompanionPersona {
    const personalityTraitsJson =
      typeof row.personalityTraits === 'string'
        ? JSON.parse(row.personalityTraits)
        : row.personalityTraits;
    const communicationStyleJson =
      typeof row.communicationStyle === 'string'
        ? JSON.parse(row.communicationStyle)
        : row.communicationStyle;
    const emotionalApproachJson =
      typeof row.emotionalApproach === 'string'
        ? JSON.parse(row.emotionalApproach)
        : row.emotionalApproach;

    return CompanionPersona.fromPersistence({
      id: row.id,
      userId: row.userId,
      birthChartId: row.birthChartId,
      name: row.name,
      personalityTraits: PersonalityTraits.fromJSON(personalityTraitsJson),
      communicationStyle: CommunicationStyle.fromJSON(communicationStyleJson),
      emotionalApproach: EmotionalApproach.fromJSON(emotionalApproachJson),
      systemPrompt: row.systemPrompt,
      generationMetadata: {
        llmModel: row.llmModel,
        reasoning: row.generationReasoning ?? undefined,
        generatedAt: new Date(row.generatedAt),
      },
      isActive: row.isActive ?? true,
      createdAt: new Date(row.createdAt ?? Date.now()),
      updatedAt: new Date(row.updatedAt ?? Date.now()),
    });
  }
}
