/**
 * CreateBirthChartUseCase
 *
 * Creates a user's natal (birth) chart by calculating planetary positions.
 */

import { BirthChart } from '../../domain/entities/BirthChart.js';
import { GeoLocation } from '../../domain/value-objects/GeoLocation.js';
import { IBirthChartRepository } from '../../domain/repositories/IBirthChartRepository.js';
import { IEphemerisService } from '../ports/IEphemerisService.js';
import { randomUUID } from 'crypto';

export interface CreateBirthChartInput {
  userId: string;
  birthDate: Date;
  birthTime: string; // HH:mm format
  latitude: number;
  longitude: number;
  timezone: string;
  city?: string;
  country?: string;
}

export interface CreateBirthChartOutput {
  birthChart: BirthChart;
}

export class CreateBirthChartUseCase {
  constructor(
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly ephemerisService: IEphemerisService
  ) {}

  async execute(input: CreateBirthChartInput): Promise<CreateBirthChartOutput> {
    // Check if user already has a birth chart
    const existing = await this.birthChartRepository.findByUserId(input.userId);
    if (existing) {
      // Update existing chart instead of creating new
      return { birthChart: existing };
    }

    // Create location value object
    const location = GeoLocation.create(
      input.latitude,
      input.longitude,
      input.timezone,
      input.city,
      input.country
    );

    // Calculate chart using ephemeris service
    const chartData = await this.ephemerisService.calculateChart(
      input.birthDate,
      input.birthTime,
      location
    );

    // Create birth chart entity
    const birthChart = BirthChart.create(
      randomUUID(),
      input.userId,
      input.birthDate,
      input.birthTime,
      location,
      {
        sun: chartData.sun.sign,
        moon: chartData.moon.sign,
        venus: chartData.venus.sign,
        mars: chartData.mars.sign,
        rising: chartData.rising.sign,
        mercury: chartData.mercury?.sign,
        jupiter: chartData.jupiter?.sign,
        saturn: chartData.saturn?.sign
      }
    );

    // Persist
    await this.birthChartRepository.save(birthChart);

    return { birthChart };
  }
}
