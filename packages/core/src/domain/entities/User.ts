/**
 * User Domain Entity
 *
 * Represents a user in the Anplexa system.
 * Contains domain behavior specific to users (password validation, etc.)
 */

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly isVerified: boolean,
    public readonly displayName: string | null = null,
    public readonly chatName: string | null = null,
    public readonly personalityMode: string | null = null,
    public readonly isAdmin: boolean = false,
    public readonly credits: number = 0,
    public readonly stripeCustomerId: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Validate a password against the user's password hash
   * Implementation should use bcrypt.compare or similar
   * @param _password - Plain text password to validate (unused in placeholder)
   * @returns true if password is valid, false otherwise
   */
  async validatePassword(_password: string): Promise<boolean> {
    // This is a placeholder - actual implementation in infrastructure
    throw new Error('validatePassword must be implemented in infrastructure layer');
  }

  /**
   * Check if user has sufficient credits
   * @param requiredCredits - Number of credits needed
   * @returns true if user has sufficient credits
   */
  hasSufficientCredits(requiredCredits: number): boolean {
    return this.credits >= requiredCredits;
  }

  /**
   * Create a new user instance
   * @param data - User creation data
   * @returns New User instance
   */
  static create(data: {
    id: string;
    email: string;
    passwordHash: string;
    isVerified?: boolean;
    displayName?: string | null;
    chatName?: string | null;
    personalityMode?: string | null;
    isAdmin?: boolean;
    credits?: number;
    stripeCustomerId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.isVerified ?? false,
      data.displayName ?? null,
      data.chatName ?? null,
      data.personalityMode ?? null,
      data.isAdmin ?? false,
      data.credits ?? 0,
      data.stripeCustomerId ?? null,
      data.createdAt ?? new Date(),
      data.updatedAt ?? new Date()
    );
  }
}
