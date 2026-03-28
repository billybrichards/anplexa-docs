/**
 * AstrologyBlockBuilder — Converts astrology assessment output into Letta memory block content.
 *
 * Accepts domain NatalChartData directly — no intermediate DTOs.
 *
 * Produces:
 * - Human block: user's astrological profile and personality
 * - User model block: initial user model seeded with astrology data
 */

import type { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';

export class AstrologyBlockBuilder {
  private static readonly MAX_HUMAN_BLOCK_LENGTH = 3000;
  private static readonly MAX_USER_MODEL_LENGTH = 3000;

  /**
   * Build the human block content from a NatalChartData domain object.
   * This represents who the user IS from an astrological perspective.
   */
  buildHumanBlock(
    chart: NatalChartData | null | undefined,
    userName?: string | null,
  ): string {
    const sections: string[] = [];

    const name = userName || '[unknown]';
    sections.push(`Name: ${name}`);

    if (chart) {
      const planets = chart.planets;

      // Astrological Profile (Big Three)
      const sunSign = planets.sun?.sign?.toString();
      const moonSign = planets.moon?.sign?.toString();
      const risingSign = chart.ascendant?.toString();

      if (sunSign || moonSign || risingSign) {
        const astroLines: string[] = ['ASTROLOGICAL PROFILE:'];
        if (sunSign) astroLines.push(`- Sun Sign: ${sunSign}`);
        if (moonSign) astroLines.push(`- Moon Sign: ${moonSign}`);
        if (risingSign) astroLines.push(`- Rising Sign: ${risingSign}`);
        sections.push(astroLines.join('\n'));
      }

      // Dominant Traits (from chart analysis)
      const traits = [chart.dominantElement, chart.dominantModality].filter(Boolean);
      if (traits.length) {
        sections.push(`DOMINANT TRAITS:\n${traits.map((t) => `- ${t}`).join('\n')}`);
      }

      // Communication & Emotional Patterns from planetary placements
      const patterns: string[] = [];
      const mercurySign = planets.mercury?.sign?.toString();
      if (mercurySign) patterns.push(`- Communication style: Mercury in ${mercurySign}`);
      if (moonSign) patterns.push(`- Emotional patterns: Moon in ${moonSign}`);
      if (patterns.length) {
        sections.push(`KNOWN FACTS:\n${patterns.join('\n')}`);
      }
    }

    const result = sections.join('\n\n');
    return result.length > AstrologyBlockBuilder.MAX_HUMAN_BLOCK_LENGTH
      ? result.substring(0, AstrologyBlockBuilder.MAX_HUMAN_BLOCK_LENGTH - 3) + '...'
      : result;
  }

  /**
   * Build the user_model block content from a NatalChartData domain object.
   * This is the companion's evolving understanding of the user, seeded with astrology insights.
   */
  buildUserModelBlock(
    chart: NatalChartData | null | undefined,
    userName?: string | null,
  ): string {
    const name = userName || '[unknown]';
    const lines: string[] = ['User Model (update as you learn):'];

    lines.push(`- Name: ${name}`);

    if (chart) {
      const mercurySign = chart.planets.mercury?.sign?.toString();
      if (mercurySign) {
        lines.push(`- Communication style: Mercury in ${mercurySign}`);
      } else {
        lines.push('- Communication style: [observing]');
      }

      const traits = [chart.dominantElement, chart.dominantModality].filter(Boolean);
      if (traits.length) {
        lines.push(`- Key traits: ${traits.join(', ')}`);
      }

      const moonSign = chart.planets.moon?.sign?.toString();
      if (moonSign) {
        lines.push(`- Emotional patterns: Moon in ${moonSign}`);
      } else {
        lines.push('- Emotional patterns: [observing]');
      }
    } else {
      lines.push('- Communication style: [observing]');
      lines.push('- Emotional patterns: [observing]');
    }

    lines.push('- Interests: [discovering]');
    lines.push('- Boundaries: [respecting]');
    lines.push('- Relationship stage: Initial meeting — astrology-informed');

    const result = lines.join('\n');
    return result.length > AstrologyBlockBuilder.MAX_USER_MODEL_LENGTH
      ? result.substring(0, AstrologyBlockBuilder.MAX_USER_MODEL_LENGTH - 3) + '...'
      : result;
  }
}
