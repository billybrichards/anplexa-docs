"use strict";
/**
 * Analytics Event Definitions
 * Unified event types extracted from all Anplexa applications
 * Supports type-safe event tracking across browser and Node.js environments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsEvents = void 0;
exports.isValidEventProperties = isValidEventProperties;
/**
 * All possible analytics event names
 * Covers events from:
 * - Companion app (authentication, messaging, onboarding, feedback)
 * - Funnel app (conversion funnel, pricing, registration)
 * - Backend (subscription management, webhooks)
 */
exports.AnalyticsEvents = {
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
};
/**
 * Validate that an event has valid properties
 * This is a runtime check to catch incorrect event usage
 */
function isValidEventProperties(_eventName, properties) {
    if (typeof properties !== 'object' || properties === null) {
        return false;
    }
    // For now, we accept any object - runtime validation could be stricter
    return true;
}
