/**
 * CompanionBlockBuilder — Constructs companion persona blocks enriched with astrological awareness.
 *
 * Accepts domain value objects directly — no intermediate DTOs.
 * Takes companion personality data and NatalChartData to build a persona block
 * that makes the companion aware of the user's astrological profile.
 */

import type { PersonalityTraits } from '@anplexa/core/domain/value-objects/companion/PersonalityTraits';
import type { CommunicationStyle } from '@anplexa/core/domain/value-objects/companion/CommunicationStyle';
import type { EmotionalApproach } from '@anplexa/core/domain/value-objects/companion/EmotionalApproach';
import type { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';

/** Minimal companion input — matches CompanionPersona entity shape */
export interface CompanionPersonaInput {
  name: string;
  personalityTraits?: PersonalityTraits | null;
  communicationStyle?: CommunicationStyle | null;
  emotionalApproach?: EmotionalApproach | null;
  systemPrompt?: string;
}

export class CompanionBlockBuilder {
  private static readonly MAX_PERSONA_BLOCK_LENGTH = 4000;

  /**
   * Build a persona block for a companion that is aware of the user's astrological profile.
   */
  buildPersonaBlock(
    companion: CompanionPersonaInput,
    chart: NatalChartData | null | undefined,
  ): string {
    const sections: string[] = [];

    // Identity
    sections.push(`IDENTITY:\nI am ${companion.name}, a companion designed to connect meaningfully.`);

    // Personality — from PersonalityTraits value object
    if (companion.personalityTraits) {
      const traits = companion.personalityTraits.traits;
      if (traits?.length) {
        const lines = traits.map((t) => `- ${t}`).join('\n');
        sections.push(`PERSONALITY:\n${lines}`);
      }
      const archetype = (companion.personalityTraits as { coreArchetype?: string | null }).coreArchetype;
      if (archetype) {
        sections.push(`ARCHETYPE: ${archetype}`);
      }
    }

    // Communication Style — from CommunicationStyle value object
    if (companion.communicationStyle) {
      const cs = companion.communicationStyle;
      const lines: string[] = [];
      if (cs.tone) lines.push(`- Tone: ${cs.tone}`);
      if (cs.directness) lines.push(`- Directness: ${cs.directness}`);
      if (cs.pacing) lines.push(`- Pacing: ${cs.pacing}`);
      if (cs.emotionalExpressiveness) lines.push(`- Expressiveness: ${cs.emotionalExpressiveness}`);
      if (cs.formalityLevel !== undefined) lines.push(`- Formality: ${cs.formalityLevel}/10`);
      if (lines.length) sections.push(`COMMUNICATION STYLE:\n${lines.join('\n')}`);
    }

    // Emotional Approach — from EmotionalApproach value object
    if (companion.emotionalApproach) {
      const ea = companion.emotionalApproach;
      const lines: string[] = [];
      if (ea.empathyLevel) lines.push(`- Empathy: ${ea.empathyLevel}`);
      if (ea.supportStyle) lines.push(`- Support style: ${ea.supportStyle}`);
      if (ea.depthPreference) lines.push(`- Depth: ${ea.depthPreference}`);
      if (lines.length) sections.push(`EMOTIONAL APPROACH:\n${lines.join('\n')}`);
    }

    // Astrological Awareness (from user's NatalChartData)
    if (chart) {
      const awarenessLines: string[] = ['ASTROLOGICAL AWARENESS:'];

      const sunSign = chart.planets.sun?.sign?.toString();
      if (sunSign) {
        awarenessLines.push(`- The user's Sun is in ${sunSign}. Adapt your energy accordingly.`);
      }
      const moonSign = chart.planets.moon?.sign?.toString();
      if (moonSign) {
        awarenessLines.push(`- The user's Moon is in ${moonSign}. Be sensitive to their emotional nature.`);
      }
      const mercurySign = chart.planets.mercury?.sign?.toString();
      if (mercurySign) {
        awarenessLines.push(`- Their communication style: Mercury in ${mercurySign}`);
      }
      const traits = [chart.dominantElement, chart.dominantModality].filter(Boolean);
      if (traits.length) {
        awarenessLines.push(`- Key personality traits: ${traits.join(', ')}`);
      }

      awarenessLines.push('- Use this astrological awareness subtly — never lecturing about astrology.');
      awarenessLines.push('- Let your understanding of their nature inform HOW you respond, not WHAT you say.');

      if (awarenessLines.length > 2) {
        sections.push(awarenessLines.join('\n'));
      }
    }

    const result = sections.join('\n\n');
    return result.length > CompanionBlockBuilder.MAX_PERSONA_BLOCK_LENGTH
      ? result.substring(0, CompanionBlockBuilder.MAX_PERSONA_BLOCK_LENGTH - 3) + '...'
      : result;
  }
}
