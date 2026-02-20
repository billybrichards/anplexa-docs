/**
 * ApiKey Domain Entity
 *
 * Represents an API key for external access to the Anplexa API.
 * Used for admin features and external integrations.
 */

export class ApiKey {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly keyHash: string,
    public readonly keyPreview: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly lastUsedAt: Date | null = null
  ) {}

  /**
   * Check if the API key is currently active
   * @returns true if the key is active
   */
  isActiveKey(): boolean {
    return this.isActive;
  }

  /**
   * Create a new API key instance
   * @param data - API key creation data
   * @returns New ApiKey instance
   */
  static create(data: {
    id: string;
    userId: string;
    name: string;
    keyHash: string;
    keyPreview: string;
    isActive?: boolean;
    createdAt?: Date;
    lastUsedAt?: Date | null;
  }): ApiKey {
    return new ApiKey(
      data.id,
      data.userId,
      data.name,
      data.keyHash,
      data.keyPreview,
      data.isActive ?? true,
      data.createdAt ?? new Date(),
      data.lastUsedAt ?? null
    );
  }
}
