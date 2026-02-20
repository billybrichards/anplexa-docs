/**
 * User Domain Entity
 * Represents a user in the system with all their properties
 */
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
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  subscriptionStatus: string;
  manualSubscriptionOverride: boolean;
  credits: number;
  lastCreditRefresh: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  accountSource: string | null;
  funnelType: string | null;
  persona: string | null;
  stage: string | null;
  entrySource: string | null;
  usedFreeMessages: number;
  emailOpened1: boolean;
  emailOpened2: boolean;
  emailOpened3: boolean;
  clickedUseApp: boolean;
  feedbackSubmitted: boolean;
  refundRequested: boolean;
  refundProcessed: boolean;
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
 * Data required to create a new user
 */
export interface CreateUserData {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string | null;
  chatName?: string | null;
  personalityMode?: string | null;
  isAdmin?: boolean;
  subscriptionStatus?: string;
  credits?: number;
  accountSource?: string;
  sourceChannel?: string;
}

/**
 * Data for updating an existing user
 */
export interface UpdateUserData {
  passwordHash?: string;
  displayName?: string | null;
  chatName?: string | null;
  personalityMode?: string | null;
  subscriptionStatus?: string;
  credits?: number;
  lastCreditRefresh?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  lastActivityAt?: string;
}
