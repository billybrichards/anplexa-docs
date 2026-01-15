/**
 * IMemoryRepository
 *
 * Repository interface for Memory aggregate.
 */

import { Memory, type MemoryType } from '../entities/Memory.js';

export interface IMemoryRepository {
  save(memory: Memory): Promise<void>;
  findById(id: string): Promise<Memory | null>;
  findByCompanionId(companionId: string, type?: MemoryType): Promise<Memory[]>;
  findRecentByCompanionId(companionId: string, limit: number): Promise<Memory[]>;
  findImportantByCompanionId(companionId: string, minImportance: number): Promise<Memory[]>;
  deleteExpired(): Promise<void>;
  delete(id: string): Promise<void>;
}
