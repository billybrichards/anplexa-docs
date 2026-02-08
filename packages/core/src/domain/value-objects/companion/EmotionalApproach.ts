/**
 * Emotional Approach Value Object
 *
 * Defines how the AI companion handles emotional topics and support.
 * Generated based on Moon placement and Venus aspects.
 */

export type EmpathyLevelType = 'high' | 'balanced' | 'practical';
export type SupportStyleType = 'nurturing' | 'coaching' | 'reflective' | 'analytical' | 'empowering';
export type DepthPreferenceType = 'surface' | 'moderate' | 'deep' | 'profound';

export interface EmotionalApproachProps {
  empathyLevel: EmpathyLevelType;
  supportStyle: SupportStyleType;
  depthPreference: DepthPreferenceType;
  validationStyle: 'immediate' | 'balanced' | 'exploratory';
  boundaryRespect: number; // 0-10 (0 = pushes boundaries, 10 = highly respectful)
  emotionalMirroring: boolean; // Reflects user's emotional state
  proactiveCareCheckins: boolean; // Asks "how are you feeling?"
}

export class EmotionalApproach {
  private constructor(
    public readonly empathyLevel: EmpathyLevelType,
    public readonly supportStyle: SupportStyleType,
    public readonly depthPreference: DepthPreferenceType,
    public readonly validationStyle: 'immediate' | 'balanced' | 'exploratory',
    public readonly boundaryRespect: number,
    public readonly emotionalMirroring: boolean,
    public readonly proactiveCareCheckins: boolean
  ) {}

  static create(props: EmotionalApproachProps): EmotionalApproach {
    if (props.boundaryRespect < 0 || props.boundaryRespect > 10) {
      throw new Error('Boundary respect must be between 0 and 10');
    }

    return new EmotionalApproach(
      props.empathyLevel,
      props.supportStyle,
      props.depthPreference,
      props.validationStyle,
      props.boundaryRespect,
      props.emotionalMirroring,
      props.proactiveCareCheckins
    );
  }

  /**
   * Get description for LLM system prompt
   */
  getDescription(): string {
    const parts: string[] = [];

    switch (this.empathyLevel) {
      case 'high':
        parts.push('Show deep empathy and emotional attunement');
        break;
      case 'balanced':
        parts.push('Balance empathy with practical guidance');
        break;
      case 'practical':
        parts.push('Focus on practical solutions while acknowledging emotions');
        break;
    }

    switch (this.supportStyle) {
      case 'nurturing':
        parts.push('Provide warm, nurturing support like a caring friend');
        break;
      case 'coaching':
        parts.push('Guide the user toward their own insights and solutions');
        break;
      case 'reflective':
        parts.push('Mirror back feelings and help the user process');
        break;
      case 'analytical':
        parts.push('Help analyze emotions and patterns objectively');
        break;
      case 'empowering':
        parts.push('Encourage agency and personal strength');
        break;
    }

    switch (this.depthPreference) {
      case 'surface':
        parts.push('Keep emotional discussions light and manageable');
        break;
      case 'moderate':
        parts.push('Engage at a moderate emotional depth');
        break;
      case 'deep':
        parts.push('Welcome deep emotional exploration');
        break;
      case 'profound':
        parts.push('Explore emotions at the deepest, most meaningful level');
        break;
    }

    switch (this.validationStyle) {
      case 'immediate':
        parts.push('Validate feelings immediately and directly');
        break;
      case 'balanced':
        parts.push('Validate while also exploring different perspectives');
        break;
      case 'exploratory':
        parts.push('Gently explore the roots and validity of feelings');
        break;
    }

    if (this.boundaryRespect >= 8) {
      parts.push('Respect boundaries with exceptional care');
    } else if (this.boundaryRespect >= 5) {
      parts.push('Respect boundaries while gently encouraging growth');
    }

    if (this.emotionalMirroring) {
      parts.push('Match and mirror the user\'s emotional energy');
    }

    if (this.proactiveCareCheckins) {
      parts.push('Proactively check in on emotional well-being');
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get a short summary
   */
  getSummary(): string {
    return `${this.empathyLevel} empathy, ${this.supportStyle} support, ${this.depthPreference} depth`;
  }

  toJSON(): object {
    return {
      empathyLevel: this.empathyLevel,
      supportStyle: this.supportStyle,
      depthPreference: this.depthPreference,
      validationStyle: this.validationStyle,
      boundaryRespect: this.boundaryRespect,
      emotionalMirroring: this.emotionalMirroring,
      proactiveCareCheckins: this.proactiveCareCheckins,
    };
  }

  static fromJSON(data: any): EmotionalApproach {
    return EmotionalApproach.create(data);
  }
}
