/**
 * Companion Voice Repository Interface
 *
 * Data access contract for companion voice configurations.
 */

export interface CompanionVoiceRecord {
  id: string;
  companionPersonaId: string | null;
  voiceId: string;
  voiceName: string;
  gender: string;
  simliFaceId: string | null;
  ttsModel: string | null;
  enabled: boolean | null;
  createdAt: string | null;
}

export interface CreateCompanionVoiceData {
  id: string;
  companionPersonaId?: string | null;
  voiceId: string;
  voiceName: string;
  gender: string;
  simliFaceId?: string | null;
  ttsModel?: string;
  enabled?: boolean;
}

export interface ICompanionVoiceRepository {
  getById(id: string): Promise<CompanionVoiceRecord | null>;
  findByPersonaId(companionPersonaId: string): Promise<CompanionVoiceRecord[]>;
  findEnabled(): Promise<CompanionVoiceRecord[]>;
  create(data: CreateCompanionVoiceData): Promise<CompanionVoiceRecord>;
  update(id: string, data: Partial<CompanionVoiceRecord>): Promise<CompanionVoiceRecord>;
  delete(id: string): Promise<void>;
}
