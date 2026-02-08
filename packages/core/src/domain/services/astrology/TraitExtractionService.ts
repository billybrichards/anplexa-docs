/**
 * TraitExtractionService - Domain Service
 *
 * Pure logic service that extracts personality traits from natal chart data.
 * No external dependencies - operates only on domain value objects.
 *
 * Algorithm:
 * - For each planet (Sun through Pluto), extract 1-2 traits based on sign placement
 * - Calculate strength (0-100): baseStrength=50 + dignityBonus + houseBonus + aspectBonus
 * - Assign ecliptic coordinates (longitude from planet position, latitude=0±random)
 * - Categorize by planet type (Sun/ASC→identity, Moon→emotional, Mercury→mental, etc.)
 */

import type { NatalChartData } from '../../value-objects/astrology/NatalChartData.js';
import type { TraitVisualizationProps, TraitCategory } from '../../value-objects/astrology/TraitVisualization.js';
import type { ZodiacSignName, Element } from '../../value-objects/astrology/ZodiacSign.js';
import { PlanetaryDignity } from '../../value-objects/astrology/PlanetaryDignity.js';
import type {
  ITraitExtractionService,
  TraitExtractionResult,
  ElementalBalance,
  ModalBalance,
  DominantPlanets,
} from '../ITraitExtractionService.js';
import { TraitVisualization } from '../../value-objects/astrology/TraitVisualization.js';

/**
 * Mapping of planets to trait categories
 */
const PLANET_CATEGORIES: Record<string, TraitCategory> = {
  sun: 'identity',
  ascendant: 'identity',
  moon: 'emotional',
  mercury: 'mental',
  venus: 'social',
  mars: 'creative',
  jupiter: 'spiritual',
  saturn: 'spiritual',
  uranus: 'creative',
  neptune: 'spiritual',
  pluto: 'creative',
};

/**
 * Core traits for each planet-sign combination
 * Format: { planet: { sign: traitName } }
 */
