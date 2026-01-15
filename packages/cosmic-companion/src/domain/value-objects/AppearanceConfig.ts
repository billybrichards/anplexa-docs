/**
 * AppearanceConfig Value Object
 *
 * Defines the visual appearance of an AI companion.
 * Used for image generation with zodiac-themed aesthetics.
 */

export type Ethnicity =
  | 'asian' | 'black' | 'caucasian' | 'hispanic'
  | 'middle-eastern' | 'mixed' | 'other';

export type BodyType =
  | 'athletic' | 'curvy' | 'petite' | 'average'
  | 'plus-size' | 'muscular';

export type HairLength = 'short' | 'medium' | 'long';

export interface AppearanceData {
  ethnicity: Ethnicity;
  bodyType: BodyType;
  hairColor: string;
  hairLength: HairLength;
  ageAppearance: number; // 18-35
  customPrompts?: string[]; // Additional user-defined characteristics
}

export class AppearanceConfig {
  private constructor(private readonly data: AppearanceData) {
    this.validate();
  }

  private validate(): void {
    if (this.data.ageAppearance < 18 || this.data.ageAppearance > 35) {
      throw new Error('Age appearance must be between 18 and 35');
    }
  }

  get ethnicity(): Ethnicity {
    return this.data.ethnicity;
  }

  get bodyType(): BodyType {
    return this.data.bodyType;
  }

  get hairColor(): string {
    return this.data.hairColor;
  }

  get hairLength(): HairLength {
    return this.data.hairLength;
  }

  get ageAppearance(): number {
    return this.data.ageAppearance;
  }

  get customPrompts(): string[] {
    return this.data.customPrompts || [];
  }

  /**
   * Generate image prompt description
   */
  toImagePrompt(): string {
    const parts = [
      `${this.data.ethnicity} ethnicity`,
      `${this.data.bodyType} body type`,
      `${this.data.hairLength} ${this.data.hairColor} hair`,
      `age ${this.data.ageAppearance}`
    ];

    if (this.data.customPrompts && this.data.customPrompts.length > 0) {
      parts.push(...this.data.customPrompts);
    }

    return parts.join(', ');
  }

  static create(data: AppearanceData): AppearanceConfig {
    return new AppearanceConfig(data);
  }

  toJSON(): AppearanceData {
    return { ...this.data };
  }
}
