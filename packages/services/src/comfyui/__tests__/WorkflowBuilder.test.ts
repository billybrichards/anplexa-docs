import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowBuilder } from '../WorkflowBuilder.js';

// Node IDs from the production workflow JSON files:
// prompt_node_id: 7, output_node_id: 14, seed_node_id: 10, face_image_node_id: 20

describe('WorkflowBuilder', () => {
  let builder: WorkflowBuilder;

  beforeEach(() => {
    builder = new WorkflowBuilder();
    builder.clearCache();
  });

  describe('buildPhotoWorkflow', () => {
    it('should return a workflow object', () => {
      const workflow = builder.buildPhotoWorkflow('a beautiful photo', 'gen-001');
      expect(workflow).toBeDefined();
      expect(typeof workflow).toBe('object');
    });

    it('should inject prompt into prompt node (7)', () => {
      const workflow = builder.buildPhotoWorkflow('test prompt', 'gen-002');
      expect((workflow as any)['7']?.inputs?.text).toBe('test prompt');
    });

    it('should set output filename prefix in node 14', () => {
      const workflow = builder.buildPhotoWorkflow('test', 'gen-003');
      expect((workflow as any)['14']?.inputs?.filename_prefix).toContain('gen-003');
      expect((workflow as any)['14']?.inputs?.filename_prefix).toContain('anplexa_photo');
    });

    it('should sanitize generation ID in filename', () => {
      const workflow = builder.buildPhotoWorkflow('test', 'gen/../../bad');
      const prefix = (workflow as any)['14']?.inputs?.filename_prefix;
      expect(prefix).not.toContain('..');
      expect(prefix).not.toContain('/../../');
    });

    it('should inject seed into seed node (10)', () => {
      const workflow = builder.buildPhotoWorkflow('test', 'gen-004', 42);
      const seedNode = (workflow as any)['10'];
      expect(seedNode?.inputs?.seed).toBe(42);
    });

    it('should inject face image filename into node 20', () => {
      const workflow = builder.buildPhotoWorkflow('test', 'gen-005', undefined, 'face.png');
      expect((workflow as any)['20']?.inputs?.image).toBe('face.png');
    });

    it('should not mutate cached workflow between builds', () => {
      const w1 = builder.buildPhotoWorkflow('prompt A', 'gen-a');
      const w2 = builder.buildPhotoWorkflow('prompt B', 'gen-b');
      expect((w1 as any)['7']?.inputs?.text).toBe('prompt A');
      expect((w2 as any)['7']?.inputs?.text).toBe('prompt B');
    });
  });

  describe('buildVideoWorkflow', () => {
    it('should return a workflow object', () => {
      const workflow = builder.buildVideoWorkflow('a video of walking', 'vid-001');
      expect(workflow).toBeDefined();
      expect(typeof workflow).toBe('object');
    });

    it('should inject prompt into video prompt node (7)', () => {
      const workflow = builder.buildVideoWorkflow('test video prompt', 'vid-002');
      expect((workflow as any)['7']?.inputs?.text).toBe('test video prompt');
    });

    it('should set video output filename prefix in node 14', () => {
      const workflow = builder.buildVideoWorkflow('test', 'vid-003');
      const prefix = (workflow as any)['14']?.inputs?.filename_prefix;
      expect(prefix).toContain('vid-003');
      expect(prefix).toContain('anplexa_video');
    });
  });

  describe('generateSeed', () => {
    it('should return a 15-digit number', () => {
      const seed = builder.generateSeed();
      expect(seed).toBeGreaterThanOrEqual(100000000000000);
      expect(seed).toBeLessThanOrEqual(999999999999999);
    });

    it('should return different seeds on successive calls', () => {
      const seeds = new Set(Array.from({ length: 10 }, () => builder.generateSeed()));
      expect(seeds.size).toBe(10);
    });
  });
});
