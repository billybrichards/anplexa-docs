/**
 * Natal Chart Data Value Object
 *
 * Contains all calculated astrological data for a complete natal chart.
 * Immutable value object representing the state of the cosmos at birth.
 */

import { ZodiacSign, type ZodiacSignName } from './ZodiacSign.js';
import { EnhancedChartAnalysis } from './EnhancedChartAnalysis.js';
import { PlanetaryDignity } from './PlanetaryDignity.js';

export interface PlanetPlacement {
  planetName: string;
  sign: ZodiacSign;
  house: number | null; // null if birth time unknown
  degree: number; // Absolute ecliptic longitude 0-360
  speed: number; // Degrees per day
  isRetrograde: boolean;
}

export interface AspectData {
  planet1: string;
  planet2: string;
  aspectType: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'semisextile' | 'semisquare' | 'sesquiquadrate';
  orb: number; // Degrees of separation from exact aspect
  strength: number; // 0-1, how close to exact
  isApplying: boolean; // Planets moving together or apart
}

export interface House {
  number: number; // 1-12
  cuspDegree: number; // Absolute ecliptic longitude
  cuspSign: ZodiacSign;
  planets: string[]; // Names of planets in this house
}

export interface NatalChartDataProps {
  planets: {
    sun: PlanetPlacement;
    moon: PlanetPlacement;
    mercury: PlanetPlacement;
    venus: PlanetPlacement;
    mars: PlanetPlacement;
    jupiter: PlanetPlacement;
    saturn: PlanetPlacement;
    uranus: PlanetPlacement;
    neptune: PlanetPlacement;
    pluto: PlanetPlacement;
    northNode: PlanetPlacement;
    southNode: PlanetPlacement;
  };
  houses: House[]; // 12 houses (empty if birth time unknown)
  aspects: AspectData[];
  dominantElement: 'fire' | 'earth' | 'air' | 'water';
  dominantModality: 'cardinal' | 'fixed' | 'mutable';
  ascendant: ZodiacSign | null; // Rising sign (null if birth time unknown)
  midheaven: ZodiacSign | null; // MC (null if birth time unknown)
  enhancedAnalysis?: EnhancedChartAnalysis; // Deep chart analysis (optional for backward compatibility)
}

export class NatalChartData {
  private constructor(
    public readonly planets: NatalChartDataProps['planets'],
    public readonly houses: House[],
    public readonly aspects: AspectData[],
    public readonly dominantElement: 'fire' | 'earth' | 'air' | 'water',
    public readonly dominantModality: 'cardinal' | 'fixed' | 'mutable',
    public readonly ascendant: ZodiacSign | null,
    public readonly midheaven: ZodiacSign | null,
    public readonly enhancedAnalysis?: EnhancedChartAnalysis
  ) {}

  /**
   * Create NatalChartData with validation
   */
  static create(props: NatalChartDataProps): NatalChartData {
    // Validate houses (must be 12 or empty)
    if (props.houses.length !== 0 && props.houses.length !== 12) {
      throw new Error('Houses must be either 12 (time known) or 0 (time unknown)');
    }

    // Validate all planets have valid degrees
    Object.values(props.planets).forEach((planet) => {
      if (planet.degree < 0 || planet.degree >= 360) {
        throw new Error(`${planet.planetName} degree must be between 0 and 360, got ${planet.degree}`);
      }
    });

    return new NatalChartData(
      props.planets,
      props.houses,
      props.aspects,
      props.dominantElement,
      props.dominantModality,
      props.ascendant,
      props.midheaven,
      props.enhancedAnalysis
    );
  }

  /**
   * Get the "Big Three" (Sun, Moon, Rising)
   */
  getBigThree(): {
    sun: ZodiacSignName;
    moon: ZodiacSignName;
    rising: ZodiacSignName | null;
  } {
    return {
      sun: this.planets.sun.sign.name,
      moon: this.planets.moon.sign.name,
      rising: this.ascendant?.name ?? null,
    };
  }

  /**
   * Get all planets in a specific house
   */
  getPlanetsInHouse(houseNumber: number): PlanetPlacement[] {
    if (houseNumber < 1 || houseNumber > 12) {
      throw new Error('House number must be between 1 and 12');
    }

    return Object.values(this.planets).filter(
      (planet) => planet.house === houseNumber
    );
  }

  /**
   * Get all planets in a specific sign
   */
  getPlanetsInSign(signName: ZodiacSignName): PlanetPlacement[] {
    return Object.values(this.planets).filter(
      (planet) => planet.sign.name === signName
    );
  }

  /**
   * Get aspects involving a specific planet
   */
  getAspectsForPlanet(planetName: string): AspectData[] {
    return this.aspects.filter(
      (aspect) => aspect.planet1 === planetName || aspect.planet2 === planetName
    );
  }

  /**
   * Check if birth time was known (houses calculated)
   */
  hasHouses(): boolean {
    return this.houses.length === 12;
  }

  /**
   * Get planetary dignities for all planets
   */
  getPlanetaryDignities(): PlanetaryDignity[] {
    return Object.entries(this.planets).map(([name, placement]) =>
      PlanetaryDignity.calculate(name, placement.sign.name)
    );
  }

