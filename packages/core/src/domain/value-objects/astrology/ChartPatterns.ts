/**
 * Chart Patterns Value Object
 *
 * Identifies and describes significant astrological patterns in a natal chart.
 * These patterns provide deeper insights into personality and life themes.
 */

export type ChartPatternType =
  | 'grand_trine'
  | 'grand_cross'
  | 'grand_square'
  | 't_square'
  | 'yod'
  | 'stellium'
  | 'kite'
  | 'mystic_rectangle'
  | 'castle'
  | 'splash'
  | 'bundle'
  | 'locomotive'
  | 'bowl'
  | 'bucket'
  | 'seesaw'
  | 'splay';

export interface ChartPattern {
  type: ChartPatternType;
  planets: string[];
  description: string;
  element?: 'fire' | 'earth' | 'air' | 'water'; // For elemental patterns
  houses?: number[]; // Houses involved
  significance: 'high' | 'medium' | 'low';
}

export interface ChartPatternAnalysis {
  patterns: ChartPattern[];
  shapeDescription: string; // Overall chart shape
  focusAreas: string[]; // Key life areas emphasized
}

export class ChartPatterns {
  private constructor(
    public readonly patterns: ChartPattern[],
    public readonly shapeDescription: string,
    public readonly focusAreas: string[]
  ) {}

  static create(analysis: ChartPatternAnalysis): ChartPatterns {
    return new ChartPatterns(
      analysis.patterns,
      analysis.shapeDescription,
      analysis.focusAreas
    );
  }

  /**
   * Get patterns by significance level
   */
  getPatternsBySignificance(level: 'high' | 'medium' | 'low'): ChartPattern[] {
    return this.patterns.filter((p) => p.significance === level);
  }

  /**
   * Get major patterns (high significance)
   */
  getMajorPatterns(): ChartPattern[] {
    return this.getPatternsBySignificance('high');
  }

  /**
   * Check if chart has stelliums (3+ planets in one sign/house)
   */
  hasStelliums(): boolean {
    return this.patterns.some((p) => p.type === 'stellium');
  }

  /**
   * Get chart shape summary
   */
  getSummary(): string {
    const majorPatterns = this.getMajorPatterns();
    if (majorPatterns.length === 0) {
      return this.shapeDescription;
    }

    const patternNames = majorPatterns.map((p) => p.type.replace('_', ' ')).join(', ');
    return `${this.shapeDescription} with ${patternNames}`;
  }

  toJSON(): object {
    return {
      patterns: this.patterns,
      shapeDescription: this.shapeDescription,
      focusAreas: this.focusAreas,
    };
  }

  static fromJSON(data: any): ChartPatterns {
    return ChartPatterns.create({
      patterns: data.patterns,
      shapeDescription: data.shapeDescription,
      focusAreas: data.focusAreas,
    });
  }
}