const PLANET_SIGN_TRAITS: Record<string, Record<ZodiacSignName, string>> = {
  sun: {
    aries: 'Bold Leadership',
    taurus: 'Steadfast Determination',
    gemini: 'Versatile Communication',
    cancer: 'Nurturing Protection',
    leo: 'Radiant Confidence',
    virgo: 'Analytical Precision',
    libra: 'Harmonious Balance',
    scorpio: 'Intense Transformation',
    sagittarius: 'Adventurous Wisdom',
    capricorn: 'Ambitious Discipline',
    aquarius: 'Innovative Vision',
    pisces: 'Compassionate Intuition',
  },
  moon: {
    aries: 'Impulsive Emotions',
    taurus: 'Stable Security',
    gemini: 'Curious Feelings',
    cancer: 'Deep Sensitivity',
    leo: 'Dramatic Expression',
    virgo: 'Analytical Care',
    libra: 'Peaceful Harmony',
    scorpio: 'Emotional Intensity',
    sagittarius: 'Optimistic Spirit',
    capricorn: 'Controlled Emotions',
    aquarius: 'Detached Kindness',
    pisces: 'Empathic Connection',
  },
  mercury: {
    aries: 'Direct Communication',
    taurus: 'Practical Thinking',
    gemini: 'Quick Wit',
    cancer: 'Intuitive Reasoning',
    leo: 'Expressive Speech',
    virgo: 'Detailed Analysis',
    libra: 'Diplomatic Discourse',
    scorpio: 'Probing Investigation',
    sagittarius: 'Philosophical Mind',
    capricorn: 'Structured Logic',
    aquarius: 'Abstract Thinking',
    pisces: 'Imaginative Thought',
  },
  venus: {
    aries: 'Passionate Pursuit',
    taurus: 'Sensual Appreciation',
    gemini: 'Playful Connection',
    cancer: 'Emotional Bonding',
    leo: 'Generous Affection',
    virgo: 'Devoted Service',
    libra: 'Romantic Idealism',
    scorpio: 'Magnetic Intimacy',
    sagittarius: 'Adventurous Love',
    capricorn: 'Committed Partnership',
    aquarius: 'Unconventional Affection',
    pisces: 'Transcendent Love',
  },
  mars: {
    aries: 'Courageous Action',
    taurus: 'Persistent Effort',
    gemini: 'Mental Energy',
    cancer: 'Protective Drive',
    leo: 'Creative Power',
    virgo: 'Efficient Execution',
    libra: 'Strategic Assertion',
    scorpio: 'Focused Intensity',
    sagittarius: 'Expansive Drive',
    capricorn: 'Controlled Ambition',
    aquarius: 'Revolutionary Force',
    pisces: 'Inspired Movement',
  },
  jupiter: {
    aries: 'Pioneering Faith',
    taurus: 'Abundant Growth',
    gemini: 'Intellectual Expansion',
    cancer: 'Protective Generosity',
    leo: 'Magnanimous Spirit',
    virgo: 'Practical Wisdom',
    libra: 'Fair Justice',
    scorpio: 'Deep Understanding',
    sagittarius: 'Boundless Optimism',
    capricorn: 'Structured Growth',
    aquarius: 'Progressive Vision',
    pisces: 'Universal Compassion',
  },
  saturn: {
    aries: 'Disciplined Initiative',
    taurus: 'Patient Building',
    gemini: 'Focused Learning',
    cancer: 'Responsible Care',
    leo: 'Mature Authority',
    virgo: 'Perfectionistic Order',
    libra: 'Balanced Justice',
    scorpio: 'Controlled Power',
    sagittarius: 'Philosophical Discipline',
    capricorn: 'Mastered Structure',
    aquarius: 'Systematic Innovation',
    pisces: 'Spiritual Boundaries',
  },
  uranus: {
    aries: 'Breakthrough Courage',
    taurus: 'Revolutionary Stability',
    gemini: 'Eccentric Genius',
    cancer: 'Unconventional Nurture',
    leo: 'Original Expression',
    virgo: 'Innovative Service',
    libra: 'Progressive Harmony',
    scorpio: 'Radical Transformation',
    sagittarius: 'Free-Spirited Philosophy',
    capricorn: 'Structural Revolution',
    aquarius: 'Visionary Freedom',
    pisces: 'Mystical Innovation',
  },
  neptune: {
    aries: 'Inspired Vision',
    taurus: 'Artistic Sensibility',
    gemini: 'Poetic Imagination',
    cancer: 'Psychic Sensitivity',
    leo: 'Creative Idealism',
    virgo: 'Healing Service',
    libra: 'Romantic Dreaming',
    scorpio: 'Mystical Depth',
    sagittarius: 'Spiritual Seeking',
    capricorn: 'Practical Mysticism',
    aquarius: 'Utopian Vision',
    pisces: 'Transcendent Unity',
  },
  pluto: {
    aries: 'Transformative Power',
    taurus: 'Deep Resourcefulness',
    gemini: 'Penetrating Insight',
    cancer: 'Emotional Rebirth',
    leo: 'Personal Metamorphosis',
    virgo: 'Purifying Analysis',
    libra: 'Relationship Alchemy',
    scorpio: 'Complete Regeneration',
    sagittarius: 'Philosophical Rebirth',
    capricorn: 'Structural Transformation',
    aquarius: 'Collective Evolution',
    pisces: 'Spiritual Dissolution',
  },
};

export class TraitExtractionService implements ITraitExtractionService {
  /**
   * Extract personality traits from natal chart data
   *
   * @param chartData - Complete natal chart with planet positions
   * @returns Promise resolving to trait extraction result with metadata
   */
  async extractTraits(chartData: NatalChartData): Promise<TraitExtractionResult> {
    const traitProps: TraitVisualizationProps[] = [];

    // Extract traits from each major planet
    const planetsToProcess = [
      'sun',
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
    ];

    for (const planetName of planetsToProcess) {
      const planet = chartData.planets[planetName as keyof typeof chartData.planets];
      if (!planet) continue;

      const trait = this.extractTraitFromPlanet(
        planetName,
        planet.sign.name,
        planet.degree,
        planet.house,
        chartData
      );

      if (trait) {
        traitProps.push(trait);
      }
    }

    // Add Ascendant trait if birth time is known
    if (chartData.ascendant) {
      const ascendantTrait = this.extractAscendantTrait(chartData);
      if (ascendantTrait) {
        traitProps.push(ascendantTrait);
      }
    }

    // Convert props to TraitVisualization instances
    const traits = traitProps.map((props) => TraitVisualization.create(props));

    // Calculate elemental and modal balances
    const elementalBalance = this.calculateElementalBalance(chartData);
    const modalBalance = this.calculateModalBalance(chartData);
    const dominantPlanets = this.identifyDominantPlanets(chartData);

    return {
      traits,
      elementalBalance,
      modalBalance,
      dominantPlanets,
    };
  }

