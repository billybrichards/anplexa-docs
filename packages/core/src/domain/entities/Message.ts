/**
 * Message Domain Entity
 *
 * Represents a message in a conversation.
 * Messages can be from the user or the assistant.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly role: MessageRole,
    public readonly content: string,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Check if this is a user message
   * @returns true if message is from user
   */
  isUserMessage(): boolean {
    return this.role === 'user';
  }

  /**
   * Check if this is an assistant message
   * @returns true if message is from assistant
   */
  isAssistantMessage(): boolean {
    return this.role === 'assistant';
  }

  /**
   * Get the display name for the message role
   * @returns Human-readable role name
   */
  getRoleDisplayName(): string {
    switch (this.role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Anplexa';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  }

  /**
   * Create a new message instance
   * @param data - Message creation data
   * @returns New Message instance
   */
  static create(data: {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    createdAt?: Date;
  }): Message {
    return new Message(
      data.id,
      data.conversationId,
      data.role,
      data.content,
      data.createdAt ?? new Date()
    );
  }
}
