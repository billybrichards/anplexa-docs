/**
 * DrizzleCompanionRepository
 *
 * Drizzle ORM implementation of ICompanionRepository.
 */

import { ICompanionRepository } from '@anplexa/cosmic-companion/domain/repositories';
import { Companion } from '@anplexa/cosmic-companion/domain/entities';
import { ZodiacSign, type ZodiacSignName } from '@anplexa/cosmic-companion/domain/value-objects';
import { CompatibilityScore } from '@anplexa/cosmic-companion/domain/value-objects';
import { AppearanceConfig } from '@anplexa/cosmic-companion/domain/value-objects';
import { PersonalitySliders } from '@anplexa/cosmic-companion/domain/value-objects';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { companions } from '@anplexa/database/schema';

export class DrizzleCompanionRepository implements ICompanionRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async save(companion: Companion): Promise<void> {
    const data = {
      id: companion.id,
      userId: companion.userId,
      name: companion.name,
      sunSign: companion.sunSign.name,
      moonSign: companion.moonSign.name,
      venusSign: companion.venusSign.name,
      marsSign: companion.marsSign.name,
      risingSign: companion.risingSign.name,
      compatibilityScore: JSON.stringify(companion.compatibilityScore.toJSON()),
      appearance: JSON.stringify(companion.appearance.toJSON()),
      personalitySliders: JSON.stringify(companion.personalitySliders.toJSON()),
      voiceId: companion.voiceId,
      createdAt: companion.createdAt.toISOString(),
      updatedAt: companion.updatedAt.toISOString()
    };

    await this.db
      .insert(companions)
      .values(data)
      .onConflictDoUpdate({
        target: companions.id,
        set: data
      });
  }

  async findById(id: string): Promise<Companion | null> {
    const result = await this.db
      .select()
      .from(companions)
      .where(eq(companions.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return this.toDomain(result[0]);
  }

  async findByUserId(userId: string): Promise<Companion[]> {
    const result = await this.db
      .select()
      .from(companions)
      .where(eq(companions.userId, userId));

    return result.map(row => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(companions).where(eq(companions.id, id));
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(companions)
      .where(eq(companions.userId, userId));

    return result.length;
  }

  private toDomain(row: any): Companion {
    const compatData = JSON.parse(row.compatibilityScore);
    const appearanceData = JSON.parse(row.appearance);
    const sliderData = JSON.parse(row.personalitySliders);

    // Reconstruct CompatibilityScore
    const compatibilityScore = CompatibilityScore.calculate(
      {
        sun: ZodiacSign.fromName(row.sunSign as ZodiacSignName),
        moon: ZodiacSign.fromName(row.moonSign as ZodiacSignName),
        venus: ZodiacSign.fromName(row.venusSign as ZodiacSignName),
        mars: ZodiacSign.fromName(row.marsSign as ZodiacSignName),
        rising: ZodiacSign.fromName(row.risingSign as ZodiacSignName)
      },
      {
        sun: ZodiacSign.fromName(row.sunSign as ZodiacSignName),
        moon: ZodiacSign.fromName(row.moonSign as ZodiacSignName),
        venus: ZodiacSign.fromName(row.venusSign as ZodiacSignName),
        mars: ZodiacSign.fromName(row.marsSign as ZodiacSignName),
        rising: ZodiacSign.fromName(row.risingSign as ZodiacSignName)
      }
    );

    return Companion.reconstitute({
      id: row.id,
      userId: row.userId,
      name: row.name,
      sunSign: ZodiacSign.fromName(row.sunSign as ZodiacSignName),
      moonSign: ZodiacSign.fromName(row.moonSign as ZodiacSignName),
      venusSign: ZodiacSign.fromName(row.venusSign as ZodiacSignName),
      marsSign: ZodiacSign.fromName(row.marsSign as ZodiacSignName),
      risingSign: ZodiacSign.fromName(row.risingSign as ZodiacSignName),
      compatibilityScore,
      appearance: AppearanceConfig.create(appearanceData),
      personalitySliders: PersonalitySliders.create(sliderData),
      voiceId: row.voiceId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}
