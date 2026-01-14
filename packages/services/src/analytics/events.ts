/**
 * Analytics Event Definitions
 * Unified event types extracted from all Anplexa applications
 * Supports type-safe event tracking across browser and Node.js environments
 */

/**
 * All possible analytics event names
 * Covers events from:
 * - Companion app (authentication, messaging, onboarding, feedback)
 * - Funnel app (conversion funnel, pricing, registration)
 * - Backend (subscription management, webhooks)
 */
export const AnalyticsEvents = {
  // Authentication Events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  MAGIC_LINK_SENT: 'magic_link_sent',
  MAGIC_LINK_VERIFIED: 'magic_link_verified',

  // Subscription & Payment Events
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_INITIATED: 'checkout_initiated',
  CHECKOUT_COMPLETED: 'checkout_completed',
  SUBSCRIPTION_VERIFIED: 'subscription_verified',
  PLAN_SELECTED: 'plan_selected',
  FREE_ACCESS_CLICKED: 'free_access_clicked',

  // Messaging Events
  MESSAGE_SENT: 'message_sent',
  AI_RESPONSE_RECEIVED: 'ai_response_received',
  NEW_CONVERSATION_STARTED: 'new_conversation_started',
  CONVERSATION_LOADED: 'conversation_loaded',

  // Upgrade & Engagement Events
  UPGRADE_MODAL_SHOWN: 'upgrade_modal_shown',
  UPGRADE_CLICKED: 'upgrade_clicked',

  // Onboarding & Personalization Events
  GENDER_SELECTED: 'gender_selected',
  COMPANION_NAME_SET: 'companion_name_set',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FUNNEL_DETECTED: 'funnel_detected',

  // UI Interaction Events
  SETTINGS_OPENED: 'settings_opened',
  FEEDBACK_OPENED: 'feedback_opened',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Funnel Events
  FUNNEL_ENTRY_VIEWED: 'funnel_entry_viewed',
  FUNNEL_PERSONA_SELECTED: 'funnel_persona_selected',
  FUNNEL_QUESTION_VIEWED: 'funnel_question_viewed',
  FUNNEL_QUESTION_ANSWERED: 'funnel_question_answered',
  EMAIL_CAPTURE_VIEWED: 'email_capture_viewed',
  EMAIL_SUBMITTED: 'funnel_email_submitted',
  FUNNEL_PROFILE_SENT: 'funnel_profile_sent',
  PRICING_VIEWED: 'pricing_viewed',
  SUCCESS_PAGE_LOADED: 'success_page_loaded',
  PASSWORD_CREATED: 'password_created',
  REGISTRATION_COMPLETED: 'registration_completed',
  REGISTRATION_FAILED: 'registration_failed',
  REDIRECT_TO_APP: 'redirect_to_app',
  END_SCREEN_VIEWED: 'end_screen_viewed',
  END_SCREEN_CTA_CLICKED: 'end_screen_cta_clicked',

  // Blog Events
  BLOG_POST_VIEWED: 'blog_post_viewed',
  BLOG_LIST_VIEWED: 'blog_list_viewed',

  // Error & System Events
  ERROR_OCCURRED: 'error_occurred',

  // Page View (Standard)
  PAGE_VIEW: '$pageview',
} as const;

/**
 * Event type constant for safe access
 */
export type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * User properties that can be set on user profile
 */
export interface UserProperties {
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
  subscriptionStatus?: string;
  plan?: string;
  companionGender?: string;
  onboardingCompleted?: boolean;
  funnelPersona?: string;
  attemptedSubscription?: boolean;
}

/**
 * Type-safe event properties for each event
 * Each event has its own interface defining what properties it accepts
 */
