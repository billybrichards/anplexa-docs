/**
 * UserRepository - Repository interface for user data access
 *
 * This follows the Repository pattern to abstract data access from business logic.
 * Implementations can use Drizzle ORM, Prisma, or any other data access layer.
 */

export interface UserUpdateData {
  email?: string;
  displayName?: string | null;
  chatName?: string | null;
  personalityMode?: string | null;
  subscriptionStatus?: 'subscribed' | 'not_subscribed' | 'canceled' | 'past_due';
  credits?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  lastActivityAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  chatName: string | null;
  personalityMode: string | null;
  preferredGender: string | null;
  customGender: string | null;
  storagePreference: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isAdmin: boolean | null;
  subscriptionStatus: string | null;
  manualSubscriptionOverride: boolean | null;
  credits: number | null;
  lastCreditRefresh: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  accountSource: string | null;
  funnelType: string | null;
  persona: string | null;
  stage: string | null;
  entrySource: string | null;
  usedFreeMessages: number | null;
  emailOpened1: boolean | null;
  emailOpened2: boolean | null;
  emailOpened3: boolean | null;
  clickedUseApp: boolean | null;
  feedbackSubmitted: boolean | null;
  refundRequested: boolean | null;
  refundProcessed: boolean | null;
  lastActivityAt: string | null;
  amplexaFunnel: string | null;
  amplexaFunnelName: string | null;
  amplexaResponses: string | null;
  amplexaPrimaryNeed: string | null;
  amplexaCommunicationStyle: string | null;
  amplexaPace: string | null;
  amplexaTags: string | null;
  amplexaTimestamp: string | null;
  sourceChannel: string | null;
}

/**
 * Repository interface for user data operations
 */
export interface UserRepository {
  /**
   * Find a user by their unique ID
   */
  findById(userId: string): Promise<User | null>;

  /**
   * Find a user by their email address
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by their Stripe customer ID
   */
  findByStripeCustomerId(customerId: string): Promise<User | null>;

  /**
   * Find a user by their Stripe subscription ID
   */
  findByStripeSubscriptionId(subscriptionId: string): Promise<User | null>;

  /**
   * Update a user's data
   */
  update(userId: string, data: UserUpdateData): Promise<User>;

  /**
   * Update a user's subscription status
   */
  updateSubscriptionStatus(
    userId: string,
    status: 'subscribed' | 'not_subscribed' | 'canceled' | 'past_due',
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<User>;

  /**
   * Update a user's Stripe customer ID
   */
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;

  /**
   * Update a user's credits balance
   */
  updateCredits(userId: string, credits: number): Promise<User>;
}
