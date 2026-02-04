/**
 * Communication Style Value Object
 *
 * Defines how the AI companion communicates with the user.
 * Generated based on Mercury placement and chart patterns.
 */

export type ToneType = 'warm' | 'intellectual' | 'playful' | 'grounded' | 'mystical' | 'professional' | 'friendly';
export type DirectnessType = 'direct' | 'gentle' | 'exploratory' | 'nuanced';
export type PacingType = 'quick' | 'thoughtful' | 'patient' | 'adaptive';

export interface CommunicationStyleProps {
  tone: ToneType;
  directness: DirectnessType;
  pacing: PacingType;
  verbosity: 'concise' | 'moderate' | 'detailed';
  formalityLevel: number; // 0-10 (0 = very casual, 10 = very formal)
  usesMetaphors: boolean;
  usesHumor: boolean;
  emotionalExpressiveness: 'reserved' | 'balanced' | 'expressive';
}

export class CommunicationStyle {
  private constructor(
    public readonly tone: ToneType,
    public readonly directness: DirectnessType,
    public readonly pacing: PacingType,
    public readonly verbosity: 'concise' | 'moderate' | 'detailed',
    public readonly formalityLevel: number,
    public readonly usesMetaphors: boolean,
    public readonly usesHumor: boolean,
    public readonly emotionalExpressiveness: 'reserved' | 'balanced' | 'expressive'
  ) {}

  static create(props: CommunicationStyleProps): CommunicationStyle {
    if (props.formalityLevel < 0 || props.formalityLevel > 10) {
      throw new Error('Formality level must be between 0 and 10');
    }

    return new CommunicationStyle(
      props.tone,
      props.directness,
      props.pacing,
      props.verbosity,
      props.formalityLevel,
      props.usesMetaphors,
      props.usesHumor,
      props.emotionalExpressiveness
    );
  }

  /**
   * Get description for LLM system prompt
   */
  getDescription(): string {
    const parts: string[] = [];

    parts.push(`Communicate with a ${this.tone} tone`);
    parts.push(`Be ${this.directness} in your approach`);
    parts.push(`Pace your responses ${this.pacing === 'quick' ? 'quickly and efficiently' : this.pacing === 'thoughtful' ? 'thoughtfully with depth' : 'patiently, allowing time for processing'}`);
    parts.push(`Keep responses ${this.verbosity}`);

    if (this.formalityLevel <= 3) {
      parts.push('Use a casual, conversational style');
    } else if (this.formalityLevel >= 7) {
      parts.push('Maintain a professional, polished tone');
    } else {
      parts.push('Balance professionalism with approachability');
    }

    if (this.usesMetaphors) {
      parts.push('Use metaphors and analogies to illustrate concepts');
    }

    if (this.usesHumor) {
      parts.push('Incorporate appropriate humor when suitable');
    }

    parts.push(`Be ${this.emotionalExpressiveness} in emotional expression`);

    return parts.join('. ') + '.';
  }

  /**
   * Get a short summary
   */
  getSummary(): string {
    return `${this.tone}, ${this.directness}, ${this.pacing}-paced`;
  }

  toJSON(): object {
    return {
      tone: this.tone,
      directness: this.directness,
      pacing: this.pacing,
      verbosity: this.verbosity,
      formalityLevel: this.formalityLevel,
      usesMetaphors: this.usesMetaphors,
      usesHumor: this.usesHumor,
      emotionalExpressiveness: this.emotionalExpressiveness,
    };
  }

  static fromJSON(data: any): CommunicationStyle {
    return CommunicationStyle.create(data);
  }
}
