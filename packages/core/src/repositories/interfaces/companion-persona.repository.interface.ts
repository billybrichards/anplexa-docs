/**
 * Companion Persona Repository Interface
 *
 * Defines the contract for persisting and retrieving companion personas.
 */

import { CompanionPersona } from '../../domain/entities/CompanionPersona';
import { PersonalityTraits } from '../../domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle } from '../../domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '../../domain/value-objects/companion/EmotionalApproach';

export interface CreateCompanionPersonaData {
  id: string;
  userId: string;
  birthChartId: string;
  name: string;
  personalityTraits: PersonalityTraits;
  communicationStyle: CommunicationStyle;
  emotionalApproach: EmotionalApproach;
  systemPrompt: string;
  llmModel: string;
  reasoning?: string;
  isActive?: boolean;
}

export interface UpdateCompanionPersonaData {
  name?: string;
  systemPrompt?: string;
  llmModel?: string;
  reasoning?: string;
  isActive?: boolean;
}

export interface ICompanionPersonaRepository {
  /**
   * Get persona by ID
   */
  getById(id: string): Promise<CompanionPersona | null>;

  /**
   * Get active persona for a user
   */
  getActiveByUserId(userId: string): Promise<CompanionPersona | null>;

  /**
   * Get all personas for a user (active and inactive)
   */
  getAllByUserId(userId: string): Promise<CompanionPersona[]>;

  /**
   * Get persona for a specific birth chart
   */
  getByBirthChartId(birthChartId: string): Promise<CompanionPersona | null>;

  /**
   * Create a new persona
   */
  create(data: CreateCompanionPersonaData): Promise<CompanionPersona>;

  /**
   * Update an existing persona
   */
  update(id: string, data: UpdateCompanionPersonaData): Promise<CompanionPersona>;

  /**
   * Delete a persona
   */
  delete(id: string): Promise<void>;

  /**
   * Deactivate all personas for a user (when setting a new active one)
   */
  deactivateAllForUser(userId: string): Promise<void>;

  /**
   * Set a persona as active (deactivates others)
   */
  setActivePersona(userId: string, personaId: string): Promise<void>;
}
