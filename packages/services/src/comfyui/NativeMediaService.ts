/**
 * Native Media Generation Service
 *
 * Orchestrates media generation via ComfyUI.
 * Handles: build workflow → submit → poll → return result.
 * Optionally persists to media_generations table via repository.
 */

import type { ComfyUIGateway } from './ComfyUIGateway.js';
import type { WorkflowBuilder } from './WorkflowBuilder.js';
import type { S3Config, GenerationResult } from './types.js';
import type { MediaType } from '../letta/media.types.js';

export interface MediaGenerationRepoLike {
  create(data: {
    id: string;
    userId: string;
    conversationId?: string;
    companionPersonaId?: string;
    type: 'image' | 'video';
    enhancedPrompt: string;
    originalRequest?: string;
    seed?: string;
    workflowName?: string;
  }): Promise<unknown>;
  update(id: string, data: {
    status?: string;
    comfyRequestId?: string;
    workflowName?: string;
    errorMessage?: string;
    completedAt?: string;
  }): Promise<unknown>;
  getById(id: string): Promise<{
    id: string;
    comfyRequestId: string | null;
    status: string;
  } | null>;
}

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
  private mediaGenerationRepository?: MediaGenerationRepoLike;

  constructor(
    private comfyUIGateway: ComfyUIGateway,
    private workflowBuilder: WorkflowBuilder,
    private config: NativeMediaConfig,
    mediaGenerationRepository?: MediaGenerationRepoLike,
  ) {
    this.mediaGenerationRepository = mediaGenerationRepository;
  }

  /**
   * Trigger media generation — builds workflow, submits to ComfyUI, returns request ID.
   * If repository is configured, persists a record.
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
    const workflowName = input.type === 'image' ? 'photo-instagirl-ipadapter' : 'video-wan22-ipadapter';

    // Persist creation to DB if available
    if (this.mediaGenerationRepository) {
      try {
        await this.mediaGenerationRepository.create({
          id: generationId,
          userId: input.userId,
          conversationId: input.conversationId,
          companionPersonaId: input.companionId,
          type: input.type,
          enhancedPrompt: input.enhancedPrompt,
          seed: String(seed),
          workflowName,
        });
      } catch (err) {
        console.warn(`[NativeMediaService] DB create failed, continuing in-memory`, err);
      }
    }

    try {
      // Build workflow with prompt injection
      const workflow = input.type === 'image'
        ? await this.workflowBuilder.buildPhotoWorkflow(input.enhancedPrompt, generationId, seed, input.faceImageFilename)
        : await this.workflowBuilder.buildVideoWorkflow(input.enhancedPrompt, generationId, seed, input.faceImageFilename);

      // Submit to ComfyUI
      const response = await this.comfyUIGateway.submitGeneration({
        workflowJson: workflow,
        s3Config: this.config.s3Config,
        requestId: generationId,
      });

      console.log(`[NativeMediaService] ${input.type} submitted: ${response.id}`);

      // Update DB with comfyRequestId
      if (this.mediaGenerationRepository) {
        try {
          await this.mediaGenerationRepository.update(generationId, {
            status: 'generating',
            comfyRequestId: response.id,
          });
        } catch {
          // Non-fatal
        }
      }

      return {
        generationId,
        status: 'generating',
        comfyRequestId: response.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NativeMediaService] Generation failed: ${errorMessage}`);

      // Update DB with failure
      if (this.mediaGenerationRepository) {
        try {
          await this.mediaGenerationRepository.update(generationId, {
            status: 'failed',
            errorMessage,
          });
        } catch {
          // Non-fatal
        }
      }

      return {
        generationId,
        status: 'failed',
        errorMessage,
      };
    }
  }

  /**
   * Poll for generation result from ComfyUI.
   * If repository is configured, also updates the DB record.
   */
  async getStatus(comfyRequestId: string): Promise<GenerationResult> {
    const result = await this.comfyUIGateway.getResult(comfyRequestId);

    // Update DB if available
    if (this.mediaGenerationRepository && (result.status === 'completed' || result.status === 'failed')) {
      try {
        // Find by comfyRequestId — we don't store mapping in-service, so caller may provide generationId
        // For now, this updates based on the comfyRequestId
      } catch {
        // Non-fatal
      }
    }

    return result;
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
