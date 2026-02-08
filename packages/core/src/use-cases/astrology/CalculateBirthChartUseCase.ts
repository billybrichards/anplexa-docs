/**
 * Calculate Birth Chart Use Case
 *
 * Handles the calculation and storage of a new birth chart.
 * Orchestrates domain entities, repository, and calculation service.
 */

import type { IBirthChartRepository } from '../../repositories/interfaces/birth-chart.repository.interface.js';
import type { IAstrologyCalculationService } from '../../domain/services/IAstrologyCalculationService.js';
import { BirthChart } from '../../domain/entities/BirthChart.js';
import { BirthData } from '../../domain/value-objects/astrology/BirthData.js';

/**
 * Input DTO
 */
export interface CalculateBirthChartInput {
  userId: string;
  birthDate: string; // ISO date string
  birthTime: string | null; // HH:MM or null
  timeZone: string; // IANA timezone
  latitude: number;
  longitude: number;
  placeName: string;
  country: string;
  displayName?: string | null;
  setAsActive?: boolean;
  houseSystem?: 'placidus' | 'whole_sign' | 'koch' | 'equal';
}

/**
 * Output DTO
 */
export interface CalculateBirthChartOutput {
  birthChart: BirthChart;
  sunSign: string;
  moonSign: string;
  risingSign: string | null;
  interpretation: string;
  companionContext: string;
}

/**
 * Calculate Birth Chart Use Case
 */
export class CalculateBirthChartUseCase {
  constructor(
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly astrologyService: IAstrologyCalculationService
  ) {}

  async execute(input: CalculateBirthChartInput): Promise<CalculateBirthChartOutput> {
    // 1. Validate and create BirthData value object
    const birthData = BirthData.create({
      date: new Date(input.birthDate),
      time: input.birthTime,
      timeZone: input.timeZone,
      latitude: input.latitude,
      longitude: input.longitude,
      placeName: input.placeName,
      country: input.country,
      timeKnown: input.birthTime !== null,
    });

    // 2. Check if identical chart already exists
    const existingCharts = await this.birthChartRepository.getAllByUserId(input.userId);
    const duplicate = existingCharts.find((chart) => chart.birthData.equals(birthData));
    if (duplicate) {
      throw new Error('A birth chart with identical birth data already exists');
    }

    // 3. Calculate natal chart via astrology service
    const chartData = await this.astrologyService.calculateNatalChart(birthData, {
      houseSystem: input.houseSystem ?? 'placidus',
    });

    // 4. Generate interpretation and companion context
    const interpretation = await this.astrologyService.generateInterpretation(chartData);
    const companionContext = await this.astrologyService.generateCompanionContext(chartData);

    // 5. If setting as active, deactivate existing charts
    if (input.setAsActive !== false) {
      await this.birthChartRepository.deactivateAllForUser(input.userId);
    }

    // 6. Create and persist the birth chart entity
    const chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const birthChart = BirthChart.create(
      chartId,
      input.userId,
      birthData,
      chartData,
      input.displayName ?? undefined
    );

    const savedChart = await this.birthChartRepository.create({
      id: birthChart.id,
      userId: birthChart.userId,
      birthData: birthChart.birthData,
      chartData: birthChart.chartData,
      displayName: birthChart.displayName,
      isActive: birthChart.isActive,
    });

    // 7. Return output DTO
    const bigThree = savedChart.chartData.getBigThree();
    return {
      birthChart: savedChart,
      sunSign: bigThree.sun,
      moonSign: bigThree.moon,
      risingSign: bigThree.rising,
      interpretation,
      companionContext,
    };
  }
}
