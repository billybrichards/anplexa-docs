/**
 * ComfyUI Workflow Builder
 *
 * Loads workflow JSON templates from self-describing JSON files.
 * Each file contains metadata (node IDs) + the workflow itself.
 * Adapted from Letta-Lonely: uses JSON files instead of database storage.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WorkflowFile {
  name: string;
  type: string;
  prompt_node_id: string;
  output_node_id: string;
  seed_node_id: string | null;
  face_image_node_id: string | null;
  workflow: Record<string, Record<string, unknown>>;
}

// In-memory cache
const workflowCache = new Map<string, WorkflowFile>();

function loadWorkflow(name: string): WorkflowFile {
  const cached = workflowCache.get(name);
  if (cached) return cached;

  const jsonPath = resolve(__dirname, 'workflows', `${name}.json`);
  const raw = readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw) as WorkflowFile;

  workflowCache.set(name, data);
  return data;
}

export class WorkflowBuilder {
  /**
   * Build a photo generation workflow (InstaGirlMix + IP Adapter)
   */
  buildPhotoWorkflow(
    prompt: string,
    generationId: string,
    seed?: number,
    faceImageFilename?: string,
  ): Record<string, unknown> {
    const record = loadWorkflow('photo-instagirl-ipadapter');
    const workflow = JSON.parse(JSON.stringify(record.workflow)) as Record<string, Record<string, unknown>>;
    const safeId = generationId.replace(/[^a-zA-Z0-9_-]/g, '');

    // Inject prompt
    const promptNode = workflow[record.prompt_node_id];
    if (promptNode?.inputs) {
      (promptNode.inputs as Record<string, unknown>).text = prompt;
    }

    // Inject face image
    if (faceImageFilename && record.face_image_node_id) {
      const faceNode = workflow[record.face_image_node_id];
      if (faceNode?.inputs) {
        (faceNode.inputs as Record<string, unknown>).image = faceImageFilename;
      }
    }

    // Set output filename
    const outputNode = workflow[record.output_node_id];
    if (outputNode?.inputs) {
      (outputNode.inputs as Record<string, unknown>).filename_prefix = `anplexa_photo/photo_${safeId}`;
    }

    // Set seed
    this.injectSeed(workflow, record, seed);

    return workflow;
  }

  /**
   * Build a video generation workflow (WAN 2.2 + IP Adapter)
   */
  buildVideoWorkflow(
    prompt: string,
    generationId: string,
    seed?: number,
    faceImageFilename?: string,
  ): Record<string, unknown> {
    const record = loadWorkflow('video-wan22-ipadapter');
    const workflow = JSON.parse(JSON.stringify(record.workflow)) as Record<string, Record<string, unknown>>;
    const safeId = generationId.replace(/[^a-zA-Z0-9_-]/g, '');

    // Inject prompt
    const promptNode = workflow[record.prompt_node_id];
    if (promptNode?.inputs) {
      (promptNode.inputs as Record<string, unknown>).text = prompt;
    }

    // Inject face image
    if (faceImageFilename && record.face_image_node_id) {
      const faceNode = workflow[record.face_image_node_id];
      if (faceNode?.inputs) {
        (faceNode.inputs as Record<string, unknown>).image = faceImageFilename;
      }
    }

    // Set output filename
    const outputNode = workflow[record.output_node_id];
    if (outputNode?.inputs) {
      (outputNode.inputs as Record<string, unknown>).filename_prefix = `anplexa_video/video_${safeId}`;
    }

    // Set seed
    this.injectSeed(workflow, record, seed);

    return workflow;
  }

  /**
   * Generate a random 15-digit seed for ComfyUI
   */
  generateSeed(): number {
    const min = 100000000000000;
    const max = 999999999999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  clearCache(): void {
    workflowCache.clear();
  }

  private injectSeed(
    workflow: Record<string, Record<string, unknown>>,
    record: WorkflowFile,
    seed?: number,
  ): void {
    if (seed === undefined) return;

    if (record.seed_node_id && workflow[record.seed_node_id]?.inputs) {
      const inputs = workflow[record.seed_node_id].inputs as Record<string, unknown>;
      if ('seed' in inputs) inputs.seed = seed;
      else if ('noise_seed' in inputs) inputs.noise_seed = seed;
    } else {
      // Fallback: update all seed nodes
      for (const node of Object.values(workflow)) {
        const inputs = node?.inputs as Record<string, unknown> | undefined;
        if (inputs?.noise_seed !== undefined) inputs.noise_seed = seed;
        if (inputs?.seed !== undefined) inputs.seed = seed;
      }
    }
  }
}
