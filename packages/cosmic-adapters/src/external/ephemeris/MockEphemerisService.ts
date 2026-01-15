/**
 * MockEphemerisService
 *
 * Mock implementation of IEphemerisService for development.
 * Replace with real Swiss Ephemeris or astrology API in production.
 */

import { IEphemerisService, type ChartCalculationResult } from '@anplexa/cosmic-companion/use-cases/ports';
import { type ZodiacSignName } from '@anplexa/cosmic-companion/domain/value-objects';
import { GeoLocation } from '@anplexa/cosmic-companion/domain/value-objects';

export class MockEphemerisService implements IEphemerisService {
  /**
   * Calculate natal chart (simplified mock version)
   * In production, replace with Swiss Ephemeris calculation
   */
  async calculateChart(
    birthDate: Date,
    birthTime: string,
    location: GeoLocation
  ): Promise<ChartCalculationResult> {
    // Simple mock: derive signs from birth date
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    const sunSign = this.getSunSignFromDate(month, day);

    // Mock: use adjacent signs for other placements
    const signs: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer',
      'leo', 'virgo', 'libra', 'scorpio',
      'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ];

    const sunIndex = signs.indexOf(sunSign);
    const moonSign = signs[(sunIndex + 2) % 12];
    const venusSign = signs[(sunIndex + 1) % 12];
    const marsSign = signs[(sunIndex + 3) % 12];
    const risingSign = signs[(sunIndex + 4) % 12];

    return {
      sun: { sign: sunSign, degree: 15 },
      moon: { sign: moonSign, degree: 20 },
      venus: { sign: venusSign, degree: 10 },
      mars: { sign: marsSign, degree: 25 },
      rising: { sign: risingSign, degree: 5 },
      mercury: { sign: sunSign, degree: 12 },
      jupiter: { sign: signs[(sunIndex + 5) % 12], degree: 18 },
      saturn: { sign: signs[(sunIndex + 6) % 12], degree: 22 }
    };
  }

  /**
   * Get current planetary transits (simplified mock)
   */
  async getCurrentTransits(): Promise<{
    mercuryRetrograde: boolean;
    venusSign: ZodiacSignName;
    marsSign: ZodiacSignName;
    fullMoonSign?: ZodiacSignName;
    newMoonSign?: ZodiacSignName;
  }> {
    const now = new Date();
    const month = now.getMonth() + 1;

    // Mock: set Mercury retrograde 3x/year roughly
    const mercuryRetrograde = month % 4 === 0;

    // Mock: cycle through signs
    const signs: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer',
      'leo', 'virgo', 'libra', 'scorpio',
      'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ];

    return {
      mercuryRetrograde,
      venusSign: signs[month % 12],
      marsSign: signs[(month + 2) % 12],
      fullMoonSign: now.getDate() > 13 && now.getDate() < 17 ? signs[month % 12] : undefined,
      newMoonSign: now.getDate() < 3 ? signs[month % 12] : undefined
    };
  }

  private getSunSignFromDate(month: number, day: number): ZodiacSignName {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    return 'pisces';
  }
}
