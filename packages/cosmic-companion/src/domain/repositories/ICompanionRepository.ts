/**
 * ICompanionRepository
 *
 * Repository interface for Companion aggregate.
 */

import { Companion } from '../entities/Companion.js';

export interface ICompanionRepository {
  save(companion: Companion): Promise<void>;
  findById(id: string): Promise<Companion | null>;
  findByUserId(userId: string): Promise<Companion[]>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
