/**
 * Personality Traits Value Object
 *
 * Collection of key personality traits for the AI companion.
 * Generated based on overall birth chart analysis.
 */

export interface PersonalityTraitsProps {
  traits: string[]; // 3-7 key traits
  coreArchetype?: string; // Optional archetype (e.g., "The Wise Guide", "The Playful Friend")
}

export class PersonalityTraits {
  private constructor(
    public readonly traits: readonly string[],
    public readonly coreArchetype: string | null
  ) {}

  static create(props: PersonalityTraitsProps): PersonalityTraits {
    if (props.traits.length < 3) {
      throw new Error('PersonalityTraits must have at least 3 traits');
    }
    if (props.traits.length > 7) {
      throw new Error('PersonalityTraits cannot have more than 7 traits (keep it focused)');
    }

    // Validate no empty traits
    props.traits.forEach((trait) => {
      if (!trait || trait.trim().length === 0) {
        throw new Error('Personality traits cannot be empty');
      }
    });

    // Check for meaningful, non-contradictory traits (basic validation)
    const lowercaseTraits = props.traits.map((t) => t.toLowerCase());
    const contradictions = [
      ['extroverted', 'introverted'],
      ['logical', 'emotional'],
      ['serious', 'playful'],
    ];

    for (const [trait1, trait2] of contradictions) {
      if (lowercaseTraits.includes(trait1) && lowercaseTraits.includes(trait2)) {
        throw new Error(`Contradictory traits detected: ${trait1} and ${trait2}`);
      }
    }

    return new PersonalityTraits(
      Object.freeze([...props.traits]),
      props.coreArchetype ?? null
    );
  }

  /**
   * Get description for LLM system prompt
   */
  getDescription(): string {
    const traitList = this.traits.map((t, i) => {
      if (i === this.traits.length - 1 && this.traits.length > 1) {
        return `and ${t}`;
      }
      return t;
    }).join(', ');

    let description = `You embody the following core traits: ${traitList}`;

    if (this.coreArchetype) {
      description += `. Your archetype is ${this.coreArchetype}`;
    }

    return description + '.';
  }

  /**
   * Get a short summary
   */
  getSummary(): string {
    if (this.traits.length <= 3) {
      return this.traits.join(', ');
    }
    return `${this.traits.slice(0, 3).join(', ')}, and ${this.traits.length - 3} more`;
  }

  /**
   * Check if has a specific trait
   */
  hasTrait(trait: string): boolean {
    return this.traits.some((t) => t.toLowerCase() === trait.toLowerCase());
  }

  toJSON(): object {
    return {
      traits: this.traits,
      coreArchetype: this.coreArchetype,
    };
  }

  static fromJSON(data: any): PersonalityTraits {
    return PersonalityTraits.create({
      traits: data.traits,
      coreArchetype: data.coreArchetype,
    });
  }
}
