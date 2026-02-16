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

export class CognitiveBlockFactory {
  getCognitiveBlockDefinitions(companionName: string): MemoryBlockDefinition[] {
    return [
      {
        label: 'current_focus',
        value: `Currently waiting for ${companionName}'s first interaction with the user. No conversation focus yet.`,
        limit: 2000,
      },
      {
        label: 'user_model',
        value: [
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
  }
}