  /**
   * Extract a single trait from a planet placement
   */
  private extractTraitFromPlanet(
    planetName: string,
    signName: ZodiacSignName,
    eclipticLongitude: number,
    house: number | null,
    chartData: NatalChartData
  ): TraitVisualizationProps | null {
    // Get trait name for this planet-sign combination
    const traitName = PLANET_SIGN_TRAITS[planetName]?.[signName];
    if (!traitName) return null;

    // Calculate strength (0-100)
    const strength = this.calculateTraitStrength(planetName, signName, house, chartData);

    // Get category
    const category = PLANET_CATEGORIES[planetName] || 'identity';

    // Generate ecliptic coordinates
    // Longitude: use planet's ecliptic longitude
    // Latitude: small random deviation from ecliptic plane (-5 to +5 degrees)
    const eclipticLatitude = this.generateLatitude(planetName);

    // Generate unique ID
    const id = `${planetName}-${signName}`;

    return {
      id,
      name: traitName,
      category,
      strength,
      eclipticLongitude,
      eclipticLatitude,
      description: '', // To be filled by AI enrichment later
      sourcePosition: {
        planet: this.capitalizeFirst(planetName),
        sign: this.capitalizeFirst(signName),
        house,
      },
    };
  }

  /**
   * Extract Ascendant trait
   */
  private extractAscendantTrait(chartData: NatalChartData): TraitVisualizationProps | null {
    if (!chartData.ascendant) return null;

    const signName = chartData.ascendant.name;

    // Ascendant traits (persona/mask)
    const ascendantTraits: Record<ZodiacSignName, string> = {
      aries: 'Dynamic Presence',
      taurus: 'Grounded Demeanor',
      gemini: 'Sociable Charm',
      cancer: 'Protective Aura',
      leo: 'Magnetic Charisma',
      virgo: 'Refined Composure',
      libra: 'Graceful Elegance',
      scorpio: 'Mysterious Intensity',
      sagittarius: 'Adventurous Spirit',
      capricorn: 'Authoritative Bearing',
      aquarius: 'Unique Individuality',
      pisces: 'Ethereal Presence',
    };

    const traitName = ascendantTraits[signName];
    if (!traitName) return null;

    // Ascendant is always at 1st house cusp
    const eclipticLongitude = chartData.houses[0]?.cuspDegree || 0;

    return {
      id: `ascendant-${signName}`,
      name: traitName,
      category: 'identity',
      strength: 85, // Ascendant is highly significant
      eclipticLongitude,
      eclipticLatitude: 0, // On ecliptic plane
      description: '',
      sourcePosition: {
        planet: 'Ascendant',
        sign: this.capitalizeFirst(signName),
        house: 1,
      },
    };
  }

