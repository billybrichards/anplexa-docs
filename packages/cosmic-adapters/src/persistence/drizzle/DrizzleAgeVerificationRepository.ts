/**
 * DrizzleAgeVerificationRepository
 *
 * Drizzle ORM implementation of IAgeVerificationRepository.
 */

import { IAgeVerificationRepository } from '@anplexa/cosmic-companion/domain/repositories';
import { AgeVerification } from '@anplexa/cosmic-companion/domain/entities';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ageVerifications } from '@anplexa/database/schema';

export class DrizzleAgeVerificationRepository implements IAgeVerificationRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async save(verification: AgeVerification): Promise<void> {
    const data = {
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      method: verification.method,
      verifiedAt: verification.verifiedAt?.toISOString(),
      expiresAt: verification.expiresAt?.toISOString(),
      providerSessionId: verification.providerSessionId,
      metadata: undefined, // Will be set in domain if needed
      createdAt: verification.createdAt.toISOString(),
      updatedAt: verification.updatedAt.toISOString()
    };

    await this.db
      .insert(ageVerifications)
      .values(data)
      .onConflictDoUpdate({
        target: ageVerifications.id,
        set: data
      });
  }

  async findById(id: string): Promise<AgeVerification | null> {
    const result = await this.db
      .select()
      .from(ageVerifications)
      .where(eq(ageVerifications.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return this.toDomain(result[0]);
  }

  async findByUserId(userId: string): Promise<AgeVerification | null> {
    const result = await this.db
      .select()
      .from(ageVerifications)
      .where(eq(ageVerifications.userId, userId))
      .limit(1);

    if (result.length === 0) return null;
    return this.toDomain(result[0]);
  }

  async findByProviderSessionId(sessionId: string): Promise<AgeVerification | null> {
    const result = await this.db
      .select()
      .from(ageVerifications)
      .where(eq(ageVerifications.providerSessionId, sessionId))
      .limit(1);

    if (result.length === 0) return null;
    return this.toDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(ageVerifications).where(eq(ageVerifications.id, id));
  }

  private toDomain(row: any): AgeVerification {
    return AgeVerification.reconstitute({
      id: row.id,
      userId: row.userId,
      status: row.status,
      method: row.method,
      verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : undefined,
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      providerSessionId: row.providerSessionId,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}
