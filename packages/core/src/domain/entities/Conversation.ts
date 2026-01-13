/**
 * Conversation Domain Entity
 *
 * Represents a conversation in the Anplexa system.
 * A conversation is a container for messages between a user and the AI.
 */

export class Conversation {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Update the conversation title
   * @param title - New title
   * @returns Updated conversation entity
   */
  updateTitle(title: string | null): Conversation {
    return new Conversation(
      this.id,
      this.userId,
      title,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Create a new conversation instance
   * @param data - Conversation creation data
   * @returns New Conversation instance
   */
  static create(data: {
    id: string;
    userId: string;
    title?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Conversation {
    return new Conversation(
      data.id,
      data.userId,
      data.title ?? null,
      data.createdAt ?? new Date(),
      data.updatedAt ?? new Date()
    );
  }
}
