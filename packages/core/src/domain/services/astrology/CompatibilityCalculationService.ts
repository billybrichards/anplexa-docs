/**
 * CompatibilityCalculationService - Domain Service
 *
 * Pure logic service for calculating astrological compatibility between two natal charts.
 * No external dependencies - operates only on domain value objects.
 *
 * Algorithm:
 * - Elemental harmony: Compare dominant elements (same=100, compatible=80, neutral=50, challenging=30)
 * - Modal synergy: Compare modalities (same=100, complementary=75, neutral=50, challenging=30)
 * - Communication: Compare Mercury signs (same element=90-100, harmonious aspect=80-90, etc.)
 * - Emotional: Compare Moon signs (same element=95-100, harmonious=85-95, etc.)
 * - Overall: Weighted average (elemental*0.25 + modal*0.20 + communication*0.30 + emotional*0.25)
 */

import type { NatalChartData } from '../../value-objects/astrology/NatalChartData.js';
import type { CompatibilityScores } from '../../value-objects/astrology/CompatibilityResult.js';
import type { ZodiacSignName, Element, Modality } from '../../value-objects/astrology/ZodiacSign.js';
import type {
  ICompatibilityCalculationService,
  CompatibilityBreakdown,
} from '../ICompatibilityCalculationService.js';

/**
 * Element compatibility matrix
 * - Same element: 100 (perfect harmony)
 * - Compatible (trine): 80 (harmonious)
 * - Neutral (sextile): 50 (workable)
 * - Challenging (square/opposition): 30 (tension)
 */
const ELEMENT_COMPATIBILITY: Record<Element, Record<Element, number>> = {
  fire: { fire: 100, air: 80, earth: 30, water: 30 },
  earth: { earth: 100, water: 80, fire: 30, air: 30 },
  air: { air: 100, fire: 80, water: 30, earth: 30 },
  water: { water: 100, earth: 80, air: 30, fire: 30 },
};

/**
 * Modality compatibility matrix
 * - Same: 100 (shared approach)
 * - Complementary: 75 (balanced)
 * - Neutral: 50 (different but workable)
 * - Challenging: 30 (tension)
 */
const MODALITY_COMPATIBILITY: Record<Modality, Record<Modality, number>> = {
  cardinal: { cardinal: 100, fixed: 50, mutable: 75 },
  fixed: { fixed: 100, cardinal: 50, mutable: 50 },
  mutable: { mutable: 100, cardinal: 75, fixed: 50 },
};

/**
 * Aspect angles between signs (in signs, not degrees)
 * Conjunction: 0 signs apart
 * Sextile: 2 signs apart
 * Square: 3 signs apart
 * Trine: 4 signs apart
 * Opposition: 6 signs apart
 */
