/**
 * TraitProfile Value Object
 *
 * Aggregate of all personality traits for a user, including AI-generated
 * personality summary and dominant trait identification.
 *
 * This represents the complete personality analysis derived from a natal chart.
 */

import { deepFreeze } from '../../../utils/deep-freeze.js';
import { TraitVisualization, type TraitCategory } from './TraitVisualization.js';

export interface TraitProfileProps {
  readonly userId: string;                       // User this profile belongs to
  readonly birthChartId: string;                 // Source birth chart
  readonly traits: readonly TraitVisualization[]; // All extracted traits (8-15 typically)
  readonly personalitySummary: string;           // AI-generated overview
  readonly dominantTraits: readonly string[];    // Top 3-5 trait IDs by strength
  readonly elementalNarrative: string;           // AI interpretation of elemental balance
  readonly generatedAt: Date;                    // Timestamp of generation
}

/**
 * TraitProfile Value Object
 *
 * Represents a complete personality analysis with traits and narratives.
 * Immutable aggregate of TraitVisualization objects.
 */
export class TraitProfile {
  private constructor(private readonly props: TraitProfileProps) {
    deepFreeze(this.props);
  }

  /**
   * Factory method to create a TraitProfile
   * Validates input properties
   */
  static create(props: TraitProfileProps): TraitProfile {
    // Validate required fields
    if (!props.userId || props.userId.trim() === '') {
      throw new Error('TraitProfile: userId is required');
    }

    if (!props.birthChartId || props.birthChartId.trim() === '') {
      throw new Error('TraitProfile: birthChartId is required');
    }

    if (!Array.isArray(props.traits) || props.traits.length === 0) {
      throw new Error('TraitProfile: traits array must contain at least one trait');
    }

    // Validate all traits are TraitVisualization instances
    if (!props.traits.every(t => t instanceof TraitVisualization)) {
      throw new Error('TraitProfile: all traits must be TraitVisualization instances');
    }

    // Validate dominant traits are subset of trait IDs
    const traitIds = new Set(props.traits.map(t => t.id));
    if (!props.dominantTraits.every(id => traitIds.has(id))) {
      throw new Error('TraitProfile: dominantTraits must be a subset of trait IDs');
    }

    // Validate generatedAt is a valid date
    if (!(props.generatedAt instanceof Date) || isNaN(props.generatedAt.getTime())) {
      throw new Error('TraitProfile: generatedAt must be a valid Date');
    }

    return new TraitProfile(props);
  }

  // Getters

  get userId(): string {
    return this.props.userId;
  }

  get birthChartId(): string {
    return this.props.birthChartId;
  }

  get traits(): readonly TraitVisualization[] {
    return this.props.traits;
  }

  get personalitySummary(): string {
    return this.props.personalitySummary;
  }

  get dominantTraits(): readonly string[] {
    return this.props.dominantTraits;
  }

  get elementalNarrative(): string {
    return this.props.elementalNarrative;
  }

  get generatedAt(): Date {
    // Return a new Date instance to prevent external mutation
    return new Date(this.props.generatedAt);
  }

  /**
   * Get traits filtered by category
   */
  getTraitsByCategory(category: TraitCategory): TraitVisualization[] {
    return this.props.traits.filter(t => t.category === category);
  }

