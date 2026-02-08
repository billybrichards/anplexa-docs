/**
 * Zodiac Sign Value Object
 *
 * Represents one of the 12 zodiac signs with their elemental and modal properties.
 * Immutable value object following DDD principles.
 */

export type ZodiacSignName =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

interface ZodiacSignProps {
  name: ZodiacSignName;
  element: Element;
  modality: Modality;
  rulingPlanet: string;
  degree: number; // 0-29.99 degrees within the sign
}

const SIGN_METADATA: Record<ZodiacSignName, Omit<ZodiacSignProps, 'name' | 'degree'>> = {
  aries: { element: 'fire', modality: 'cardinal', rulingPlanet: 'Mars' },
  taurus: { element: 'earth', modality: 'fixed', rulingPlanet: 'Venus' },
  gemini: { element: 'air', modality: 'mutable', rulingPlanet: 'Mercury' },
  cancer: { element: 'water', modality: 'cardinal', rulingPlanet: 'Moon' },
  leo: { element: 'fire', modality: 'fixed', rulingPlanet: 'Sun' },
  virgo: { element: 'earth', modality: 'mutable', rulingPlanet: 'Mercury' },
  libra: { element: 'air', modality: 'cardinal', rulingPlanet: 'Venus' },
  scorpio: { element: 'water', modality: 'fixed', rulingPlanet: 'Pluto' },
  sagittarius: { element: 'fire', modality: 'mutable', rulingPlanet: 'Jupiter' },
  capricorn: { element: 'earth', modality: 'cardinal', rulingPlanet: 'Saturn' },
  aquarius: { element: 'air', modality: 'fixed', rulingPlanet: 'Uranus' },
  pisces: { element: 'water', modality: 'mutable', rulingPlanet: 'Neptune' },
};

export class ZodiacSign {
  private constructor(
    public readonly name: ZodiacSignName,
    public readonly element: Element,
    public readonly modality: Modality,
    public readonly rulingPlanet: string,
    public readonly degree: number
  ) {}

  /**
   * Create a ZodiacSign from absolute ecliptic longitude (0-360 degrees)
   */
  static fromDegree(eclipticLongitude: number): ZodiacSign {
    if (eclipticLongitude < 0 || eclipticLongitude >= 360) {
      throw new Error(`Ecliptic longitude must be between 0 and 360, got ${eclipticLongitude}`);
    }

    const signIndex = Math.floor(eclipticLongitude / 30);
    const degreeInSign = eclipticLongitude % 30;

    const signs: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];

    const signName = signs[signIndex];
    const metadata = SIGN_METADATA[signName];

    return new ZodiacSign(
      signName,
      metadata.element,
      metadata.modality,
      metadata.rulingPlanet,
      degreeInSign
    );
  }

  /**
   * Create a ZodiacSign from a sign name and degree within that sign
   */
  static create(name: ZodiacSignName, degreeInSign: number = 0): ZodiacSign {
    if (degreeInSign < 0 || degreeInSign >= 30) {
      throw new Error(`Degree within sign must be between 0 and 30, got ${degreeInSign}`);
    }

    const metadata = SIGN_METADATA[name];
    return new ZodiacSign(
      name,
      metadata.element,
      metadata.modality,
      metadata.rulingPlanet,
      degreeInSign
    );
  }

  /**
   * Get the absolute ecliptic longitude (0-360 degrees)
   */
  getEclipticLongitude(): number {
    const signs: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];
    const signIndex = signs.indexOf(this.name);
    return signIndex * 30 + this.degree;
  }

  /**
   * Check if this sign is compatible with another sign by element
   */
  isCompatibleElement(other: ZodiacSign): boolean {
    const compatibleElements: Record<Element, Element[]> = {
      fire: ['fire', 'air'],
      earth: ['earth', 'water'],
      air: ['air', 'fire'],
      water: ['water', 'earth'],
    };
    return compatibleElements[this.element].includes(other.element);
  }

  /**
   * Format the sign as a string for display
   */
  toString(): string {
    return `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)} ${this.degree.toFixed(1)}°`;
  }

  /**
   * Format the sign with its symbol
   */
  toSymbol(): string {
    const symbols: Record<ZodiacSignName, string> = {
      aries: '♈',
      taurus: '♉',
      gemini: '♊',
      cancer: '♋',
      leo: '♌',
      virgo: '♍',
      libra: '♎',
      scorpio: '♏',
      sagittarius: '♐',
      capricorn: '♑',
      aquarius: '♒',
      pisces: '♓',
    };
    return symbols[this.name];
  }

  /**
   * Value object equality comparison
   */
  equals(other: ZodiacSign): boolean {
    return (
      this.name === other.name &&
      Math.abs(this.degree - other.degree) < 0.01 // Floating point tolerance
    );
  }

  /**
   * Serialize to JSON
   */
  toJSON(): { name: ZodiacSignName; degree: number } {
    return {
      name: this.name,
      degree: this.degree,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: { name: ZodiacSignName; degree: number }): ZodiacSign {
    return ZodiacSign.create(data.name, data.degree);
  }
}
