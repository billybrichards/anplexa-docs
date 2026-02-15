/**
 * ComfyUI Types
 */

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  endpointUrl?: string;
}

export interface GenerationRequest {
  workflowJson: Record<string, unknown>;
  s3Config: S3Config;
  requestId?: string;
}

export interface GenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface GenerationOutput {
  node_id: string;
  filename: string;
  url: string;
  local_path?: string;
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  message: string;
  output?: GenerationOutput[];
  comfyui_response?: unknown;
  timings?: {
    preprocess_time?: number;
    generation_time?: number;
    postprocess_time?: number;
    total_time?: number;
  };
}

export interface QueueInfo {
  preprocess_queue_size: number;
  generation_queue_size: number;
  postprocess_queue_size: number;
}

export interface ComfyUIGatewayConfig {
  baseUrl: string;
  apiKey: string;
}

/** Workflow definition — loaded from JSON files instead of DB */
export interface WorkflowDefinition {
  name: string;
  type: 'photo' | 'video';
  workflow_json: Record<string, unknown>;
  prompt_node_id: string;
  output_node_id: string;
  seed_node_id: string | null;
  face_image_node_id: string | null;
}