  /**
   * Get strongest N traits by strength score
   */
  getStrongestTraits(count: number): TraitVisualization[] {
    return [...this.props.traits]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, count);
  }

  /**
   * Get dominant traits as TraitVisualization objects
   */
  getDominantTraitObjects(): TraitVisualization[] {
    const traitMap = new Map(this.props.traits.map(t => [t.id, t]));
    return this.props.dominantTraits
      .map(id => traitMap.get(id))
      .filter((t): t is TraitVisualization => t !== undefined);
  }

  /**
   * Get trait by ID
   */
  getTraitById(id: string): TraitVisualization | undefined {
    return this.props.traits.find(t => t.id === id);
  }

  /**
   * Get category distribution (count of traits per category)
   */
  getCategoryDistribution(): Record<TraitCategory, number> {
    const distribution: Record<TraitCategory, number> = {
      identity: 0,
      emotional: 0,
      social: 0,
      mental: 0,
      creative: 0,
      spiritual: 0,
    };

    for (const trait of this.props.traits) {
      distribution[trait.category]++;
    }

    return distribution;
  }

  /**
   * Get average trait strength
   */
  getAverageStrength(): number {
    if (this.props.traits.length === 0) return 0;
    const total = this.props.traits.reduce((sum, t) => sum + t.strength, 0);
    return total / this.props.traits.length;
  }

  /**
   * Get strength distribution summary
   * Returns counts of traits in each strength range
   */
  getStrengthDistribution(): {
    weak: number;      // 0-40
    moderate: number;  // 41-70
    strong: number;    // 71-100
  } {
    const distribution = { weak: 0, moderate: 0, strong: 0 };

    for (const trait of this.props.traits) {
      if (trait.strength <= 40) {
        distribution.weak++;
      } else if (trait.strength <= 70) {
        distribution.moderate++;
      } else {
        distribution.strong++;
      }
    }

    return distribution;
  }

  /**
   * Convert to visualization data format for 3D globe rendering
   * Includes only properties needed for rendering
   */
  toVisualizationData(): {
    traits: Array<{
      id: string;
      name: string;
      category: TraitCategory;
      strength: number;
      position: { x: number; y: number; z: number };
      color: number;
      size: number;
    }>;
    summary: string;
  } {
    return {
      traits: this.props.traits.map(trait => ({
        id: trait.id,
        name: trait.name,
        category: trait.category,
        strength: trait.strength,
        position: trait.getPosition3D(10), // Radius of 10 units
        color: trait.getColorByCategory(),
        size: trait.getMarkerSize(),
      })),
      summary: this.props.personalitySummary,
    };
  }

  /**
   * Serialize to plain object for API responses
   */
  toJSON(): {
    userId: string;
    birthChartId: string;
    traits: ReturnType<TraitVisualization['toJSON']>[];
    personalitySummary: string;
    dominantTraits: string[];
    elementalNarrative: string;
    generatedAt: string; // ISO string
  } {
    return {
      userId: this.props.userId,
      birthChartId: this.props.birthChartId,
      traits: this.props.traits.map(t => t.toJSON()),
      personalitySummary: this.props.personalitySummary,
      dominantTraits: [...this.props.dominantTraits],
      elementalNarrative: this.props.elementalNarrative,
      generatedAt: this.props.generatedAt.toISOString(),
    };
  }

  /**
   * Deserialize from plain object (e.g., API response)
   */
  static fromJSON(json: {
    userId: string;
    birthChartId: string;
    traits: any[];
    personalitySummary: string;
    dominantTraits: string[];
    elementalNarrative: string;
    generatedAt: string;
  }): TraitProfile {
    return TraitProfile.create({
      userId: json.userId,
      birthChartId: json.birthChartId,
      traits: json.traits.map(t => TraitVisualization.fromJSON(t)),
      personalitySummary: json.personalitySummary,
      dominantTraits: json.dominantTraits,
      elementalNarrative: json.elementalNarrative,
      generatedAt: new Date(json.generatedAt),
    });
  }

  /**
   * Value object equality
   */
  equals(other: TraitProfile): boolean {
    if (!(other instanceof TraitProfile)) {
      return false;
    }

    if (this.props.userId !== other.props.userId ||
        this.props.birthChartId !== other.props.birthChartId ||
        this.props.traits.length !== other.props.traits.length) {
      return false;
    }

    // Compare all traits
    for (let i = 0; i < this.props.traits.length; i++) {
      if (!this.props.traits[i].equals(other.props.traits[i])) {
        return false;
      }
    }

    return true;
  }
}
