/**
 * Native Media Generation Service
 *
 * Orchestrates media generation via ComfyUI.
 * Handles: build workflow → submit → poll → return result.
 * Ported from Letta-Lonely, adapted for Anplexa (no DB storage yet).
 */

import type { ComfyUIGateway } from './ComfyUIGateway.js';
import type { WorkflowBuilder } from './WorkflowBuilder.js';
import type { S3Config, GenerationResult } from './types.js';
import type { MediaType } from '../letta/media.types.js';

export interface NativeMediaConfig {
  s3Config: S3Config;
}

export interface TriggerInput {
  type: MediaType;
  enhancedPrompt: string;
  userId: string;
  conversationId?: string;
  companionId?: string;
  faceImageFilename?: string;
}

export interface TriggerOutput {
  generationId: string;
  status: 'generating' | 'failed';
  comfyRequestId?: string;
  errorMessage?: string;
}

export class NativeMediaService {
  constructor(
    private comfyUIGateway: ComfyUIGateway,
    private workflowBuilder: WorkflowBuilder,
    private config: NativeMediaConfig,
  ) {}

  /**
   * Trigger media generation — builds workflow, submits to ComfyUI, returns request ID.
   */
  async triggerGeneration(input: TriggerInput): Promise<TriggerOutput> {
    if (!this.comfyUIGateway.isConfigured()) {
      return {
        generationId: '',
        status: 'failed',
        errorMessage: 'ComfyUI not configured',
      };
    }

    const seed = this.workflowBuilder.generateSeed();
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Build workflow with prompt injection
      const workflow = input.type === 'image'
        ? this.workflowBuilder.buildPhotoWorkflow(input.enhancedPrompt, generationId, seed, input.faceImageFilename)
        : this.workflowBuilder.buildVideoWorkflow(input.enhancedPrompt, generationId, seed, input.faceImageFilename);

      // Submit to ComfyUI
      const response = await this.comfyUIGateway.submitGeneration({
        workflowJson: workflow,
        s3Config: this.config.s3Config,
        requestId: generationId,
      });

      console.log(`[NativeMediaService] ${input.type} submitted: ${response.id}`);

      return {
        generationId,
        status: 'generating',
        comfyRequestId: response.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NativeMediaService] Generation failed: ${errorMessage}`);

      return {
        generationId,
        status: 'failed',
        errorMessage,
      };
    }
  }

  /**
   * Poll for generation result from ComfyUI.
   */
  async getStatus(comfyRequestId: string): Promise<GenerationResult> {
    return this.comfyUIGateway.getResult(comfyRequestId);
  }

  /**
   * Wait for generation to complete (with polling).
   */
  async waitForCompletion(
    comfyRequestId: string,
    pollIntervalMs: number = 2000,
    maxWaitMs: number = 300000,
  ): Promise<GenerationResult> {
    return this.comfyUIGateway.waitForResult(comfyRequestId, pollIntervalMs, maxWaitMs);
  }
}
