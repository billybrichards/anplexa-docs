/**
 * Memory Entity
 *
 * Represents stored memories from conversations with a companion.
 * Implements a 3-tier memory system: short-term, medium-term, and long-term.
 */

export type MemoryType = 'short-term' | 'medium-term' | 'long-term';
export type MemoryCategory = 'preference' | 'event' | 'emotion' | 'astrological' | 'intimate' | 'general';

export interface MemoryProps {
  id: string;
  companionId: string;
  userId: string;
  type: MemoryType;
  category: MemoryCategory;
  content: string;
  importance: number; // 0-100, determines if promoted to long-term
  expiresAt?: Date; // For short/medium term memories
  createdAt: Date;
  updatedAt: Date;
}

export class Memory {
  private constructor(private props: MemoryProps) {}

  get id(): string {
    return this.props.id;
  }

  get companionId(): string {
    return this.props.companionId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): MemoryType {
    return this.props.type;
  }

  get category(): MemoryCategory {
    return this.props.category;
  }

  get content(): string {
    return this.props.content;
  }

  get importance(): number {
    return this.props.importance;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if memory has expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false; // Long-term memories never expire
    }
    return new Date() > this.props.expiresAt;
  }

  /**
   * Promote memory to long-term if importance is high enough
   */
  promoteToLongTerm(): void {
    if (this.props.importance >= 80 && this.props.type !== 'long-term') {
      this.props.type = 'long-term';
      this.props.expiresAt = undefined; // Long-term never expires
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Increase importance (when memory is referenced again)
   */
  reinforceImportance(boost: number = 10): void {
    this.props.importance = Math.min(100, this.props.importance + boost);
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Memory
   */
  static create(
    id: string,
    companionId: string,
    userId: string,
    type: MemoryType,
    category: MemoryCategory,
    content: string,
    importance: number
  ): Memory {
    const now = new Date();
    let expiresAt: Date | undefined;

    // Set expiration based on memory type
    if (type === 'short-term') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    } else if (type === 'medium-term') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    // long-term has no expiration

    return new Memory({
      id,
      companionId,
      userId,
      type,
      category,
      content,
      importance: Math.max(0, Math.min(100, importance)),
      expiresAt,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: MemoryProps): Memory {
    return new Memory(props);
  }

  toJSON() {
    return {
      id: this.props.id,
      companionId: this.props.companionId,
      userId: this.props.userId,
      type: this.props.type,
      category: this.props.category,
      content: this.props.content,
      importance: this.props.importance,
      expiresAt: this.props.expiresAt?.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
