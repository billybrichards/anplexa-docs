/**
 * User Feedback Domain Entity
 *
 * Represents user feedback in the Anplexa system.
 * Tracks feedback and feature requests submitted by users for product improvement.
 */

export class UserFeedback {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly content: string,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Check if this is a feature request
   */
  isFeatureRequest(): boolean {
    return this.type === 'feature';
  }

  /**
   * Check if this is a general feedback
   */
  isFeedback(): boolean {
    return this.type === 'feedback';
  }

  /**
   * Get type label for display
   */
  getTypeLabel(): string {
    switch (this.type) {
      case 'feature':
        return 'Feature Request';
      case 'feedback':
        return 'Feedback';
      default:
        return this.type;
    }
  }

  /**
   * Create a new UserFeedback instance
   */
  static create(data: {
    id: string;
    userId: string;
    type: string;
    content: string;
    createdAt?: Date;
  }): UserFeedback {
    return new UserFeedback(
      data.id,
      data.userId,
      data.type,
      data.content,
      data.createdAt ?? new Date()
    );
  }
}
