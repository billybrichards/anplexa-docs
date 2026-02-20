/**
 * Media Generation Repository Interface
 *
 * Persists ComfyUI media generation lifecycle records.
 */

export interface MediaGenerationRecord {
  id: string;
  userId: string;
  conversationId: string | null;
  companionPersonaId: string | null;
  type: string;
  status: string;
  originalRequest: string | null;
  enhancedPrompt: string;
  comfyRequestId: string | null;
  workflowName: string | null;
  seed: string | null;
  storageUrl: string | null;
  storageKey: string | null;
  filename: string | null;
  progress: number | null;
  errorMessage: string | null;
  debugLogs: string | null; // JSON array
  createdAt: string | null;
  completedAt: string | null;
}

export interface CreateMediaGenerationData {
  id: string;
  userId: string;
  conversationId?: string;
  companionPersonaId?: string;
  type: 'image' | 'video';
  enhancedPrompt: string;
  originalRequest?: string;
  seed?: string;
  workflowName?: string;
}

export interface UpdateMediaGenerationData {
  status?: string;
  comfyRequestId?: string;
  workflowName?: string;
  storageUrl?: string;
  storageKey?: string;
  filename?: string;
  progress?: number;
  errorMessage?: string;
  debugLogs?: string;
  completedAt?: string;
}

export interface IMediaGenerationRepository {
  create(data: CreateMediaGenerationData): Promise<MediaGenerationRecord>;
  getById(id: string): Promise<MediaGenerationRecord | null>;
  getByComfyRequestId(comfyRequestId: string): Promise<MediaGenerationRecord | null>;
  update(id: string, data: UpdateMediaGenerationData): Promise<MediaGenerationRecord>;
  findByConversation(conversationId: string): Promise<MediaGenerationRecord[]>;
  findByUser(userId: string, limit?: number): Promise<MediaGenerationRecord[]>;
}