  /**
   * Calculate trait strength (0-100)
   *
   * Formula: baseStrength=50 + dignityBonus + houseBonus + aspectBonus
   */
  private calculateTraitStrength(
    planetName: string,
    signName: ZodiacSignName,
    house: number | null,
    chartData: NatalChartData
  ): number {
    let strength = 50; // Base strength

    // Dignity bonus: Convert PlanetaryDignity strength (-2 to +2) to modifier
    // domicile (+2) → +20, exaltation (+1) → +10, peregrine (0) → 0
    // detriment (-1) → -10, fall (-2) → -20
    const dignity = PlanetaryDignity.calculate(planetName, signName);
    const dignityBonus = dignity.strength * 10;
    strength += dignityBonus;

    // House bonus (angular houses get +10, succedent +5, cadent +0)
    if (house !== null) {
      const houseBonus = this.getHouseBonus(house);
      strength += houseBonus;
    }

    // Aspect bonus (strong aspects +10, moderate +5)
    const aspectBonus = this.calculateAspectBonus(planetName, chartData);
    strength += aspectBonus;

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(strength)));
  }

  /**
   * Calculate house bonus
   * Angular houses (1, 4, 7, 10): +10
   * Succedent houses (2, 5, 8, 11): +5
   * Cadent houses (3, 6, 9, 12): +0
   */
  private getHouseBonus(house: number): number {
    const angularHouses = [1, 4, 7, 10];
    const succedentHouses = [2, 5, 8, 11];

    if (angularHouses.includes(house)) return 10;
    if (succedentHouses.includes(house)) return 5;
    return 0;
  }

  /**
   * Calculate aspect bonus based on number and type of aspects
   */
  private calculateAspectBonus(planetName: string, chartData: NatalChartData): number {
    const aspects = chartData.aspects.filter(
      (aspect) => aspect.planet1 === planetName || aspect.planet2 === planetName
    );

    let bonus = 0;

    for (const aspect of aspects) {
      // Strong aspects (conjunction, opposition, trine, square)
      if (['conjunction', 'trine'].includes(aspect.aspectType)) {
        bonus += aspect.strength * 10; // 0-10 based on exactness
      } else if (['square', 'opposition'].includes(aspect.aspectType)) {
        bonus += aspect.strength * 5; // Challenging aspects add less
      } else if (['sextile'].includes(aspect.aspectType)) {
        bonus += aspect.strength * 5;
      }
    }

    // Cap aspect bonus at +20
    return Math.min(20, Math.round(bonus));
  }

  /**
   * Generate ecliptic latitude for visual distribution
   * Uses deterministic pseudo-randomness based on planet name
   */
  private generateLatitude(planetName: string): number {
    // Simple hash function for deterministic "random" values
    let hash = 0;
    for (let i = 0; i < planetName.length; i++) {
      hash = ((hash << 5) - hash) + planetName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Map hash to -5 to +5 degrees range
    const normalized = (Math.abs(hash) % 1000) / 1000; // 0-1
    return (normalized * 10) - 5; // -5 to +5
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Calculate elemental balance from chart
   */
  private calculateElementalBalance(chartData: NatalChartData): ElementalBalance {
    const balance: ElementalBalance = { fire: 0, earth: 0, air: 0, water: 0 };

    // Count planets in each element
    const planets = Object.values(chartData.planets);
    for (const planet of planets) {
      const element = planet.sign.element;
      balance[element] += 1;
    }

    // Add Ascendant if available
    if (chartData.ascendant) {
      balance[chartData.ascendant.element] += 1;
    }

    return balance;
  }

  /**
   * Calculate modal balance from chart
   */
  private calculateModalBalance(chartData: NatalChartData): ModalBalance {
    const balance: ModalBalance = { cardinal: 0, fixed: 0, mutable: 0 };

    // Count planets in each modality
    const planets = Object.values(chartData.planets);
    for (const planet of planets) {
      const modality = planet.sign.modality;
      balance[modality] += 1;
    }

    // Add Ascendant if available
    if (chartData.ascendant) {
      balance[chartData.ascendant.modality] += 1;
    }

    return balance;
  }

  /**
   * Identify the three most dominant planets by strength
   */
  private identifyDominantPlanets(chartData: NatalChartData): DominantPlanets {
    // Calculate strength for each planet (simplified version)
    const planetStrengths: Array<{ name: string; strength: number }> = [];

    const planetsToConsider = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

    for (const planetName of planetsToConsider) {
      const planet = chartData.planets[planetName as keyof typeof chartData.planets];
      if (!planet) continue;

      // Simple strength calculation based on dignity
      let strength = 50; // Base strength

      const dignityObj = PlanetaryDignity.calculate(planetName, planet.sign.name);
      if (dignityObj.dignity === 'domicile' || dignityObj.dignity === 'exaltation') {
        strength += 30;
      } else if (dignityObj.dignity === 'detriment' || dignityObj.dignity === 'fall') {
        strength -= 20;
      }

      // Angular houses are stronger
      if ([1, 4, 7, 10].includes(planet.house)) {
        strength += 20;
      }

      planetStrengths.push({ name: planetName, strength });
    }

    // Sort by strength and take top 3
    planetStrengths.sort((a, b) => b.strength - a.strength);

    return {
      primary: this.capitalizeFirst(planetStrengths[0]?.name || 'sun'),
      secondary: this.capitalizeFirst(planetStrengths[1]?.name || 'moon'),
      tertiary: this.capitalizeFirst(planetStrengths[2]?.name || 'mercury'),
    };
  }
}
