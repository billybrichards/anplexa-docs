/**
 * CompatibilityScore Value Object
 *
 * Represents the synastry (relationship astrology) compatibility between
 * a user's birth chart and an AI companion's astrological personality.
 */

import { ZodiacSign } from './ZodiacSign.js';

export interface SynastryBreakdown {
  sunCompatibility: number;      // Core personality alignment (25% weight)
  moonCompatibility: number;     // Emotional connection (25% weight)
  venusCompatibility: number;    // Love language match (20% weight)
  marsCompatibility: number;     // Sexual compatibility (20% weight)
  risingCompatibility: number;   // Surface harmony (10% weight)
  overallScore: number;          // Weighted total (0-100)
  label: 'Twin Flame Connection' | 'Soul Match' | 'Cosmic Attraction' | 'Karmic Bond' | 'Growing Connection';
}

export class CompatibilityScore {
  private static readonly WEIGHTS = {
    sun: 0.25,
    moon: 0.25,
    venus: 0.20,
    mars: 0.20,
    rising: 0.10
  };

  private constructor(
    private readonly breakdown: SynastryBreakdown
  ) {}

  get overall(): number {
    return this.breakdown.overallScore;
  }

  get label(): string {
    return this.breakdown.label;
  }

  get sun(): number {
    return this.breakdown.sunCompatibility;
  }

  get moon(): number {
    return this.breakdown.moonCompatibility;
  }

  get venus(): number {
    return this.breakdown.venusCompatibility;
  }

  get mars(): number {
    return this.breakdown.marsCompatibility;
  }

  get rising(): number {
    return this.breakdown.risingCompatibility;
  }

  /**
   * Calculate compatibility between two astrological profiles
   */
  static calculate(
    userSigns: {
      sun: ZodiacSign;
      moon: ZodiacSign;
      venus: ZodiacSign;
      mars: ZodiacSign;
      rising: ZodiacSign;
    },
    companionSigns: {
      sun: ZodiacSign;
      moon: ZodiacSign;
      venus: ZodiacSign;
      mars: ZodiacSign;
      rising: ZodiacSign;
    }
  ): CompatibilityScore {
    // Calculate individual compatibilities
    const sunCompatibility = userSigns.sun.getCompatibilityScore(companionSigns.sun);
    const moonCompatibility = userSigns.moon.getCompatibilityScore(companionSigns.moon);
    const venusCompatibility = userSigns.venus.getCompatibilityScore(companionSigns.venus);
    const marsCompatibility = userSigns.mars.getCompatibilityScore(companionSigns.mars);
    const risingCompatibility = userSigns.rising.getCompatibilityScore(companionSigns.rising);

    // Calculate weighted overall score
    const overallScore = Math.round(
      sunCompatibility * CompatibilityScore.WEIGHTS.sun +
      moonCompatibility * CompatibilityScore.WEIGHTS.moon +
      venusCompatibility * CompatibilityScore.WEIGHTS.venus +
      marsCompatibility * CompatibilityScore.WEIGHTS.mars +
      risingCompatibility * CompatibilityScore.WEIGHTS.rising
    );

    // Determine label based on overall score
    let label: SynastryBreakdown['label'];
    if (overallScore >= 85) {
      label = 'Twin Flame Connection';
    } else if (overallScore >= 70) {
      label = 'Soul Match';
    } else if (overallScore >= 55) {
      label = 'Cosmic Attraction';
    } else if (overallScore >= 40) {
      label = 'Karmic Bond';
    } else {
      label = 'Growing Connection';
    }

    return new CompatibilityScore({
      sunCompatibility,
      moonCompatibility,
      venusCompatibility,
      marsCompatibility,
      risingCompatibility,
      overallScore,
      label
    });
  }

  /**
   * Get human-readable description of compatibility
   */
  getDescription(): string {
    if (this.overall >= 85) {
      return 'Your astrological charts create an extraordinary cosmic connection. This is a rare twin flame alignment.';
    } else if (this.overall >= 70) {
      return 'Strong astrological harmony across multiple placements. A powerful soul match connection.';
    } else if (this.overall >= 55) {
      return 'Positive cosmic attraction with complementary energies. A promising astrological pairing.';
    } else if (this.overall >= 40) {
      return 'A karmic bond with lessons to learn from each other. Growth through connection.';
    } else {
      return 'A developing connection that grows through understanding and adaptation.';
    }
  }

  toJSON(): SynastryBreakdown {
    return { ...this.breakdown };
  }
}
