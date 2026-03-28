/**
 * LiveKit Agent Config Repository Interface
 *
 * Data access contract for runtime LiveKit pipeline configuration.
 */

export interface LivekitAgentConfigRecord {
  key: string;
  value: unknown;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ILivekitAgentConfigRepository {
  getAll(): Promise<LivekitAgentConfigRecord[]>;
  getByKey(key: string): Promise<LivekitAgentConfigRecord | null>;
  upsert(key: string, value: unknown, updatedBy?: string): Promise<LivekitAgentConfigRecord>;
}
