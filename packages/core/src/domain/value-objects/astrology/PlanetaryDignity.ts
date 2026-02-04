/**
 * Planetary Dignity Value Object
 *
 * Represents the essential dignity of a planet in a sign.
 * Determines how well a planet can express its nature.
 */

import type { ZodiacSignName } from './ZodiacSign';

export type DignityType =
  | 'domicile' // Planet's home sign (strongest)
  | 'exaltation' // Planet is honored
  | 'detriment' // Opposite of domicile (challenging)
  | 'fall' // Opposite of exaltation (weakest)
  | 'peregrine'; // No essential dignity

export interface PlanetaryDignityProps {
  planetName: string;
  sign: ZodiacSignName;
  dignity: DignityType;
  strength: number; // -2 to +2 (-2=fall, -1=detriment, 0=peregrine, 1=exaltation, 2=domicile)
}

export class PlanetaryDignity {
  private constructor(
    public readonly planetName: string,
    public readonly sign: ZodiacSignName,
    public readonly dignity: DignityType,
    public readonly strength: number
  ) {}

  static create(props: PlanetaryDignityProps): PlanetaryDignity {
    if (props.strength < -2 || props.strength > 2) {
      throw new Error('Dignity strength must be between -2 and 2');
    }

    return new PlanetaryDignity(
      props.planetName,
      props.sign,
      props.dignity,
      props.strength
    );
  }

  /**
   * Check if planet is well-placed (domicile or exaltation)
   */
  isWellPlaced(): boolean {
    return this.strength > 0;
  }

  /**
   * Check if planet is challenged (detriment or fall)
   */
  isChallenged(): boolean {
    return this.strength < 0;
  }

  /**
   * Get interpretation string
   */
  getInterpretation(): string {
    switch (this.dignity) {
      case 'domicile':
        return `${this.planetName} in ${this.sign} is in its home sign and operates at full strength`;
      case 'exaltation':
        return `${this.planetName} in ${this.sign} is exalted and expresses its highest potential`;
      case 'detriment':
        return `${this.planetName} in ${this.sign} faces challenges expressing its nature`;
      case 'fall':
        return `${this.planetName} in ${this.sign} requires extra effort to manifest positively`;
      case 'peregrine':
        return `${this.planetName} in ${this.sign} has neutral strength`;
    }
  }

  toJSON(): object {
    return {
      planetName: this.planetName,
      sign: this.sign,
      dignity: this.dignity,
      strength: this.strength,
    };
  }

  static fromJSON(data: any): PlanetaryDignity {
    return PlanetaryDignity.create(data);
  }

  /**
   * Static table of planetary dignities
   */
  static readonly DIGNITY_TABLE: Record<
    string,
    {
      domicile: ZodiacSignName[];
      exaltation: ZodiacSignName | null;
      detriment: ZodiacSignName[];
      fall: ZodiacSignName | null;
    }
  > = {
    sun: {
      domicile: ['leo'],
      exaltation: 'aries',
      detriment: ['aquarius'],
      fall: 'libra',
    },
    moon: {
      domicile: ['cancer'],
      exaltation: 'taurus',
      detriment: ['capricorn'],
      fall: 'scorpio',
    },
    mercury: {
      domicile: ['gemini', 'virgo'],
      exaltation: 'virgo',
      detriment: ['sagittarius', 'pisces'],
      fall: 'pisces',
    },
    venus: {
      domicile: ['taurus', 'libra'],
      exaltation: 'pisces',
      detriment: ['scorpio', 'aries'],
      fall: 'virgo',
    },
    mars: {
      domicile: ['aries', 'scorpio'],
      exaltation: 'capricorn',
      detriment: ['libra', 'taurus'],
      fall: 'cancer',
    },
    jupiter: {
      domicile: ['sagittarius', 'pisces'],
      exaltation: 'cancer',
      detriment: ['gemini', 'virgo'],
      fall: 'capricorn',
    },
    saturn: {
      domicile: ['capricorn', 'aquarius'],
      exaltation: 'libra',
      detriment: ['cancer', 'leo'],
      fall: 'aries',
    },
    uranus: {
      domicile: ['aquarius'],
      exaltation: 'scorpio',
      detriment: ['leo'],
      fall: 'taurus',
    },
    neptune: {
      domicile: ['pisces'],
      exaltation: 'cancer',
      detriment: ['virgo'],
      fall: 'capricorn',
    },
    pluto: {
      domicile: ['scorpio'],
      exaltation: 'leo',
      detriment: ['taurus'],
      fall: 'aquarius',
    },
  };

  /**
   * Calculate dignity for a planet in a sign
   */
  static calculate(planetName: string, sign: ZodiacSignName): PlanetaryDignity {
    const planet = planetName.toLowerCase();
    const dignities = PlanetaryDignity.DIGNITY_TABLE[planet];

    if (!dignities) {
      // Node or unknown planet - return peregrine
      return PlanetaryDignity.create({
        planetName,
        sign,
        dignity: 'peregrine',
        strength: 0,
      });
    }

    if (dignities.domicile.includes(sign)) {
      return PlanetaryDignity.create({
        planetName,
        sign,
        dignity: 'domicile',
        strength: 2,
      });
    }

    if (dignities.exaltation === sign) {
      return PlanetaryDignity.create({
        planetName,
        sign,
        dignity: 'exaltation',
        strength: 1,
      });
    }

    if (dignities.detriment.includes(sign)) {
      return PlanetaryDignity.create({
        planetName,
        sign,
        dignity: 'detriment',
        strength: -1,
      });
    }

    if (dignities.fall === sign) {
      return PlanetaryDignity.create({
        planetName,
        sign,
        dignity: 'fall',
        strength: -2,
      });
    }

    return PlanetaryDignity.create({
      planetName,
      sign,
      dignity: 'peregrine',
      strength: 0,
    });
  }
}