export type EventProperties = {
  // Auth Events
  [AnalyticsEvents.USER_SIGNED_UP]: {
    email: string;
    method?: 'email' | 'magic_link';
    funnel_persona?: string;
  };
  [AnalyticsEvents.USER_LOGGED_IN]: {
    email: string;
    method?: 'email' | 'magic_link';
  };
  [AnalyticsEvents.USER_LOGGED_OUT]: Record<string, never>;
  [AnalyticsEvents.MAGIC_LINK_SENT]: {
    email: string;
  };
  [AnalyticsEvents.MAGIC_LINK_VERIFIED]: {
    email: string;
  };

  // Payment & Subscription Events
  [AnalyticsEvents.CHECKOUT_STARTED]: {
    plan: string;
    price: number;
    currency?: string;
  };
  [AnalyticsEvents.CHECKOUT_INITIATED]: {
    plan: string;
    persona?: string;
    payment_provider?: string;
  };
  [AnalyticsEvents.CHECKOUT_COMPLETED]: {
    plan: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
  };
  [AnalyticsEvents.SUBSCRIPTION_VERIFIED]: {
    plan: string;
  };
  [AnalyticsEvents.PLAN_SELECTED]: {
    plan: 'monthly' | 'early_believer';
    plan_price?: number;
    plan_billing?: string;
    persona?: string;
    currency?: string;
  };
  [AnalyticsEvents.FREE_ACCESS_CLICKED]: {
    persona?: string;
    conversion_type?: string;
  };

  // Messaging Events
  [AnalyticsEvents.MESSAGE_SENT]: {
    message_length: number;
    is_guest: boolean;
    message_count: number;
  };
  [AnalyticsEvents.AI_RESPONSE_RECEIVED]: {
    response_length: number;
    response_time_ms?: number;
    is_guest?: boolean;
  };
  [AnalyticsEvents.NEW_CONVERSATION_STARTED]: {
    is_guest: boolean;
  };
  [AnalyticsEvents.CONVERSATION_LOADED]: {
    message_count: number;
  };

  // Upgrade & Engagement Events
  [AnalyticsEvents.UPGRADE_MODAL_SHOWN]: {
    message_count: number;
    is_authenticated: boolean;
  };
  [AnalyticsEvents.UPGRADE_CLICKED]: {
    source: string;
    plan?: string;
  };

  // Onboarding & Personalization Events
  [AnalyticsEvents.GENDER_SELECTED]: {
    gender: string;
    is_custom: boolean;
  };
  [AnalyticsEvents.COMPANION_NAME_SET]: {
    has_custom_name: boolean;
  };
  [AnalyticsEvents.ONBOARDING_COMPLETED]: {
    companion_gender: string;
    has_custom_name: boolean;
  };
  [AnalyticsEvents.FUNNEL_DETECTED]: {
    funnel_persona: string;
    funnel_plan?: string;
  };

  // UI Interaction Events
  [AnalyticsEvents.SETTINGS_OPENED]: Record<string, never>;
  [AnalyticsEvents.FEEDBACK_OPENED]: Record<string, never>;
  [AnalyticsEvents.FEEDBACK_SUBMITTED]: {
    rating?: number;
  };

  // Funnel Events
  [AnalyticsEvents.FUNNEL_ENTRY_VIEWED]: {
    page: string;
  };
  [AnalyticsEvents.FUNNEL_PERSONA_SELECTED]: {
    persona: string;
    persona_name: string;
  };
  [AnalyticsEvents.FUNNEL_QUESTION_VIEWED]: {
    persona: string;
    question_id: string;
    question_text: string;
    question_number: number;
    total_questions: number;
  };
  [AnalyticsEvents.FUNNEL_QUESTION_ANSWERED]: {
    persona: string;
    question_id: string;
    question_text: string;
    answer: string;
    answer_index: number;
    question_number: number;
    total_questions: number;
  };
  [AnalyticsEvents.EMAIL_CAPTURE_VIEWED]: {
    persona: string;
  };
  [AnalyticsEvents.EMAIL_SUBMITTED]: {
    persona: string;
    funnel_type: string;
  };
  [AnalyticsEvents.FUNNEL_PROFILE_SENT]: {
    persona: string;
    personality_tags: string[];
    tags_count: number;
  };
  [AnalyticsEvents.PRICING_VIEWED]: {
    persona: string;
    pricing_options?: string[];
  };
  [AnalyticsEvents.SUCCESS_PAGE_LOADED]: {
    plan: string;
    funnel_source?: string;
  };
  [AnalyticsEvents.PASSWORD_CREATED]: {
    plan: string;
  };
  [AnalyticsEvents.REGISTRATION_COMPLETED]: {
    plan: string;
    funnel_source?: string;
    conversion_type?: string;
  };
  [AnalyticsEvents.REGISTRATION_FAILED]: {
    plan: string;
    error_message: string;
  };
  [AnalyticsEvents.REDIRECT_TO_APP]: {
    plan: string;
    funnel_source?: string;
    has_token: boolean;
    destination?: string;
  };
  [AnalyticsEvents.END_SCREEN_VIEWED]: {
    funnel_source: string;
  };
  [AnalyticsEvents.END_SCREEN_CTA_CLICKED]: {
    action: 'paid' | 'free';
    funnel_source: string;
  };

  // Blog Events
  [AnalyticsEvents.BLOG_POST_VIEWED]: {
    slug: string;
    title: string;
    category?: string;
  };
  [AnalyticsEvents.BLOG_LIST_VIEWED]: {
    category?: string;
    posts_displayed?: number;
  };

  // Error Events
  [AnalyticsEvents.ERROR_OCCURRED]: {
    error_type: string;
    error_message?: string;
    context?: string;
  };

  // Page View
  [AnalyticsEvents.PAGE_VIEW]: {
    $current_url: string;
    path?: string;
    title?: string;
  };
};

/**
 * Validate that an event has valid properties
 * This is a runtime check to catch incorrect event usage
 */
export function isValidEventProperties(
  _eventName: EventName,
  properties: unknown
): properties is EventProperties[EventName] {
  if (typeof properties !== 'object' || properties === null) {
    return false;
  }

  // For now, we accept any object - runtime validation could be stricter
  return true;
}
