/**
 * ComfyUI API Wrapper Gateway
 *
 * HTTP client for the ComfyUI API Wrapper service.
 * Ported from Letta-Lonely, adapted for Awilix DI (no singleton).
 */

import type {
  ComfyUIGatewayConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationResult,
  QueueInfo,
} from './types.js';

export class ComfyUIGateway {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ComfyUIGatewayConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: string; queues: QueueInfo }> {
    const response = await this.request('/health');
    if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`);
    return response.json() as Promise<{ status: string; queues: QueueInfo }>;
  }

  // ── Generation ────────────────────────────────────────────────────────────

  async submitGeneration(request: GenerationRequest): Promise<GenerationResponse> {
    const payload = {
      input: {
        request_id: request.requestId || '',
        workflow_json: request.workflowJson,
        s3: {
          access_key_id: request.s3Config.accessKeyId,
          secret_access_key: request.s3Config.secretAccessKey,
          bucket_name: request.s3Config.bucketName,
          region: request.s3Config.region,
          endpoint_url: request.s3Config.endpointUrl || '',
          connect_timeout: 60,
          connect_attempts: 3,
        },
      },
    };

    const response = await this.request('/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ComfyUI submit failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<GenerationResponse>;
  }

  async submitGenerationSync(
    request: GenerationRequest,
    timeoutMs: number = 300000,
  ): Promise<GenerationResult> {
    const payload = {
      input: {
        request_id: request.requestId || '',
        workflow_json: request.workflowJson,
        s3: {
          access_key_id: request.s3Config.accessKeyId,
          secret_access_key: request.s3Config.secretAccessKey,
          bucket_name: request.s3Config.bucketName,
          region: request.s3Config.region,
          endpoint_url: request.s3Config.endpointUrl || '',
          connect_timeout: 60,
          connect_attempts: 3,
        },
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.request('/generate/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ComfyUI sync failed (${response.status}): ${errorText}`);
      }

      return response.json() as Promise<GenerationResult>;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Polling ───────────────────────────────────────────────────────────────

  async getResult(requestId: string): Promise<GenerationResult> {
    const response = await this.request(`/result/${requestId}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Request not found: ${requestId}`);
      const errorText = await response.text();
      throw new Error(`Result check failed (${response.status}): ${errorText}`);
    }
    return response.json() as Promise<GenerationResult>;
  }

  async waitForResult(
    requestId: string,
    pollIntervalMs: number = 2000,
    maxWaitMs: number = 300000,
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getResult(requestId);
      if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error(`Timeout waiting for generation ${requestId} after ${maxWaitMs}ms`);
  }

  async cancelGeneration(requestId: string): Promise<void> {
    const response = await this.request(`/cancel/${requestId}`, { method: 'POST' });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cancel failed (${response.status}): ${errorText}`);
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  async uploadImage(imageBuffer: ArrayBuffer, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', new Blob([new Uint8Array(imageBuffer)]), filename);

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed (${response.status})`);
    }

    const data = (await response.json()) as { filename: string };
    return data.filename;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    return fetch(url, { ...options, headers });
  }
}
