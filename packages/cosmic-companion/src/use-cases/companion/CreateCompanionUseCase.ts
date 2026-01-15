/**
 * CreateCompanionUseCase
 *
 * Creates an AI companion with astrological personality matched to user's birth chart.
 */

import { Companion } from '../../domain/entities/Companion.js';
import { BirthChart } from '../../domain/entities/BirthChart.js';
import { CompatibilityService } from '../../domain/services/CompatibilityService.js';
import { IBirthChartRepository } from '../../domain/repositories/IBirthChartRepository.js';
import { ICompanionRepository } from '../../domain/repositories/ICompanionRepository.js';
import { ContentTier } from '../../domain/value-objects/ContentTier.js';
import { BirthChartNotFoundError, CompanionLimitExceededError } from '../../domain/errors/CosmicDomainError.js';
import { type AppearanceData } from '../../domain/value-objects/AppearanceConfig.js';
import { type PersonalityDimensions } from '../../domain/value-objects/PersonalitySliders.js';
import { randomUUID } from 'crypto';

export interface CreateCompanionInput {
  userId: string;
  name: string;
  userTier: 'free' | 'astrology-seeker' | 'cosmic-soulmate' | 'astral-intimacy';
  appearance: AppearanceData;
  personalityAdjustments?: PersonalityDimensions;
}

export interface CreateCompanionOutput {
  companion: Companion;
  explanation: string;
}

export class CreateCompanionUseCase {
  constructor(
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly companionRepository: ICompanionRepository,
    private readonly compatibilityService: CompatibilityService
  ) {}

  async execute(input: CreateCompanionInput): Promise<CreateCompanionOutput> {
    // Get user's birth chart
    const birthChart = await this.birthChartRepository.findByUserId(input.userId);
    if (!birthChart) {
      throw new BirthChartNotFoundError(input.userId);
    }

    // Check companion limit for user's tier
    const tier = ContentTier.fromName(input.userTier);
    const existingCount = await this.companionRepository.countByUserId(input.userId);
    if (!tier.canCreateCompanion(existingCount)) {
      throw new CompanionLimitExceededError(tier.toJSON().maxCompanions);
    }

    // Generate optimal companion personality using compatibility service
    const companionPersonality = this.compatibilityService.generateOptimalCompanion(birthChart);

    // Create companion entity
    const companion = Companion.create(
      randomUUID(),
      input.userId,
      input.name,
      {
        sun: companionPersonality.sun,
        moon: companionPersonality.moon,
        venus: companionPersonality.venus,
        mars: companionPersonality.mars,
        rising: companionPersonality.rising
      },
      companionPersonality.compatibilityScore,
      input.appearance,
      input.personalityAdjustments
    );

    // Persist
    await this.companionRepository.save(companion);

    return {
      companion,
      explanation: companionPersonality.explanation
    };
  }
}
