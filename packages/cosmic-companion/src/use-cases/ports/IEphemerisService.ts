/**
 * IEphemerisService Port
 *
 * Interface for calculating astrological chart data from birth information.
 * Implementation will use Swiss Ephemeris or astrology API.
 */

import { type ZodiacSignName } from '../../domain/value-objects/ZodiacSign.js';
import { GeoLocation } from '../../domain/value-objects/GeoLocation.js';

export interface ChartCalculationResult {
  sun: { sign: ZodiacSignName; degree: number };
  moon: { sign: ZodiacSignName; degree: number };
  venus: { sign: ZodiacSignName; degree: number };
  mars: { sign: ZodiacSignName; degree: number };
  rising: { sign: ZodiacSignName; degree: number };
  mercury?: { sign: ZodiacSignName; degree: number };
  jupiter?: { sign: ZodiacSignName; degree: number };
  saturn?: { sign: ZodiacSignName; degree: number };
}

export interface IEphemerisService {
  /**
   * Calculate natal chart from birth data
   */
  calculateChart(
    birthDate: Date,
    birthTime: string, // HH:mm format
    location: GeoLocation
  ): Promise<ChartCalculationResult>;

  /**
   * Get current planetary positions (for transit awareness)
   */
  getCurrentTransits(): Promise<{
    mercuryRetrograde: boolean;
    venusSign: ZodiacSignName;
    marsSign: ZodiacSignName;
    fullMoonSign?: ZodiacSignName;
    newMoonSign?: ZodiacSignName;
  }>;
}
