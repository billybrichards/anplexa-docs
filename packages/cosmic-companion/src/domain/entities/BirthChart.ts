/**
 * BirthChart Entity
 *
 * Represents a user's complete natal (birth) chart with all major astrological placements.
 * This is the foundation for generating compatible AI companion personalities.
 */

import { ZodiacSign, type ZodiacSignName } from '../value-objects/ZodiacSign.js';
import { GeoLocation } from '../value-objects/GeoLocation.js';

export interface BirthChartProps {
  id: string;
  userId: string;
  birthDate: Date;
  birthTime: string; // HH:mm format
  birthLocation: GeoLocation;
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  venusSign: ZodiacSign;
  marsSign: ZodiacSign;
  risingSign: ZodiacSign;
  // Optional additional placements
  mercurySign?: ZodiacSign;
  jupiterSign?: ZodiacSign;
  saturnSign?: ZodiacSign;
  createdAt: Date;
  updatedAt: Date;
}

export class BirthChart {
  private constructor(private props: BirthChartProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get birthDate(): Date {
    return this.props.birthDate;
  }

  get birthTime(): string {
    return this.props.birthTime;
  }

  get birthLocation(): GeoLocation {
    return this.props.birthLocation;
  }

  get sunSign(): ZodiacSign {
    return this.props.sunSign;
  }

  get moonSign(): ZodiacSign {
    return this.props.moonSign;
  }

  get venusSign(): ZodiacSign {
    return this.props.venusSign;
  }

  get marsSign(): ZodiacSign {
    return this.props.marsSign;
  }

  get risingSign(): ZodiacSign {
    return this.props.risingSign;
  }

  get mercurySign(): ZodiacSign | undefined {
    return this.props.mercurySign;
  }

  get jupiterSign(): ZodiacSign | undefined {
    return this.props.jupiterSign;
  }

  get saturnSign(): ZodiacSign | undefined {
    return this.props.saturnSign;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get all major placements as a record
   */
  getMajorPlacements(): {
    sun: ZodiacSign;
    moon: ZodiacSign;
    venus: ZodiacSign;
    mars: ZodiacSign;
    rising: ZodiacSign;
  } {
    return {
      sun: this.props.sunSign,
      moon: this.props.moonSign,
      venus: this.props.venusSign,
      mars: this.props.marsSign,
      rising: this.props.risingSign
    };
  }

  /**
   * Get a summary description of the chart
   */
  getSummary(): string {
    return `${this.props.sunSign.name} Sun, ${this.props.moonSign.name} Moon, ${this.props.venusSign.name} Venus, ${this.props.marsSign.name} Mars, ${this.props.risingSign.name} Rising`;
  }

  /**
   * Get dominant element in the chart
   */
  getDominantElement(): 'fire' | 'earth' | 'air' | 'water' {
    const elements = [
      this.props.sunSign.element,
      this.props.moonSign.element,
      this.props.venusSign.element,
      this.props.marsSign.element,
      this.props.risingSign.element
    ];

    const counts = {
      fire: elements.filter(e => e === 'fire').length,
      earth: elements.filter(e => e === 'earth').length,
      air: elements.filter(e => e === 'air').length,
      water: elements.filter(e => e === 'water').length
    };

    let dominant: 'fire' | 'earth' | 'air' | 'water' = 'fire';
    let maxCount = 0;

    for (const [element, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = element as 'fire' | 'earth' | 'air' | 'water';
      }
    }

    return dominant;
  }

  /**
   * Check if this is a "Big Three" (Sun, Moon, Rising) match with another chart
   */
  hasBigThreeMatch(other: BirthChart): boolean {
    return (
      this.props.sunSign.equals(other.sunSign) ||
      this.props.moonSign.equals(other.moonSign) ||
      this.props.risingSign.equals(other.risingSign)
    );
  }

  /**
   * Create a new BirthChart
   */
  static create(
    id: string,
    userId: string,
    birthDate: Date,
    birthTime: string,
    birthLocation: GeoLocation,
    signs: {
      sun: ZodiacSignName;
      moon: ZodiacSignName;
      venus: ZodiacSignName;
      mars: ZodiacSignName;
      rising: ZodiacSignName;
      mercury?: ZodiacSignName;
      jupiter?: ZodiacSignName;
      saturn?: ZodiacSignName;
    }
  ): BirthChart {
    const now = new Date();

    return new BirthChart({
      id,
      userId,
      birthDate,
      birthTime,
      birthLocation,
      sunSign: ZodiacSign.fromName(signs.sun),
      moonSign: ZodiacSign.fromName(signs.moon),
      venusSign: ZodiacSign.fromName(signs.venus),
      marsSign: ZodiacSign.fromName(signs.mars),
      risingSign: ZodiacSign.fromName(signs.rising),
      mercurySign: signs.mercury ? ZodiacSign.fromName(signs.mercury) : undefined,
      jupiterSign: signs.jupiter ? ZodiacSign.fromName(signs.jupiter) : undefined,
      saturnSign: signs.saturn ? ZodiacSign.fromName(signs.saturn) : undefined,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: BirthChartProps): BirthChart {
    return new BirthChart(props);
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      birthDate: this.props.birthDate.toISOString(),
      birthTime: this.props.birthTime,
      birthLocation: this.props.birthLocation.toJSON(),
      sunSign: this.props.sunSign.name,
      moonSign: this.props.moonSign.name,
      venusSign: this.props.venusSign.name,
      marsSign: this.props.marsSign.name,
      risingSign: this.props.risingSign.name,
      mercurySign: this.props.mercurySign?.name,
      jupiterSign: this.props.jupiterSign?.name,
      saturnSign: this.props.saturnSign?.name,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