const SIGN_ORDER: ZodiacSignName[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export class CompatibilityCalculationService implements ICompatibilityCalculationService {
  /**
   * Calculate comprehensive compatibility breakdown (implements ICompatibilityCalculationService)
   *
   * @param chart1 - First person's natal chart
   * @param chart2 - Second person's natal chart
   * @returns Compatibility breakdown with scores, strengths, challenges, and advice
   */
  async calculateCompatibility(
    chart1: NatalChartData,
    chart2: NatalChartData
  ): Promise<CompatibilityBreakdown> {
    // Calculate scores using existing method
    const scores = this.calculateScores(chart1, chart2);

    // Extract strengths from synastry highlights
    const strengths = this.extractSynastryHighlights(chart1, chart2);

    // Identify challenges based on low-scoring dimensions
    const challenges = this.identifyChallenges(scores, chart1, chart2);

    // Generate advice based on compatibility profile
    const advice = this.generateAdvice(scores, strengths, challenges);

    return {
      scores,
      strengths,
      challenges,
      advice,
    };
  }

  /**
   * Calculate compatibility scores between two natal charts
   *
   * @param userChart - User's natal chart
   * @param companionChart - Companion's natal chart
   * @returns Compatibility scores object (0-100 for each dimension)
   */
  calculateScores(userChart: NatalChartData, companionChart: NatalChartData): CompatibilityScores {
    // Calculate individual dimensions
    const elementalHarmony = this.calculateElementalHarmony(userChart, companionChart);
    const modalSynergy = this.calculateModalSynergy(userChart, companionChart);
    const communicationAlignment = this.calculateCommunicationAlignment(userChart, companionChart);
    const emotionalResonance = this.calculateEmotionalResonance(userChart, companionChart);

    // Calculate weighted overall score
    const overall = Math.round(
      elementalHarmony * 0.25 +
      modalSynergy * 0.20 +
      communicationAlignment * 0.30 +
      emotionalResonance * 0.25
    );

    return {
      elementalHarmony,
      modalSynergy,
      communicationAlignment,
      emotionalResonance,
      overall,
    };
  }

  /**
   * Extract key synastry highlights (3-5 notable aspects/connections)
   *
   * @param userChart - User's natal chart
   * @param companionChart - Companion's natal chart
   * @returns Array of highlight strings
   */
  extractSynastryHighlights(userChart: NatalChartData, companionChart: NatalChartData): string[] {
    const highlights: string[] = [];

    // Sun-Moon aspects (emotional connection)
    const sunMoonAspect = this.getAspectBetweenPlanets(
      userChart.planets.sun.sign.name,
      companionChart.planets.moon.sign.name
    );
    if (sunMoonAspect === 'conjunction' || sunMoonAspect === 'trine') {
      highlights.push(`Strong emotional connection: Your Sun ${sunMoonAspect} their Moon`);
    } else if (sunMoonAspect === 'opposition') {
      highlights.push(`Dynamic tension: Your Sun opposes their Moon (attraction through differences)`);
    }

    // Venus-Mars aspects (romantic attraction)
    const venusMarsAspect = this.getAspectBetweenPlanets(
      userChart.planets.venus.sign.name,
      companionChart.planets.mars.sign.name
    );
    if (venusMarsAspect === 'conjunction' || venusMarsAspect === 'trine' || venusMarsAspect === 'sextile') {
      highlights.push(`Magnetic attraction: Your Venus ${venusMarsAspect} their Mars`);
    }

    // Mercury-Mercury aspects (communication style)
    const mercuryAspect = this.getAspectBetweenPlanets(
      userChart.planets.mercury.sign.name,
      companionChart.planets.mercury.sign.name
    );
    if (mercuryAspect === 'conjunction') {
      highlights.push(`Excellent communication: Mercury signs in conjunction (similar thinking)`);
    } else if (mercuryAspect === 'trine' || mercuryAspect === 'sextile') {
      highlights.push(`Harmonious communication: Mercury signs in ${mercuryAspect}`);
    } else if (mercuryAspect === 'square') {
      highlights.push(`Communication challenges: Mercury signs square (growth through dialogue)`);
    }

    // Ascendant connections (if birth time known)
    if (userChart.ascendant && companionChart.ascendant) {
      const ascendantAspect = this.getAspectBetweenPlanets(
        userChart.ascendant.name,
        companionChart.ascendant.name
      );
      if (ascendantAspect === 'conjunction' || ascendantAspect === 'trine') {
        highlights.push(`Natural compatibility: Rising signs in ${ascendantAspect}`);
      }
    }

    // Elemental balance
    const userElement = userChart.dominantElement;
    const companionElement = companionChart.dominantElement;
    const elementScore = ELEMENT_COMPATIBILITY[userElement][companionElement];
    if (elementScore >= 80) {
      highlights.push(`Strong elemental harmony: ${userElement} and ${companionElement} blend naturally`);
    } else if (elementScore <= 30) {
      highlights.push(`Elemental contrast: ${userElement} and ${companionElement} offer complementary perspectives`);
    }

    // Modal dynamics
    const userModality = userChart.dominantModality;
    const companionModality = companionChart.dominantModality;
    if (userModality === companionModality) {
      highlights.push(`Shared rhythm: Both ${userModality} modality (similar pacing)`);
    }

    // Return top 5 highlights (or fewer if not enough notable aspects)
    return highlights.slice(0, 5);
  }

  /**
   * Calculate elemental harmony score
   * Compares dominant elements and overall elemental balance
   */
  private calculateElementalHarmony(userChart: NatalChartData, companionChart: NatalChartData): number {
    const userElement = userChart.dominantElement;
    const companionElement = companionChart.dominantElement;

    // Base score from dominant element compatibility
    let score = ELEMENT_COMPATIBILITY[userElement][companionElement];

    // Adjust based on overall elemental balance similarity
    const userBalance = userChart.getElementalBalance();
    const companionBalance = companionChart.getElementalBalance();

    // Calculate balance similarity (how similar are their elemental distributions)
    let balanceSimilarity = 0;
    for (const element of ['fire', 'earth', 'air', 'water'] as Element[]) {
      const diff = Math.abs(userBalance[element] - companionBalance[element]);
      balanceSimilarity += (12 - diff) / 12; // Normalize to 0-1 range
    }
    balanceSimilarity = (balanceSimilarity / 4) * 100; // Average and convert to 0-100

    // Weighted combination: 70% dominant element, 30% overall balance
    score = Math.round(score * 0.7 + balanceSimilarity * 0.3);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate modal synergy score
   * Compares dominant modalities and modal balance
   */
  private calculateModalSynergy(userChart: NatalChartData, companionChart: NatalChartData): number {
    const userModality = userChart.dominantModality;
    const companionModality = companionChart.dominantModality;

    // Base score from dominant modality compatibility
    let score = MODALITY_COMPATIBILITY[userModality][companionModality];

    // Adjust based on modal balance similarity
    const userBalance = userChart.getModalBalance();
    const companionBalance = companionChart.getModalBalance();

    let balanceSimilarity = 0;
    for (const modality of ['cardinal', 'fixed', 'mutable'] as Modality[]) {
      const diff = Math.abs(userBalance[modality] - companionBalance[modality]);
      balanceSimilarity += (12 - diff) / 12;
    }
    balanceSimilarity = (balanceSimilarity / 3) * 100;

    // Weighted combination: 60% dominant modality, 40% overall balance
    score = Math.round(score * 0.6 + balanceSimilarity * 0.4);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate communication alignment (Mercury sign compatibility)
   */
  private calculateCommunicationAlignment(userChart: NatalChartData, companionChart: NatalChartData): number {
    const userMercury = userChart.planets.mercury.sign;
    const companionMercury = companionChart.planets.mercury.sign;

    // Check aspect between Mercury signs
    const aspect = this.getAspectBetweenPlanets(userMercury.name, companionMercury.name);

    let score = 50; // Base score

    // Adjust based on aspect
    if (aspect === 'conjunction') {
      score = 95; // Same sign or adjacent = very similar communication
    } else if (aspect === 'trine') {
      score = 88; // Harmonious element = natural flow
    } else if (aspect === 'sextile') {
      score = 82; // Compatible elements = good understanding
    } else if (aspect === 'square') {
      score = 45; // Tension = communication challenges
    } else if (aspect === 'opposition') {
      score = 55; // Opposite = complementary but requires effort
    }

    // Bonus if same element (even without perfect aspect)
    if (userMercury.element === companionMercury.element) {
      score = Math.min(100, score + 10);
    }

    return Math.round(score);
  }

  /**
   * Calculate emotional resonance (Moon sign compatibility)
   */
  private calculateEmotionalResonance(userChart: NatalChartData, companionChart: NatalChartData): number {
    const userMoon = userChart.planets.moon.sign;
    const companionMoon = companionChart.planets.moon.sign;

    // Check aspect between Moon signs
    const aspect = this.getAspectBetweenPlanets(userMoon.name, companionMoon.name);

    let score = 50; // Base score

    // Adjust based on aspect
    if (aspect === 'conjunction') {
      score = 98; // Same emotional language
    } else if (aspect === 'trine') {
      score = 92; // Harmonious emotional flow
    } else if (aspect === 'sextile') {
      score = 85; // Compatible emotional expression
    } else if (aspect === 'square') {
      score = 40; // Emotional friction
    } else if (aspect === 'opposition') {
      score = 50; // Complementary but requires balance
    }

    // Bonus if same element
    if (userMoon.element === companionMoon.element) {
      score = Math.min(100, score + 12);
    }

    // Additional bonus if same modality (similar emotional pacing)
    if (userMoon.modality === companionMoon.modality) {
      score = Math.min(100, score + 8);
    }

    return Math.round(score);
  }

  /**
   * Calculate aspect between two signs
   * Returns the type of aspect based on sign separation
   */
  private getAspectBetweenPlanets(sign1: ZodiacSignName, sign2: ZodiacSignName): string {
    const index1 = SIGN_ORDER.indexOf(sign1);
    const index2 = SIGN_ORDER.indexOf(sign2);

    if (index1 === -1 || index2 === -1) {
      return 'none';
    }

    // Calculate shortest distance between signs (0-6)
    let distance = Math.abs(index1 - index2);
    if (distance > 6) {
      distance = 12 - distance;
    }

    // Map distance to aspect type
    switch (distance) {
      case 0:
        return 'conjunction'; // Same sign
      case 1:
        return 'semisextile'; // Minor aspect
      case 2:
        return 'sextile'; // Harmonious
      case 3:
        return 'square'; // Challenging
      case 4:
        return 'trine'; // Harmonious
      case 5:
        return 'inconjunct'; // Minor challenging
      case 6:
        return 'opposition'; // Polarizing
      default:
        return 'none';
    }
  }

  /**
   * Identify potential challenges based on compatibility scores
   *
   * @param scores - Calculated compatibility scores
   * @param chart1 - First chart
   * @param chart2 - Second chart
   * @returns Array of challenge descriptions
   */
  private identifyChallenges(
    scores: CompatibilityScores,
    chart1: NatalChartData,
    chart2: NatalChartData
  ): string[] {
    const challenges: string[] = [];

    // Low elemental harmony
    if (scores.elementalHarmony < 50) {
      const elem1 = chart1.dominantElement;
      const elem2 = chart2.dominantElement;
      challenges.push(
        `Elemental differences: ${elem1} and ${elem2} energies may require conscious bridging`
      );
    }

    // Low modal synergy
    if (scores.modalSynergy < 50) {
      const mod1 = chart1.dominantModality;
      const mod2 = chart2.dominantModality;
      challenges.push(
        `Different pacing: ${mod1} and ${mod2} approaches may need patience and understanding`
      );
    }

    // Communication challenges
    if (scores.communicationAlignment < 50) {
      challenges.push('Communication styles differ - active listening and clarity will be important');
    }

    // Emotional resonance challenges
    if (scores.emotionalResonance < 50) {
      challenges.push(
        'Emotional needs may vary - expressing feelings clearly will strengthen connection'
      );
    }

    // If no specific challenges identified, add a general growth note
    if (challenges.length === 0) {
      challenges.push('All relationships benefit from continued communication and mutual respect');
    }

    return challenges.slice(0, 3); // Limit to top 3 challenges
  }

  /**
   * Generate relationship advice based on compatibility profile
   *
   * @param scores - Compatibility scores
   * @param strengths - Identified strengths
   * @param challenges - Identified challenges
   * @returns Array of advice strings
   */
  private generateAdvice(
    scores: CompatibilityScores,
    strengths: string[],
    challenges: string[]
  ): string[] {
    const advice: string[] = [];

    // Advice based on overall compatibility level
    if (scores.overall >= 80) {
      advice.push('Your high compatibility creates a strong foundation - nurture this connection');
    } else if (scores.overall >= 60) {
      advice.push('Good compatibility with room to grow - focus on understanding differences');
    } else {
      advice.push('Differences can be strengths - embrace complementary qualities');
    }

    // Communication-specific advice
    if (scores.communicationAlignment < 60) {
      advice.push('Practice clear, direct communication to bridge different thinking styles');
    } else {
      advice.push('Leverage your communication harmony to work through any challenges together');
    }

    // Emotional advice
    if (scores.emotionalResonance < 60) {
      advice.push('Take time to understand each other\'s emotional languages and needs');
    } else {
      advice.push('Your emotional connection is a strength - use it to deepen your bond');
    }

    // Growth-oriented advice
    advice.push('Remember: compatibility is about growth, not perfection');

    return advice.slice(0, 4); // Limit to top 4 pieces of advice
  }
}
