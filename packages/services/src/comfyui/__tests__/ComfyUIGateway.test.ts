import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComfyUIGateway } from '../ComfyUIGateway.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ComfyUIGateway', () => {
  let gateway: ComfyUIGateway;

  beforeEach(() => {
    gateway = new ComfyUIGateway({
      baseUrl: 'http://localhost:42840/',
      apiKey: 'test-key',
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should strip trailing slashes from baseUrl', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'healthy', queues: {} }));
    await gateway.healthCheck();
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:42840/health');
  });

  it('should include Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'healthy', queues: {} }));
    await gateway.healthCheck();
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer test-key');
  });

  describe('isConfigured', () => {
    it('should return true when baseUrl and apiKey are set', () => {
      expect(gateway.isConfigured()).toBe(true);
    });

    it('should return false when missing config', () => {
      const unconfigured = new ComfyUIGateway({ baseUrl: '', apiKey: '' });
      expect(unconfigured.isConfigured()).toBe(false);
    });
  });

  describe('submitGeneration', () => {
    it('should POST to /generate with correct payload structure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 'gen-123', status: 'pending', message: 'Queued',
      }));

      const result = await gateway.submitGeneration({
        workflowJson: { '1': { class_type: 'KSampler' } },
        s3Config: {
          accessKeyId: 'ak', secretAccessKey: 'sk',
          bucketName: 'bucket', region: 'us-east-1',
        },
        requestId: 'req-1',
      });

      expect(result.id).toBe('gen-123');
      expect(result.status).toBe('pending');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.input.workflow_json).toEqual({ '1': { class_type: 'KSampler' } });
      expect(body.input.s3.bucket_name).toBe('bucket');
      expect(body.input.request_id).toBe('req-1');
    });

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Server error', { status: 500 }));

      await expect(gateway.submitGeneration({
        workflowJson: {},
        s3Config: { accessKeyId: 'a', secretAccessKey: 's', bucketName: 'b', region: 'r' },
      })).rejects.toThrow('ComfyUI submit failed (500)');
    });
  });

  describe('getResult', () => {
    it('should GET result by request ID', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 'gen-123', status: 'completed', message: 'Done',
        output: [{ node_id: '9', filename: 'photo.png', url: 'https://s3/photo.png' }],
      }));

      const result = await gateway.getResult('gen-123');
      expect(result.status).toBe('completed');
      expect(result.output).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain('/result/gen-123');
    });

    it('should throw on 404', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
      await expect(gateway.getResult('nonexistent')).rejects.toThrow('Request not found');
    });
  });

  describe('cancelGeneration', () => {
    it('should POST cancel', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'cancelled' }));
      await gateway.cancelGeneration('gen-123');
      expect(mockFetch.mock.calls[0][0]).toContain('/cancel/gen-123');
      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });
  });
});
