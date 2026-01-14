/**
 * FunnelApiKey Domain Entity
 *
 * Represents an API key for funnel integration access.
 * Used for external funnel systems to integrate with Anplexa.
 */

export class FunnelApiKey {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly keyHash: string,
    public readonly keyPreview: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly lastUsedAt: Date | null = null,
    public readonly notes: string | null = null
  ) {}

  /**
   * Check if the funnel API key is currently active
   * @returns true if the key is active
   */
  isActiveKey(): boolean {
    return this.isActive;
  }

  /**
   * Create a new funnel API key instance
   * @param data - Funnel API key creation data
   * @returns New FunnelApiKey instance
   */
  static create(data: {
    id: string;
    name: string;
    keyHash: string;
    keyPreview: string;
    isActive?: boolean;
    createdAt?: Date;
    lastUsedAt?: Date | null;
    notes?: string | null;
  }): FunnelApiKey {
    return new FunnelApiKey(
      data.id,
      data.name,
      data.keyHash,
      data.keyPreview,
      data.isActive ?? true,
      data.createdAt ?? new Date(),
      data.lastUsedAt ?? null,
      data.notes ?? null
    );
  }
}
