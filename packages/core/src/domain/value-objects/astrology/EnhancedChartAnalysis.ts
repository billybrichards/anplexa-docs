/**
 * Enhanced Chart Analysis Value Object
 *
 * Contains deeper astrological analysis including:
 * - Hemisphere emphasis (northern/southern, eastern/western)
 * - House distribution (angular/succedent/cadent)
 * - Retrograde planets count
 * - Planetary strength scores
 * - Additional sensitive points
 */

import type { ZodiacSignName } from './ZodiacSign';
import { ChartPatterns } from './ChartPatterns';

export interface HemisphereEmphasis {
  northern: number; // Planets in houses 1-6
  southern: number; // Planets in houses 7-12
  eastern: number; // Planets in houses 10-12, 1-3
  western: number; // Planets in houses 4-9
  emphasis: 'northern' | 'southern' | 'eastern' | 'western' | 'balanced';
  interpretation: string;
}

export interface HouseDistribution {
  angular: number; // Houses 1, 4, 7, 10 (action-oriented)
  succedent: number; // Houses 2, 5, 8, 11 (stability-focused)
  cadent: number; // Houses 3, 6, 9, 12 (adaptable, mental)
  emphasis: 'angular' | 'succedent' | 'cadent' | 'balanced';
  interpretation: string;
}

export interface SensitivePoint {
  name: string;
  degree: number;
  sign: ZodiacSignName;
  house: number | null;
  interpretation: string;
}

export interface PlanetStrength {
  planetName: string;
  overallStrength: number; // 0-100
  dignityStrength: number; // Based on essential dignity
  aspectStrength: number; // Based on aspects
  houseStrength: number; // Based on house placement
  isRetrograde: boolean;
  isAngular: boolean; // In house 1, 4, 7, or 10
  notes: string[];
}

export interface EnhancedChartAnalysisProps {
  hemisphereEmphasis: HemisphereEmphasis;
  houseDistribution: HouseDistribution;
  retrogradeCount: number;
  retrogradePlanets: string[];
  planetStrengths: PlanetStrength[];
  sensitivePoints: SensitivePoint[];
  chartPatterns: ChartPatterns;
  chartRuler: {
    // Planet ruling the rising sign
    planet: string;
    sign: ZodiacSignName;
    house: number | null;
    interpretation: string;
  } | null;
}

export class EnhancedChartAnalysis {
  private constructor(
    public readonly hemisphereEmphasis: HemisphereEmphasis,
    public readonly houseDistribution: HouseDistribution,
    public readonly retrogradeCount: number,
    public readonly retrogradePlanets: string[],
    public readonly planetStrengths: PlanetStrength[],
    public readonly sensitivePoints: SensitivePoint[],
    public readonly chartPatterns: ChartPatterns,
    public readonly chartRuler: EnhancedChartAnalysisProps['chartRuler']
  ) {}

  static create(props: EnhancedChartAnalysisProps): EnhancedChartAnalysis {
    return new EnhancedChartAnalysis(
      props.hemisphereEmphasis,
      props.houseDistribution,
      props.retrogradeCount,
      props.retrogradePlanets,
      props.planetStrengths,
      props.sensitivePoints,
      props.chartPatterns,
      props.chartRuler
    );
  }

  /**
   * Get strongest planets (top 3)
   */
  getStrongestPlanets(): PlanetStrength[] {
    return [...this.planetStrengths]
      .sort((a, b) => b.overallStrength - a.overallStrength)
      .slice(0, 3);
  }

  /**
   * Get challenged planets (bottom 3)
   */
  getChallengedPlanets(): PlanetStrength[] {
    return [...this.planetStrengths]
      .sort((a, b) => a.overallStrength - b.overallStrength)
      .slice(0, 3);
  }

  /**
   * Get angular planets (powerful positions)
   */
  getAngularPlanets(): PlanetStrength[] {
    return this.planetStrengths.filter((p) => p.isAngular);
  }

  /**
   * Check if chart emphasizes relationships (western hemisphere)
   */
  emphasizesRelationships(): boolean {
    return this.hemisphereEmphasis.emphasis === 'western';
  }

  /**
   * Check if chart emphasizes personal action (eastern hemisphere)
   */
  emphasizesIndependence(): boolean {
    return this.hemisphereEmphasis.emphasis === 'eastern';
  }

  /**
   * Check if chart emphasizes public/outer life (southern hemisphere)
   */
  emphasizesPublicLife(): boolean {
    return this.hemisphereEmphasis.emphasis === 'southern';
  }

  /**
   * Check if chart emphasizes private/inner life (northern hemisphere)
   */
  emphasizesPrivateLife(): boolean {
    return this.hemisphereEmphasis.emphasis === 'northern';
  }

  /**
   * Get Part of Fortune if available
   */
  getPartOfFortune(): SensitivePoint | undefined {
    return this.sensitivePoints.find((p) => p.name === 'Part of Fortune');
  }

  /**
   * Get summary for companion persona generation
   */
  getPersonaRelevantSummary(): string {
    const summary: string[] = [];

    // Hemisphere emphasis
    summary.push(this.hemisphereEmphasis.interpretation);

    // House distribution
    summary.push(this.houseDistribution.interpretation);

    // Retrograde emphasis
    if (this.retrogradeCount >= 3) {
      summary.push(
        `${this.retrogradeCount} retrograde planets suggest introspection and internal processing`
      );
    }

    // Major patterns
    const majorPatterns = this.chartPatterns.getMajorPatterns();
    if (majorPatterns.length > 0) {
      summary.push(
        `Major patterns: ${majorPatterns.map((p) => p.description).join('; ')}`
      );
    }

    // Chart ruler
    if (this.chartRuler) {
      summary.push(this.chartRuler.interpretation);
    }

    return summary.join('. ');
  }

  toJSON(): object {
    return {
      hemisphereEmphasis: this.hemisphereEmphasis,
      houseDistribution: this.houseDistribution,
      retrogradeCount: this.retrogradeCount,
      retrogradePlanets: this.retrogradePlanets,
      planetStrengths: this.planetStrengths,
      sensitivePoints: this.sensitivePoints,
      chartPatterns: this.chartPatterns.toJSON(),
      chartRuler: this.chartRuler,
    };
  }

  static fromJSON(data: any): EnhancedChartAnalysis {
    return EnhancedChartAnalysis.create({
      hemisphereEmphasis: data.hemisphereEmphasis,
      houseDistribution: data.houseDistribution,
      retrogradeCount: data.retrogradeCount,
      retrogradePlanets: data.retrogradePlanets,
      planetStrengths: data.planetStrengths,
      sensitivePoints: data.sensitivePoints,
      chartPatterns: ChartPatterns.fromJSON(data.chartPatterns),
      chartRuler: data.chartRuler,
    });
  }
}
