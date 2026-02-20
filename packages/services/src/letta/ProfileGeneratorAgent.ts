/**
 * Profile Generator Agent
 *
 * Generates a companion's profile image on creation.
 * Uses NativeMediaService to submit a ComfyUI generation
 * with the companion's appearance description.
 */

import type { NativeMediaService } from '../comfyui/NativeMediaService.js';

export interface ProfileGenerationInput {
  companionId: string;
  companionName: string;
  appearanceDescription: string;
  userId: string;
}

export interface ProfileGenerationResult {
  generationId: string;
  comfyRequestId?: string;
  status: 'generating' | 'failed';
  errorMessage?: string;
}

export class ProfileGeneratorAgent {
  constructor(
    private nativeMediaService: NativeMediaService,
  ) {}

  /**
   * Trigger profile image generation for a companion.
   * Returns immediately with a generation ID for polling.
   */
  async generateProfileImage(input: ProfileGenerationInput): Promise<ProfileGenerationResult> {
    const prompt = this.buildProfilePrompt(input);

    console.log(`[ProfileGeneratorAgent] Generating profile image for ${input.companionName}`);

    const result = await this.nativeMediaService.triggerGeneration({
      type: 'image',
      enhancedPrompt: prompt,
      userId: input.userId,
      companionId: input.companionId,
    });

    return {
      generationId: result.generationId,
      comfyRequestId: result.comfyRequestId,
      status: result.status,
      errorMessage: result.errorMessage,
    };
  }

  /**
   * Build a profile image prompt from companion appearance.
   */
  private buildProfilePrompt(input: ProfileGenerationInput): string {
    const base = input.appearanceDescription || `${input.companionName}, attractive person, beautiful face`;

    return [
      'InstaGirlMix, ultra realistic, photorealistic',
      base,
      'portrait, soft natural lighting, warm tones',
      'high quality, detailed face, sharp focus',
      'solo, Centered composition',
    ].join(', ');
  }
}
