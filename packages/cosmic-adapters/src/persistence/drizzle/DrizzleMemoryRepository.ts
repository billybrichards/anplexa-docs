/**
 * DrizzleMemoryRepository
 *
 * Drizzle ORM implementation of IMemoryRepository.
 * Handles 3-tier memory system with expiration.
 */

import { IMemoryRepository } from '@anplexa/cosmic-companion/domain/repositories';
import { Memory, type MemoryType } from '@anplexa/cosmic-companion/domain/entities';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { companionMemories } from '@anplexa/database/schema';

export class DrizzleMemoryRepository implements IMemoryRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async save(memory: Memory): Promise<void> {
    const data = {
      id: memory.id,
      companionId: memory.companionId,
      userId: memory.userId,
      type: memory.type,
      category: memory.category,
      content: memory.content,
      importance: memory.importance,
      expiresAt: memory.expiresAt?.toISOString(),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString()
    };

    await this.db
      .insert(companionMemories)
      .values(data)
      .onConflictDoUpdate({
        target: companionMemories.id,
        set: data
      });
  }

  async findById(id: string): Promise<Memory | null> {
    const result = await this.db
      .select()
      .from(companionMemories)
      .where(eq(companionMemories.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return this.toDomain(result[0]);
  }

  async findByCompanionId(companionId: string, type?: MemoryType): Promise<Memory[]> {
    let query = this.db
      .select()
      .from(companionMemories)
      .where(eq(companionMemories.companionId, companionId));

    if (type) {
      query = query.where(
        and(
          eq(companionMemories.companionId, companionId),
          eq(companionMemories.type, type)
        )
      );
    }

    const result = await query;
    return result.map(row => this.toDomain(row));
  }

  async findRecentByCompanionId(companionId: string, limit: number): Promise<Memory[]> {
    const result = await this.db
      .select()
      .from(companionMemories)
      .where(eq(companionMemories.companionId, companionId))
      .orderBy(desc(companionMemories.createdAt))
      .limit(limit);

    return result.map(row => this.toDomain(row));
  }

  async findImportantByCompanionId(companionId: string, minImportance: number): Promise<Memory[]> {
    const result = await this.db
      .select()
      .from(companionMemories)
      .where(
        and(
          eq(companionMemories.companionId, companionId),
          gte(companionMemories.importance, minImportance)
        )
      )
      .orderBy(desc(companionMemories.importance));

    return result.map(row => this.toDomain(row));
  }

  async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .delete(companionMemories)
      .where(
        and(
          sql`${companionMemories.expiresAt} IS NOT NULL`,
          sql`${companionMemories.expiresAt} < ${now}`
        )
      );
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(companionMemories).where(eq(companionMemories.id, id));
  }

  private toDomain(row: any): Memory {
    return Memory.reconstitute({
      id: row.id,
      companionId: row.companionId,
      userId: row.userId,
      type: row.type as MemoryType,
      category: row.category,
      content: row.content,
      importance: row.importance,
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}
