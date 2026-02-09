/**
 * CompatibilityResult Value Object
 *
 * Represents the astrological compatibility analysis between two natal charts
 * (typically user and AI companion).
 *
 * Includes both quantitative scores (from pure math) and qualitative narrative
 * (from AI enrichment).
 */

import { deepFreeze } from '../../../utils/deep-freeze.js';

export interface CompatibilityScores {
  readonly elementalHarmony: number;           // 0-100: Element compatibility
  readonly modalSynergy: number;               // 0-100: Modality compatibility
  readonly communicationAlignment: number;     // 0-100: Mercury sign compatibility
  readonly emotionalResonance: number;         // 0-100: Moon sign compatibility
  readonly overall: number;                    // 0-100: Weighted average
}

export interface CompatibilityResultProps {
  readonly userId: string;                          // User's ID
  readonly companionPersonaId: string;              // Companion's persona ID
  readonly scores: CompatibilityScores;             // Calculated compatibility scores
  readonly synastryHighlights: readonly string[];   // Key aspect interactions (logic-derived)
  readonly narrative: string;                       // AI-generated explanation
  readonly calculatedAt: Date;                      // Timestamp of calculation
}

/**
 * CompatibilityResult Value Object
 *
 * Immutable representation of compatibility analysis between two charts.
 * Combines deterministic scoring with AI narrative.
 */
export class CompatibilityResult {
  private constructor(private readonly props: CompatibilityResultProps) {
    deepFreeze(this.props);
  }

  /**
   * Factory method to create a CompatibilityResult
   * Validates input properties
   */
  static create(props: CompatibilityResultProps): CompatibilityResult {
    // Validate required fields
    if (!props.userId || props.userId.trim() === '') {
      throw new Error('CompatibilityResult: userId is required');
    }

    if (!props.companionPersonaId || props.companionPersonaId.trim() === '') {
      throw new Error('CompatibilityResult: companionPersonaId is required');
    }

    // Validate scores are in 0-100 range
    const scoreKeys: (keyof CompatibilityScores)[] = [
      'elementalHarmony',
      'modalSynergy',
      'communicationAlignment',
      'emotionalResonance',
      'overall'
    ];

    for (const key of scoreKeys) {
      const score = props.scores[key];
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new Error(`CompatibilityResult: ${key} must be a number between 0-100, got ${score}`);
      }
    }

    // Validate synastryHighlights is an array
    if (!Array.isArray(props.synastryHighlights)) {
      throw new Error('CompatibilityResult: synastryHighlights must be an array');
    }

    // Validate calculatedAt is a valid date
    if (!(props.calculatedAt instanceof Date) || isNaN(props.calculatedAt.getTime())) {
      throw new Error('CompatibilityResult: calculatedAt must be a valid Date');
    }

