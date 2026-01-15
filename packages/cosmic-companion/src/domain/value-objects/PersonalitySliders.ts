/**
 * PersonalitySliders Value Object
 *
 * Allows fine-tuning of companion personality beyond base zodiac traits.
 * Each slider is 0-100 representing a personality dimension.
 */

export interface PersonalityDimensions {
  confidence: number;      // 0=Shy, 100=Very Confident
  playfulness: number;     // 0=Serious, 100=Very Playful
  dominance: number;       // 0=Submissive, 100=Dominant
  emotionalDepth: number;  // 0=Reserved, 100=Deeply Emotional
  directness: number;      // 0=Subtle/Indirect, 100=Very Direct
}

export class PersonalitySliders {
  private constructor(private readonly dimensions: PersonalityDimensions) {
    this.validate();
  }

  private validate(): void {
    const dims = Object.entries(this.dimensions);
    for (const [key, value] of dims) {
      if (value < 0 || value > 100) {
        throw new Error(`${key} must be between 0 and 100`);
      }
    }
  }

  get confidence(): number {
    return this.dimensions.confidence;
  }

  get playfulness(): number {
    return this.dimensions.playfulness;
  }

  get dominance(): number {
    return this.dimensions.dominance;
  }

  get emotionalDepth(): number {
    return this.dimensions.emotionalDepth;
  }

  get directness(): number {
    return this.dimensions.directness;
  }

  /**
   * Generate personality description for AI prompts
   */
  toPromptDescription(): string {
    const parts: string[] = [];

    // Confidence
    if (this.confidence > 75) parts.push('very confident and self-assured');
    else if (this.confidence > 50) parts.push('confident');
    else if (this.confidence > 25) parts.push('modest');
    else parts.push('shy and reserved');

    // Playfulness
    if (this.playfulness > 75) parts.push('extremely playful and fun-loving');
    else if (this.playfulness > 50) parts.push('playful');
    else if (this.playfulness > 25) parts.push('somewhat serious');
    else parts.push('very serious and grounded');

    // Dominance
    if (this.dominance > 75) parts.push('dominant and assertive');
    else if (this.dominance > 50) parts.push('balanced in taking lead');
    else if (this.dominance > 25) parts.push('more submissive');
    else parts.push('very submissive and yielding');

    // Emotional Depth
    if (this.emotionalDepth > 75) parts.push('deeply emotional and expressive');
    else if (this.emotionalDepth > 50) parts.push('emotionally present');
    else if (this.emotionalDepth > 25) parts.push('emotionally reserved');
    else parts.push('very detached emotionally');

    // Directness
    if (this.directness > 75) parts.push('very direct and straightforward');
    else if (this.directness > 50) parts.push('fairly direct');
    else if (this.directness > 25) parts.push('subtle in communication');
    else parts.push('very indirect and nuanced');

    return parts.join(', ');
  }

  /**
   * Create default sliders from zodiac sign (baseline)
   */
  static createDefault(): PersonalitySliders {
    return new PersonalitySliders({
      confidence: 50,
      playfulness: 50,
      dominance: 50,
      emotionalDepth: 50,
      directness: 50
    });
  }

  /**
   * Create from specific values
   */
  static create(dimensions: PersonalityDimensions): PersonalitySliders {
    return new PersonalitySliders(dimensions);
  }

  toJSON(): PersonalityDimensions {
    return { ...this.dimensions };
  }
}
