/**
 * Workflow Repository Interface
 *
 * Persists ComfyUI workflow definitions (replaces JSON file loading).
 */

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  type: string;
  workflowJson: string; // JSON blob
  promptNodeId: string;
  outputNodeId: string;
  seedNodeId: string | null;
  faceImageNodeId: string | null;
  requiredModels: string | null; // JSON
  configurableNodes: string | null; // JSON
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateWorkflowData {
  id: string;
  name: string;
  description?: string;
  type: 'image' | 'video';
  workflowJson: string;
  promptNodeId: string;
  outputNodeId: string;
  seedNodeId?: string;
  faceImageNodeId?: string;
  requiredModels?: string;
  configurableNodes?: string;
}

export interface IWorkflowRepository {
  getByName(name: string): Promise<WorkflowRecord | null>;
  getActiveByType(type: 'image' | 'video'): Promise<WorkflowRecord[]>;
  getAll(): Promise<WorkflowRecord[]>;
  create(data: CreateWorkflowData): Promise<WorkflowRecord>;
  update(id: string, data: Partial<CreateWorkflowData>): Promise<WorkflowRecord>;
  deactivate(id: string): Promise<void>;
}
