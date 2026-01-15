/**
 * IImageGenerationService Port
 *
 * Interface for generating NSFW companion images with zodiac aesthetics.
 */

export interface ImageGenerationParams {
  basePrompt: string; // Appearance description
  zodiacStyle: string; // Aesthetic style from zodiac sign
  colorPalette: string[]; // Zodiac colors
  negativePrompt?: string;
  seed?: number;
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  seed?: number;
}

export interface IImageGenerationService {
  /**
   * Generate image with zodiac aesthetics
   */
  generate(params: ImageGenerationParams): Promise<GeneratedImage>;
}