    return new CompatibilityResult(props);
  }

  // Getters

  get userId(): string {
    return this.props.userId;
  }

  get companionPersonaId(): string {
    return this.props.companionPersonaId;
  }

  get scores(): Readonly<CompatibilityScores> {
    return this.props.scores;
  }

  get synastryHighlights(): readonly string[] {
    return this.props.synastryHighlights;
  }

  get narrative(): string {
    return this.props.narrative;
  }

  get calculatedAt(): Date {
    // Return a new Date instance to prevent external mutation
    return new Date(this.props.calculatedAt);
  }

  /**
   * Get compatibility level as qualitative descriptor
   */
  getCompatibilityLevel(): 'low' | 'moderate' | 'high' | 'excellent' {
    const overall = this.props.scores.overall;
    if (overall < 40) return 'low';
    if (overall < 60) return 'moderate';
    if (overall < 80) return 'high';
    return 'excellent';
  }

  /**
   * Get strongest compatibility dimension
   * Returns the score category with highest value
   */
  getStrongestDimension(): keyof Omit<CompatibilityScores, 'overall'> {
    const dimensions: (keyof Omit<CompatibilityScores, 'overall'>)[] = [
      'elementalHarmony',
      'modalSynergy',
      'communicationAlignment',
      'emotionalResonance'
    ];

    return dimensions.reduce((strongest, current) => {
      return this.props.scores[current] > this.props.scores[strongest]
        ? current
        : strongest;
    });
  }

  /**
   * Get weakest compatibility dimension
   */
  getWeakestDimension(): keyof Omit<CompatibilityScores, 'overall'> {
    const dimensions: (keyof Omit<CompatibilityScores, 'overall'>)[] = [
      'elementalHarmony',
      'modalSynergy',
      'communicationAlignment',
      'emotionalResonance'
    ];

    return dimensions.reduce((weakest, current) => {
      return this.props.scores[current] < this.props.scores[weakest]
        ? current
        : weakest;
    });
  }

  /**
   * Get human-readable dimension name
   */
  getDimensionName(dimension: keyof Omit<CompatibilityScores, 'overall'>): string {
    const names: Record<keyof Omit<CompatibilityScores, 'overall'>, string> = {
      elementalHarmony: 'Elemental Harmony',
      modalSynergy: 'Modal Synergy',
      communicationAlignment: 'Communication Alignment',
      emotionalResonance: 'Emotional Resonance'
    };
    return names[dimension];
  }

  /**
   * Check if compatibility meets threshold
   */
  meetsThreshold(threshold: number): boolean {
    return this.props.scores.overall >= threshold;
  }

  /**
   * Get score distribution summary
   * Useful for displaying multiple scores in UI
   */
  getScoreDistribution(): Array<{
    dimension: string;
    score: number;
    level: 'low' | 'moderate' | 'high' | 'excellent';
  }> {
    return [
      {
        dimension: 'Elemental Harmony',
        score: this.props.scores.elementalHarmony,
        level: this.getScoreLevel(this.props.scores.elementalHarmony)
      },
      {
        dimension: 'Modal Synergy',
        score: this.props.scores.modalSynergy,
        level: this.getScoreLevel(this.props.scores.modalSynergy)
      },
      {
        dimension: 'Communication',
        score: this.props.scores.communicationAlignment,
        level: this.getScoreLevel(this.props.scores.communicationAlignment)
      },
      {
        dimension: 'Emotional',
        score: this.props.scores.emotionalResonance,
        level: this.getScoreLevel(this.props.scores.emotionalResonance)
      }
    ];
  }

  /**
   * Convert score to qualitative level
   */
  private getScoreLevel(score: number): 'low' | 'moderate' | 'high' | 'excellent' {
    if (score < 40) return 'low';
    if (score < 60) return 'moderate';
    if (score < 80) return 'high';
    return 'excellent';
  }

  /**
   * Get top N synastry highlights
   */
  getTopHighlights(count: number): string[] {
    return this.props.synastryHighlights.slice(0, count);
  }

  /**
   * Serialize to plain object for API responses
   */
  toJSON(): {
    userId: string;
    companionPersonaId: string;
    scores: CompatibilityScores;
    synastryHighlights: string[];
    narrative: string;
    calculatedAt: string; // ISO string
    compatibilityLevel: 'low' | 'moderate' | 'high' | 'excellent';
  } {
    return {
      userId: this.props.userId,
      companionPersonaId: this.props.companionPersonaId,
      scores: { ...this.props.scores },
      synastryHighlights: [...this.props.synastryHighlights],
      narrative: this.props.narrative,
      calculatedAt: this.props.calculatedAt.toISOString(),
      compatibilityLevel: this.getCompatibilityLevel(),
    };
  }

  /**
   * Deserialize from plain object (e.g., API response)
   */
  static fromJSON(json: {
    userId: string;
    companionPersonaId: string;
    scores: CompatibilityScores;
    synastryHighlights: string[];
    narrative: string;
    calculatedAt: string;
  }): CompatibilityResult {
    return CompatibilityResult.create({
      userId: json.userId,
      companionPersonaId: json.companionPersonaId,
      scores: json.scores,
      synastryHighlights: json.synastryHighlights,
      narrative: json.narrative,
      calculatedAt: new Date(json.calculatedAt),
    });
  }

  /**
   * Value object equality
   */
  equals(other: CompatibilityResult): boolean {
    if (!(other instanceof CompatibilityResult)) {
      return false;
    }

    return (
      this.props.userId === other.props.userId &&
      this.props.companionPersonaId === other.props.companionPersonaId &&
      this.props.scores.elementalHarmony === other.props.scores.elementalHarmony &&
      this.props.scores.modalSynergy === other.props.scores.modalSynergy &&
      this.props.scores.communicationAlignment === other.props.scores.communicationAlignment &&
      this.props.scores.emotionalResonance === other.props.scores.emotionalResonance &&
      this.props.scores.overall === other.props.scores.overall
    );
  }

  /**
   * Create a new CompatibilityResult with updated narrative
   * (Used when AI enriches base compatibility data)
   */
  withNarrative(narrative: string): CompatibilityResult {
    return CompatibilityResult.create({
      ...this.props,
      narrative,
    });
  }
}
