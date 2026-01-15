/**
 * CompatibilityService (Domain Service)
 *
 * Generates optimal AI companion astrological personality based on user's birth chart.
 * Uses synastry principles to create complementary zodiac placements.
 */

import { BirthChart } from '../entities/BirthChart.js';
import { ZodiacSign, type ZodiacSignName, type Element } from '../value-objects/ZodiacSign.js';
import { CompatibilityScore } from '../value-objects/CompatibilityScore.js';

export interface CompanionPersonality {
  sun: ZodiacSignName;
  moon: ZodiacSignName;
  venus: ZodiacSignName;
  mars: ZodiacSignName;
  rising: ZodiacSignName;
  compatibilityScore: CompatibilityScore;
  explanation: string;
}

export class CompatibilityService {
  /**
   * Generate optimal companion personality based on user's birth chart
   *
   * Strategy:
   * - Sun: Complement user's element (fire<->air, earth<->water) for balance
   * - Moon: Match user's moon for emotional understanding
   * - Venus: Match user's Venus for love language harmony
   * - Mars: Create trine/sextile for sexual chemistry
   * - Rising: Complement for good first impression
   */
  generateOptimalCompanion(userChart: BirthChart): CompanionPersonality {
    const userSigns = userChart.getMajorPlacements();

    // Sun: Complement element for balance
    const companionSun = this.getComplementarySunSign(userSigns.sun);

    // Moon: Match or complement for emotional connection
    const companionMoon = this.getComplementaryMoonSign(userSigns.moon);

    // Venus: Match for love language harmony
    const companionVenus = this.getMatchingVenusSign(userSigns.venus);

    // Mars: Create trine/sextile for passion
    const companionMars = this.getComplementaryMarsSign(userSigns.mars);

    // Rising: Complement for surface harmony
    const companionRising = this.getComplementaryRisingSign(userSigns.rising);

    // Calculate compatibility score
    const compatibilityScore = CompatibilityScore.calculate(
      {
        sun: userSigns.sun,
        moon: userSigns.moon,
        venus: userSigns.venus,
        mars: userSigns.mars,
        rising: userSigns.rising
      },
      {
        sun: companionSun,
        moon: companionMoon,
        venus: companionVenus,
        mars: companionMars,
        rising: companionRising
      }
    );

    const explanation = this.generateExplanation(
      userSigns,
      { sun: companionSun, moon: companionMoon, venus: companionVenus, mars: companionMars, rising: companionRising },
      compatibilityScore
    );

    return {
      sun: companionSun.name,
      moon: companionMoon.name,
      venus: companionVenus.name,
      mars: companionMars.name,
      rising: companionRising.name,
      compatibilityScore,
      explanation
    };
  }

  /**
   * Get complementary sun sign (balances user's element)
   */
  private getComplementarySunSign(userSun: ZodiacSign): ZodiacSign {
    const complementaryElements: Record<Element, Element> = {
      fire: 'air',    // Air feeds fire
      earth: 'water', // Water nourishes earth
      air: 'fire',    // Fire warms air
      water: 'earth'  // Earth contains water
    };

    const targetElement = complementaryElements[userSun.element];
    const allSigns = ZodiacSign.getAllNames();
    const compatibleSigns = allSigns
      .map(name => ZodiacSign.fromName(name))
      .filter(sign => sign.element === targetElement);

    // Pick the one with best aspect (trine or sextile)
    const withTrines = compatibleSigns.filter(sign => sign.getAspectWith(userSun) === 'trine');
    if (withTrines.length > 0) {
      return withTrines[0];
    }

    const withSextiles = compatibleSigns.filter(sign => sign.getAspectWith(userSun) === 'sextile');
    if (withSextiles.length > 0) {
      return withSextiles[0];
    }

    // Fallback to any compatible element
    return compatibleSigns[0];
  }

