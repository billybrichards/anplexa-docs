/**
 * CognitiveBlockFactory — Defines cognitive memory block structures and initial values.
 * Pure service, no external dependencies.
 * Ported from Letta-Lonely.
 */

export interface MemoryBlockDefinition {
  label: string;
  value: string;
  limit: number;
}

export interface AstrologyBlockOverrides {
  /** Pre-built user model block from AstrologyBlockBuilder.buildUserModelBlock() */
  userModelValue?: string;
  /** Pre-built human block from AstrologyBlockBuilder.buildHumanBlock() */
  humanBlockValue?: string;
}

export class CognitiveBlockFactory {
  getCognitiveBlockDefinitions(
    companionName: string,
    astrology?: AstrologyBlockOverrides,
  ): MemoryBlockDefinition[] {
    const blocks: MemoryBlockDefinition[] = [
      {
        label: 'current_focus',
        value: `Currently waiting for ${companionName}'s first interaction with the user. No conversation focus yet.`,
        limit: 2000,
      },
      {
        label: 'user_model',
        value: astrology?.userModelValue || [
          'User Model (update as you learn):',
          '- Name: [unknown]',
          '- Communication style: [observing]',
          '- Interests: [unknown]',
          '- Emotional patterns: [unknown]',
          '- Preferences: [unknown]',
          '- Boundaries: [unknown]',
          '- Relationship stage: Initial meeting',
        ].join('\n'),
        limit: 3000,
      },
      {
        label: 'active_goals',
        value: [
          'Relationship Goals:',
          '- Build rapport and establish comfortable connection',
          "- Learn the user's name and interests",
          '- Discover communication style preferences',
          '- Create a warm, inviting first impression',
        ].join('\n'),
        limit: 2000,
      },
    ];

    // If astrology data provides a human block, include it
    if (astrology?.humanBlockValue) {
      blocks.push({
        label: 'human',
        value: astrology.humanBlockValue,
        limit: 3000,
      });
    }

    return blocks;
  }
}
