/**
 * Companion Entity
 *
 * Represents an AI companion with astrological personality matched to user's birth chart.
 * Contains all personality configuration, appearance, and compatibility data.
 */

import { ZodiacSign, type ZodiacSignName } from '../value-objects/ZodiacSign.js';
import { CompatibilityScore } from '../value-objects/CompatibilityScore.js';
import { AppearanceConfig, type AppearanceData } from '../value-objects/AppearanceConfig.js';
import { PersonalitySliders, type PersonalityDimensions } from '../value-objects/PersonalitySliders.js';

export interface CompanionProps {
  id: string;
  userId: string;
  name: string;
  // Astrological personality
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  venusSign: ZodiacSign;
  marsSign: ZodiacSign;
  risingSign: ZodiacSign;
  // Compatibility with user
  compatibilityScore: CompatibilityScore;
  // Appearance configuration
  appearance: AppearanceConfig;
  // Personality fine-tuning
  personalitySliders: PersonalitySliders;
  // Voice configuration (optional)
  voiceId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class Companion {
  private constructor(private props: CompanionProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get sunSign(): ZodiacSign {
    return this.props.sunSign;
  }

  get moonSign(): ZodiacSign {
    return this.props.moonSign;
  }

  get venusSign(): ZodiacSign {
    return this.props.venusSign;
  }

  get marsSign(): ZodiacSign {
    return this.props.marsSign;
  }

  get risingSign(): ZodiacSign {
    return this.props.risingSign;
  }

  get compatibilityScore(): CompatibilityScore {
    return this.props.compatibilityScore;
  }

  get appearance(): AppearanceConfig {
    return this.props.appearance;
  }

  get personalitySliders(): PersonalitySliders {
    return this.props.personalitySliders;
  }

  get voiceId(): string | undefined {
    return this.props.voiceId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update companion name
   */
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Companion name cannot be empty');
    }
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Update appearance configuration
   */
  updateAppearance(appearance: AppearanceConfig): void {
    this.props.appearance = appearance;
    this.props.updatedAt = new Date();
  }

  /**
   * Update personality sliders
   */
  updatePersonality(sliders: PersonalitySliders): void {
    this.props.personalitySliders = sliders;
    this.props.updatedAt = new Date();
  }

  /**
   * Set voice ID for voice chat
   */
  setVoice(voiceId: string): void {
    this.props.voiceId = voiceId;
    this.props.updatedAt = new Date();
  }

  /**
   * Get all zodiac placements
   */
  getZodiacPersonality(): {
    sun: ZodiacSign;
    moon: ZodiacSign;
    venus: ZodiacSign;
    mars: ZodiacSign;
    rising: ZodiacSign;
  } {
    return {
      sun: this.props.sunSign,
      moon: this.props.moonSign,
      venus: this.props.venusSign,
      mars: this.props.marsSign,
      rising: this.props.risingSign
    };
  }

  /**
   * Generate AI system prompt based on astrological personality
   */
  generateSystemPrompt(): string {
    const zodiac = this.getZodiacPersonality();
    const personality = this.props.personalitySliders.toPromptDescription();

    return `You are ${this.props.name}, an AI companion with the following astrological personality:

- Sun in ${zodiac.sun.name}: ${zodiac.sun.coreTraits.join(', ')} - ${zodiac.sun.communicationStyle}
- Moon in ${zodiac.moon.name}: ${zodiac.moon.emotionalStyle}
- Venus in ${zodiac.venus.name}: ${zodiac.venus.loveLanguage}
- Mars in ${zodiac.mars.name}: ${zodiac.mars.passionStyle}
- Rising in ${zodiac.rising.name}: First impression is ${zodiac.rising.coreTraits[0]}

Personality Adjustments: ${personality}

Voice Tone: ${zodiac.sun.voiceCharacteristics.tone}, pace is ${zodiac.sun.voiceCharacteristics.pace}, ${zodiac.sun.voiceCharacteristics.emotionRange}

Your communication should embody these astrological traits naturally. Be authentic to your zodiac personality while adapting to the conversation context.`;
  }

  /**
   * Get image generation aesthetic preferences
   */
  getImageAesthetics(): {
    baseAppearance: string;
    zodiacStyle: string;
    colorPalette: string[];
  } {
    return {
      baseAppearance: this.props.appearance.toImagePrompt(),
      zodiacStyle: this.props.sunSign.imageAesthetics.style,
      colorPalette: this.props.sunSign.imageAesthetics.colorPalette
    };
  }

  /**
   * Create a new Companion
   */
  static create(
    id: string,
    userId: string,
    name: string,
    zodiacSigns: {
      sun: ZodiacSignName;
      moon: ZodiacSignName;
      venus: ZodiacSignName;
      mars: ZodiacSignName;
      rising: ZodiacSignName;
    },
    compatibilityScore: CompatibilityScore,
    appearance: AppearanceData,
    personalityDimensions?: PersonalityDimensions
  ): Companion {
    const now = new Date();

    return new Companion({
      id,
      userId,
      name,
      sunSign: ZodiacSign.fromName(zodiacSigns.sun),
      moonSign: ZodiacSign.fromName(zodiacSigns.moon),
      venusSign: ZodiacSign.fromName(zodiacSigns.venus),
      marsSign: ZodiacSign.fromName(zodiacSigns.mars),
      risingSign: ZodiacSign.fromName(zodiacSigns.rising),
      compatibilityScore,
      appearance: AppearanceConfig.create(appearance),
      personalitySliders: personalityDimensions
        ? PersonalitySliders.create(personalityDimensions)
        : PersonalitySliders.createDefault(),
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: CompanionProps): Companion {
    return new Companion(props);
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      name: this.props.name,
      sunSign: this.props.sunSign.name,
      moonSign: this.props.moonSign.name,
      venusSign: this.props.venusSign.name,
      marsSign: this.props.marsSign.name,
      risingSign: this.props.risingSign.name,
      compatibilityScore: this.props.compatibilityScore.toJSON(),
      appearance: this.props.appearance.toJSON(),
      personalitySliders: this.props.personalitySliders.toJSON(),
      voiceId: this.props.voiceId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