  /**
   * Get well-placed planets (in domicile or exaltation)
   */
  getWellPlacedPlanets(): PlanetaryDignity[] {
    return this.getPlanetaryDignities().filter((d) => d.isWellPlaced());
  }

  /**
   * Get challenged planets (in detriment or fall)
   */
  getChallengedPlanets(): PlanetaryDignity[] {
    return this.getPlanetaryDignities().filter((d) => d.isChallenged());
  }

  /**
   * Get a summary string of the chart
   */
  getSummary(): string {
    const bigThree = this.getBigThree();
    const summary = [
      `Sun in ${bigThree.sun}`,
      `Moon in ${bigThree.moon}`,
    ];

    if (bigThree.rising) {
      summary.push(`Rising in ${bigThree.rising}`);
    }

    summary.push(`Dominant Element: ${this.dominantElement}`);
    summary.push(`Dominant Modality: ${this.dominantModality}`);

    return summary.join(', ');
  }

  /**
   * Get comprehensive summary for LLM persona generation
   */
  getDetailedSummary(): string {
    const summary: string[] = [];

    // Big Three
    const bigThree = this.getBigThree();
    summary.push(`Sun in ${bigThree.sun}, Moon in ${bigThree.moon}${bigThree.rising ? `, ${bigThree.rising} Rising` : ''}`);

    // Elemental and Modal balance
    const elementBalance = this.getElementalBalance();
    const modalBalance = this.getModalBalance();
    summary.push(`Dominant: ${this.dominantElement} (${Object.entries(elementBalance).map(([el, count]) => `${count} ${el}`).join(', ')})`);
    summary.push(`Mode: ${this.dominantModality} (${Object.entries(modalBalance).map(([mod, count]) => `${count} ${mod}`).join(', ')})`);

    // Key planetary placements
    summary.push(`Mercury in ${this.planets.mercury.sign.name} (communication)`);
    summary.push(`Venus in ${this.planets.venus.sign.name} (relationships)`);
    summary.push(`Mars in ${this.planets.mars.sign.name} (drive)`);

    // Dignities
    const wellPlaced = this.getWellPlacedPlanets();
    if (wellPlaced.length > 0) {
      summary.push(`Strong: ${wellPlaced.map(d => d.planetName).join(', ')}`);
    }

    // Houses (if known)
    if (this.hasHouses()) {
      const sunHouse = this.planets.sun.house;
      const moonHouse = this.planets.moon.house;
      summary.push(`Sun in house ${sunHouse}, Moon in house ${moonHouse}`);
    }

    // Enhanced analysis
    if (this.enhancedAnalysis) {
      summary.push(this.enhancedAnalysis.getPersonaRelevantSummary());
    }

    return summary.join('. ');
  }

  /**
   * Get elemental balance (count of planets in each element)
   */
  getElementalBalance(): Record<'fire' | 'earth' | 'air' | 'water', number> {
    const balance = { fire: 0, earth: 0, air: 0, water: 0 };

    Object.values(this.planets).forEach((planet) => {
      balance[planet.sign.element]++;
    });

    return balance;
  }

  /**
   * Get modal balance (count of planets in each modality)
   */
  getModalBalance(): Record<'cardinal' | 'fixed' | 'mutable', number> {
    const balance = { cardinal: 0, fixed: 0, mutable: 0 };

    Object.values(this.planets).forEach((planet) => {
      balance[planet.sign.modality]++;
    });

    return balance;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      planets: Object.fromEntries(
        Object.entries(this.planets).map(([key, planet]) => [
          key,
          {
            ...planet,
            sign: planet.sign.toJSON(),
          },
        ])
      ),
      houses: this.houses.map((house) => ({
        ...house,
        cuspSign: house.cuspSign.toJSON(),
      })),
      aspects: this.aspects,
      dominantElement: this.dominantElement,
      dominantModality: this.dominantModality,
      ascendant: this.ascendant?.toJSON() ?? null,
      midheaven: this.midheaven?.toJSON() ?? null,
      enhancedAnalysis: this.enhancedAnalysis?.toJSON() ?? null,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): NatalChartData {
    // Reconstruct planets with ZodiacSign value objects
    const planets = Object.fromEntries(
      Object.entries(data.planets).map(([key, planetData]: [string, any]) => [
        key,
        {
          ...planetData,
          sign: ZodiacSign.fromJSON(planetData.sign),
        },
      ])
    ) as NatalChartDataProps['planets'];

    // Reconstruct houses
    const houses = data.houses.map((house: any) => ({
      ...house,
      cuspSign: ZodiacSign.fromJSON(house.cuspSign),
    }));

    return NatalChartData.create({
      planets,
      houses,
      aspects: data.aspects,
      dominantElement: data.dominantElement,
      dominantModality: data.dominantModality,
      ascendant: data.ascendant ? ZodiacSign.fromJSON(data.ascendant) : null,
      midheaven: data.midheaven ? ZodiacSign.fromJSON(data.midheaven) : null,
      enhancedAnalysis: data.enhancedAnalysis ? EnhancedChartAnalysis.fromJSON(data.enhancedAnalysis) : undefined,
    });
  }
}
