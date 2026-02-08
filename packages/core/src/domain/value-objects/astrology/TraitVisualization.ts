/**
 * TraitVisualization Value Object
 *
 * Represents a single personality trait with 3D positioning data for
 * visualization on the astrological trait globe.
 *
 * This is a value object (immutable, identity-less) defined by its properties.
 * Two TraitVisualizations with identical properties are considered equal.
 */

import { deepFreeze } from '../../../utils/deep-freeze.js';

export type TraitCategory = 'identity' | 'emotional' | 'social' | 'mental' | 'creative' | 'spiritual';

export interface TraitSourcePosition {
  readonly planet: string;        // e.g., "Mars", "Venus"
  readonly sign: string;          // e.g., "Aries", "Libra"
  readonly house: number | null;  // 1-12, or null if time unknown
}

export interface TraitVisualizationProps {
  readonly id: string;                           // Unique identifier
  readonly name: string;                         // e.g., "Bold Leadership"
  readonly category: TraitCategory;              // Categorization for color-coding
  readonly strength: number;                     // 0-100 scale
  readonly eclipticLongitude: number;            // 0-360° (zodiac position)
  readonly eclipticLatitude: number;             // -90° to +90° (elevation from ecliptic)
  readonly description: string;                  // AI-generated interpretation
  readonly sourcePosition: TraitSourcePosition;  // Astrological origin
}

/**
 * Category-to-color mapping for 3D visualization
 */
export const TRAIT_COLORS: Record<TraitCategory, number> = {
  identity: 0xFFD700,     // Gold - core self
  emotional: 0x87CEEB,    // Sky blue - feelings
  social: 0xFF69B4,       // Hot pink - relationships
  mental: 0x9370DB,       // Medium purple - intellect
  creative: 0xFF6347,     // Tomato red - expression
  spiritual: 0x9ACD32,    // Yellow green - transcendence
};

/**
 * TraitVisualization Value Object
 *
 * Immutable representation of a personality trait with spatial positioning.
 */
export class TraitVisualization {
  private constructor(private readonly props: TraitVisualizationProps) {
    deepFreeze(this.props);
  }

  /**
   * Factory method to create a TraitVisualization
   * Validates input properties
   */
  static create(props: TraitVisualizationProps): TraitVisualization {
    // Validate required fields
    if (!props.id || props.id.trim() === '') {
      throw new Error('TraitVisualization: id is required');
    }

    if (!props.name || props.name.trim() === '') {
      throw new Error('TraitVisualization: name is required');
    }

    if (!['identity', 'emotional', 'social', 'mental', 'creative', 'spiritual'].includes(props.category)) {
      throw new Error(`TraitVisualization: invalid category "${props.category}"`);
    }

    // Validate ranges
    if (props.strength < 0 || props.strength > 100) {
      throw new Error(`TraitVisualization: strength must be 0-100, got ${props.strength}`);
    }

    if (props.eclipticLongitude < 0 || props.eclipticLongitude >= 360) {
      throw new Error(`TraitVisualization: eclipticLongitude must be 0-360, got ${props.eclipticLongitude}`);
    }

    if (props.eclipticLatitude < -90 || props.eclipticLatitude > 90) {
      throw new Error(`TraitVisualization: eclipticLatitude must be -90 to 90, got ${props.eclipticLatitude}`);
    }

    // Validate source position
    if (!props.sourcePosition.planet || !props.sourcePosition.sign) {
      throw new Error('TraitVisualization: sourcePosition.planet and sourcePosition.sign are required');
    }

    if (props.sourcePosition.house !== null && (props.sourcePosition.house < 1 || props.sourcePosition.house > 12)) {
      throw new Error(`TraitVisualization: sourcePosition.house must be 1-12 or null, got ${props.sourcePosition.house}`);
    }

    return new TraitVisualization(props);
  }

