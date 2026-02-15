/**
 * Workflow Repository Implementation
 *
 * Drizzle ORM implementation for comfyui_workflows table.
 */

import type { Database } from '@anplexa/database';
import { comfyuiWorkflows, eq, and } from '@anplexa/database';
import type {
  IWorkflowRepository,
  WorkflowRecord,
  CreateWorkflowData,
} from './interfaces/workflow.repository.interface.js';

export class WorkflowRepository implements IWorkflowRepository {
  constructor(private readonly db: Database) {}

  async getByName(name: string): Promise<WorkflowRecord | null> {
    const results = await this.db
      .select()
      .from(comfyuiWorkflows)
      .where(and(eq(comfyuiWorkflows.name, name), eq(comfyuiWorkflows.isActive, true)))
      .limit(1);

    return results[0] || null;
  }

  async getActiveByType(type: 'image' | 'video'): Promise<WorkflowRecord[]> {
    return this.db
      .select()
      .from(comfyuiWorkflows)
      .where(and(eq(comfyuiWorkflows.type, type), eq(comfyuiWorkflows.isActive, true)));
  }

  async getAll(): Promise<WorkflowRecord[]> {
    return this.db.select().from(comfyuiWorkflows);
  }

  async create(data: CreateWorkflowData): Promise<WorkflowRecord> {
    const [result] = await this.db
      .insert(comfyuiWorkflows)
      .values({
        id: data.id,
        name: data.name,
        description: data.description || null,
        type: data.type,
        workflowJson: data.workflowJson,
        promptNodeId: data.promptNodeId,
        outputNodeId: data.outputNodeId,
        seedNodeId: data.seedNodeId || null,
        faceImageNodeId: data.faceImageNodeId || null,
        requiredModels: data.requiredModels || null,
        configurableNodes: data.configurableNodes || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async update(id: string, data: Partial<CreateWorkflowData>): Promise<WorkflowRecord> {
    const [result] = await this.db
      .update(comfyuiWorkflows)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(comfyuiWorkflows.id, id))
      .returning();

    return result;
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(comfyuiWorkflows)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(comfyuiWorkflows.id, id));
  }
}