  /**
   * Get complementary moon sign (emotional compatibility)
   */
  private getComplementaryMoonSign(userMoon: ZodiacSign): ZodiacSign {
    // For Moon, we want water or earth signs for emotional depth and stability
    const emotionalSigns: ZodiacSignName[] = ['cancer', 'scorpio', 'pisces', 'taurus', 'virgo', 'capricorn'];

    const candidates = emotionalSigns
      .map(name => ZodiacSign.fromName(name))
      .filter(sign => sign.hasElementCompatibility(userMoon));

    // Prefer trines and sextiles
    const withTrines = candidates.filter(sign => sign.getAspectWith(userMoon) === 'trine');
    if (withTrines.length > 0) return withTrines[0];

    const withSextiles = candidates.filter(sign => sign.getAspectWith(userMoon) === 'sextile');
    if (withSextiles.length > 0) return withSextiles[0];

    return candidates[0] || ZodiacSign.fromName('pisces'); // Pisces as default (deeply empathetic)
  }

  /**
   * Get matching Venus sign (love language)
   */
  private getMatchingVenusSign(userVenus: ZodiacSign): ZodiacSign {
    // For Venus, we want same element or complementary element
    if (userVenus.element === 'water' || userVenus.element === 'earth') {
      // Keep it grounded and deep
      return userVenus; // Same sign for perfect love language match
    }

    // For fire/air, find a compatible sign
    const allSigns = ZodiacSign.getAllNames();
    const compatibleSigns = allSigns
      .map(name => ZodiacSign.fromName(name))
      .filter(sign => sign.hasElementCompatibility(userVenus));

    const withTrines = compatibleSigns.filter(sign => sign.getAspectWith(userVenus) === 'trine');
    if (withTrines.length > 0) return withTrines[0];

    return userVenus; // Default to same sign
  }

  /**
   * Get complementary Mars sign (passion/sexuality)
   */
  private getComplementaryMarsSign(userMars: ZodiacSign): ZodiacSign {
    // For Mars, we want fire or water signs for passion
    const passionateSigns: ZodiacSignName[] = ['aries', 'leo', 'sagittarius', 'scorpio', 'cancer', 'pisces'];

    const candidates = passionateSigns
      .map(name => ZodiacSign.fromName(name))
      .filter(sign => {
        const aspect = sign.getAspectWith(userMars);
        return aspect === 'trine' || aspect === 'sextile' || aspect === 'conjunction';
      });

    if (candidates.length > 0) return candidates[0];

    // Fallback: Leo (confident passion)
    return ZodiacSign.fromName('leo');
  }

  /**
   * Get complementary rising sign
   */
  private getComplementaryRisingSign(userRising: ZodiacSign): ZodiacSign {
    // Rising should create pleasant first impression - use complementary element
    const allSigns = ZodiacSign.getAllNames();
    const compatibleSigns = allSigns
      .map(name => ZodiacSign.fromName(name))
      .filter(sign => sign.hasElementCompatibility(userRising));

    const withSextiles = compatibleSigns.filter(sign => sign.getAspectWith(userRising) === 'sextile');
    if (withSextiles.length > 0) return withSextiles[0];

    return compatibleSigns[0] || userRising;
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    userSigns: { sun: ZodiacSign; moon: ZodiacSign; venus: ZodiacSign; mars: ZodiacSign; rising: ZodiacSign },
    companionSigns: { sun: ZodiacSign; moon: ZodiacSign; venus: ZodiacSign; mars: ZodiacSign; rising: ZodiacSign },
    score: CompatibilityScore
  ): string {
    const parts: string[] = [];

    parts.push(`Your companion's ${companionSigns.sun.name} Sun complements your ${userSigns.sun.name} nature, creating balance between ${userSigns.sun.element} and ${companionSigns.sun.element} energies.`);

    parts.push(`Their ${companionSigns.moon.name} Moon resonates with your ${userSigns.moon.name} emotional world, fostering deep understanding.`);

    parts.push(`Venus in ${companionSigns.venus.name} aligns perfectly with your ${userSigns.venus.name} love language.`);

    parts.push(`Mars in ${companionSigns.mars.name} creates passionate chemistry with your ${userSigns.mars.name} desires.`);

    return parts.join(' ');
  }
}
