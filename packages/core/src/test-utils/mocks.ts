/**
 * Shared Mock Fixtures for Testing
 *
 * This module provides reusable mock factory functions for creating test data.
 * These factories ensure consistency across test files and reduce boilerplate.
 */

import type { User } from '../repositories/UserRepository';

/**
 * Creates a mock user with default values.
 * All properties can be overridden by passing a partial user object.
 *
 * @param overrides - Partial user object to override default values
 * @returns A complete mock user object
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    chatName: null,
    passwordHash: 'hashed',
    personalityMode: null,
    preferredGender: null,
    customGender: null,
    storagePreference: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    manualSubscriptionOverride: false,
    credits: 5,
    lastCreditRefresh: null,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: null,
    accountSource: 'anplexa',
    funnelType: null,
    persona: null,
    stage: null,
    entrySource: null,
    usedFreeMessages: 0,
    emailOpened1: false,
    emailOpened2: false,
    emailOpened3: false,
    clickedUseApp: false,
    feedbackSubmitted: false,
    refundRequested: false,
    refundProcessed: false,
    lastActivityAt: null,
    amplexaFunnel: null,
    amplexaFunnelName: null,
    amplexaResponses: null,
    amplexaPrimaryNeed: null,
    amplexaCommunicationStyle: null,
    amplexaPace: null,
    amplexaTags: null,
    amplexaTimestamp: null,
    sourceChannel: null,
    ...overrides,
  };
}

/**
 * Creates a mock subscribed user with active subscription.
 *
 * @param overrides - Partial user object to override default values
 * @returns A mock user with active subscription
 */
export function createMockSubscribedUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    subscriptionStatus: 'subscribed',
    stripeSubscriptionId: 'sub_123',
    ...overrides,
  });
}