  // Getters for all properties

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): TraitCategory {
    return this.props.category;
  }

  get strength(): number {
    return this.props.strength;
  }

  get eclipticLongitude(): number {
    return this.props.eclipticLongitude;
  }

  get eclipticLatitude(): number {
    return this.props.eclipticLatitude;
  }

  get description(): string {
    return this.props.description;
  }

  get sourcePosition(): TraitSourcePosition {
    return this.props.sourcePosition;
  }

  /**
   * Convert ecliptic coordinates to 3D Cartesian position on sphere
   *
   * @param radius - Sphere radius (in arbitrary units)
   * @returns Object with x, y, z coordinates
   *
   * Coordinate system:
   * - X: Points toward vernal equinox (0° ecliptic longitude)
   * - Y: Points toward summer solstice (90° ecliptic longitude)
   * - Z: Points toward north ecliptic pole
   */
  getPosition3D(radius: number): { x: number; y: number; z: number } {
    const lonRad = (this.props.eclipticLongitude * Math.PI) / 180;
    const latRad = (this.props.eclipticLatitude * Math.PI) / 180;

    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.cos(latRad) * Math.sin(lonRad);
    const z = radius * Math.sin(latRad);

    return { x, y, z };
  }

  /**
   * Get color for this trait based on its category
   * Returns THREE.js compatible color number (0xRRGGBB)
   */
  getColorByCategory(): number {
    return TRAIT_COLORS[this.props.category];
  }

  /**
   * Get color as CSS hex string (e.g., "#FFD700")
   */
  getColorHex(): string {
    const color = this.getColorByCategory();
    return '#' + color.toString(16).padStart(6, '0').toUpperCase();
  }

  /**
   * Calculate visual size for 3D marker based on strength
   * Maps strength (0-100) to size (0.5-1.0)
   */
  getMarkerSize(): number {
    return 0.5 + (this.props.strength / 100) * 0.5;
  }

  /**
   * Value object equality - compare by properties, not identity
   */
  equals(other: TraitVisualization): boolean {
    if (!(other instanceof TraitVisualization)) {
      return false;
    }

    return (
      this.props.id === other.props.id &&
      this.props.name === other.props.name &&
      this.props.category === other.props.category &&
      this.props.strength === other.props.strength &&
      this.props.eclipticLongitude === other.props.eclipticLongitude &&
      this.props.eclipticLatitude === other.props.eclipticLatitude &&
      this.props.description === other.props.description &&
      this.props.sourcePosition.planet === other.props.sourcePosition.planet &&
      this.props.sourcePosition.sign === other.props.sourcePosition.sign &&
      this.props.sourcePosition.house === other.props.sourcePosition.house
    );
  }

  /**
   * Serialize to plain object for API responses
   */
  toJSON(): TraitVisualizationProps {
    return {
      id: this.props.id,
      name: this.props.name,
      category: this.props.category,
      strength: this.props.strength,
      eclipticLongitude: this.props.eclipticLongitude,
      eclipticLatitude: this.props.eclipticLatitude,
      description: this.props.description,
      sourcePosition: {
        planet: this.props.sourcePosition.planet,
        sign: this.props.sourcePosition.sign,
        house: this.props.sourcePosition.house,
      },
    };
  }

  /**
   * Deserialize from plain object (e.g., API response)
   */
  static fromJSON(json: TraitVisualizationProps): TraitVisualization {
    return TraitVisualization.create(json);
  }

  /**
   * Create a new TraitVisualization with updated description
   * (Used when AI enriches base traits)
   */
  withDescription(description: string): TraitVisualization {
    return TraitVisualization.create({
      ...this.props,
      description,
    });
  }

  /**
   * Create a new TraitVisualization with updated strength
   * (Used if strength needs recalculation)
   */
  withStrength(strength: number): TraitVisualization {
    return TraitVisualization.create({
      ...this.props,
      strength,
    });
  }

  /**
   * Get human-readable source description
   * e.g., "Mars in Aries, 10th House" or "Venus in Libra (time unknown)"
   */
  getSourceDescription(): string {
    const houseStr = this.props.sourcePosition.house
      ? `, ${this.formatOrdinal(this.props.sourcePosition.house)} House`
      : ' (time unknown)';

    return `${this.props.sourcePosition.planet} in ${this.props.sourcePosition.sign}${houseStr}`;
  }

  /**
   * Format number as ordinal (1 → "1st", 2 → "2nd", etc.)
   */
  private formatOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
}
