/**
 * DrizzleBirthChartRepository
 *
 * Drizzle ORM implementation of IBirthChartRepository.
 * Handles persistence of BirthChart aggregates.
 */

import { IBirthChartRepository } from '@anplexa/cosmic-companion/domain/repositories';
import { BirthChart } from '@anplexa/cosmic-companion/domain/entities';
import { ZodiacSign, type ZodiacSignName } from '@anplexa/cosmic-companion/domain/value-objects';
import { GeoLocation } from '@anplexa/cosmic-companion/domain/value-objects';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { birthCharts } from '@anplexa/database/schema';

export class DrizzleBirthChartRepository implements IBirthChartRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async save(birthChart: BirthChart): Promise<void> {
    const data = {
      id: birthChart.id,
      userId: birthChart.userId,
      birthDate: birthChart.birthDate.toISOString(),
      birthTime: birthChart.birthTime,
      latitude: birthChart.birthLocation.latitude,
      longitude: birthChart.birthLocation.longitude,
      timezone: birthChart.birthLocation.timezone,
      city: birthChart.birthLocation.city,
      country: birthChart.birthLocation.country,
      sunSign: birthChart.sunSign.name,
      moonSign: birthChart.moonSign.name,
      venusSign: birthChart.venusSign.name,
      marsSign: birthChart.marsSign.name,
      risingSign: birthChart.risingSign.name,
      mercurySign: birthChart.mercurySign?.name,
      jupiterSign: birthChart.jupiterSign?.name,
      saturnSign: birthChart.saturnSign?.name,
      createdAt: birthChart.createdAt.toISOString(),
      updatedAt: birthChart.updatedAt.toISOString()
    };

    await this.db
      .insert(birthCharts)
      .values(data)
      .onConflictDoUpdate({
        target: birthCharts.id,
        set: data
      });
  }

  async findById(id: string): Promise<BirthChart | null> {
    const result = await this.db
      .select()
      .from(birthCharts)
      .where(eq(birthCharts.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findByUserId(userId: string): Promise<BirthChart | null> {
    const result = await this.db
      .select()
      .from(birthCharts)
      .where(eq(birthCharts.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(birthCharts).where(eq(birthCharts.id, id));
  }

  private toDomain(row: any): BirthChart {
    const location = GeoLocation.create(
      row.latitude,
      row.longitude,
      row.timezone,
      row.city,
      row.country
    );

    return BirthChart.reconstitute({
      id: row.id,
      userId: row.userId,
      birthDate: new Date(row.birthDate),
      birthTime: row.birthTime,
      birthLocation: location,
      sunSign: ZodiacSign.fromName(row.sunSign as ZodiacSignName),
      moonSign: ZodiacSign.fromName(row.moonSign as ZodiacSignName),
      venusSign: ZodiacSign.fromName(row.venusSign as ZodiacSignName),
      marsSign: ZodiacSign.fromName(row.marsSign as ZodiacSignName),
      risingSign: ZodiacSign.fromName(row.risingSign as ZodiacSignName),
      mercurySign: row.mercurySign ? ZodiacSign.fromName(row.mercurySign as ZodiacSignName) : undefined,
      jupiterSign: row.jupiterSign ? ZodiacSign.fromName(row.jupiterSign as ZodiacSignName) : undefined,
      saturnSign: row.saturnSign ? ZodiacSign.fromName(row.saturnSign as ZodiacSignName) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}
