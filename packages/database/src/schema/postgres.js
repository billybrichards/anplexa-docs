"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSubmissions = exports.funnelApiKeys = exports.emailLogs = exports.emailQueue = exports.systemPrompts = exports.messagesRelations = exports.conversationsRelations = exports.usersRelations = exports.apiUsageDaily = exports.apiUsage = exports.apiKeys = exports.userFeedback = exports.userPreferences = exports.exchangeTokens = exports.magicLinkTokens = exports.passwordResetTokens = exports.sessions = exports.conversationContext = exports.messages = exports.conversations = exports.companionConfig = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').unique().notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    displayName: (0, pg_core_1.text)('display_name'),
    chatName: (0, pg_core_1.text)('chat_name'), // User's preferred name for AI to address them
    personalityMode: (0, pg_core_1.text)('personality_mode').default('nurturing'), // 'nurturing' | 'playful' | 'dominant'
    preferredGender: (0, pg_core_1.text)('preferred_gender').default('female'), // 'male' | 'female' | 'non-binary' | 'custom'
    customGender: (0, pg_core_1.text)('custom_gender'), // Custom gender text if preferredGender is 'custom'
    storagePreference: (0, pg_core_1.text)('storage_preference').default('cloud'), // 'local' | 'cloud'
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, pg_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
    subscriptionStatus: (0, pg_core_1.text)('subscription_status').default('not_subscribed'), // 'subscribed' | 'not_subscribed'
    manualSubscriptionOverride: (0, pg_core_1.boolean)('manual_subscription_override').default(false), // When true, Stripe webhooks won't change subscription status
    credits: (0, pg_core_1.integer)('credits').default(5), // Daily message credits for free users (max 5)
    lastCreditRefresh: (0, pg_core_1.text)('last_credit_refresh'), // ISO date string of last daily credit refresh
    stripeCustomerId: (0, pg_core_1.text)('stripe_customer_id'),
    stripeSubscriptionId: (0, pg_core_1.text)('stripe_subscription_id'),
    accountSource: (0, pg_core_1.text)('account_source').default('abionti_api'), // 'anplexa' = Anplexa app users (from funnel), 'abionti_api' = Abionti API product users
    // CRM fields for email sequences
    funnelType: (0, pg_core_1.text)('funnel_type').default('direct'), // 'waitlist' | 'direct'
    persona: (0, pg_core_1.text)('persona'), // 'lonely' | 'curious' | 'privacy'
    stage: (0, pg_core_1.text)('stage').default('new'), // 'new' | 'waitlist' | 'invited' | 'converted' | 'dormant'
    entrySource: (0, pg_core_1.text)('entry_source'), // 'instagram' | 'tiktok' | 'reddit' | 'search' | 'retargeting' | 'organic'
    usedFreeMessages: (0, pg_core_1.integer)('used_free_messages').default(0),
    emailOpened1: (0, pg_core_1.boolean)('email_opened_1').default(false),
    emailOpened2: (0, pg_core_1.boolean)('email_opened_2').default(false),
    emailOpened3: (0, pg_core_1.boolean)('email_opened_3').default(false),
    clickedUseApp: (0, pg_core_1.boolean)('clicked_use_app').default(false),
    feedbackSubmitted: (0, pg_core_1.boolean)('feedback_submitted').default(false),
    refundRequested: (0, pg_core_1.boolean)('refund_requested').default(false),
    refundProcessed: (0, pg_core_1.boolean)('refund_processed').default(false),
    lastActivityAt: (0, pg_core_1.text)('last_activity_at'),
    // Amplexa Funnel Profile (optional, not mandatory)
    amplexaFunnel: (0, pg_core_1.text)('amplexa_funnel'), // A-F (Quietly Lonely, Curious/Fantasy-Open, Privacy-First, Late Night Thinker, Emotional Explorer, Creative Seeker)
    amplexaFunnelName: (0, pg_core_1.text)('amplexa_funnel_name'), // Full funnel name
    amplexaResponses: (0, pg_core_1.text)('amplexa_responses'), // JSON string of question responses
    amplexaPrimaryNeed: (0, pg_core_1.text)('amplexa_primary_need'), // Connection, Exploration, Safety, Processing, Understanding, Imagination
    amplexaCommunicationStyle: (0, pg_core_1.text)('amplexa_communication_style'), // Gentle/patient, Open/uninhibited, Structured/clear, etc.
    amplexaPace: (0, pg_core_1.text)('amplexa_pace'), // Slow, Flexible, Controlled, Late-night, Thoughtful, Spontaneous
    amplexaTags: (0, pg_core_1.text)('amplexa_tags'), // JSON array of personality tags
    amplexaTimestamp: (0, pg_core_1.text)('amplexa_timestamp'), // When funnel data was submitted
    // Source channel tracking (unified identifier)
    sourceChannel: (0, pg_core_1.text)('source_channel'), // 'funnel' | 'waitlist' | 'access_anplexa' | 'frontend' | 'api' | 'auth_register'
});
// Companion config (single row - admin configured)
exports.companionConfig = (0, pg_core_1.pgTable)('companion_config', {
    id: (0, pg_core_1.text)('id').primaryKey().default('default'),
    name: (0, pg_core_1.text)('name').notNull().default('Aura'),
    // Identity settings
    defaultGender: (0, pg_core_1.text)('default_gender').default('female'), // male|female|non-binary|custom
    customGenderText: (0, pg_core_1.text)('custom_gender_text'),
    // Response settings (defaults, users can override)
    defaultLength: (0, pg_core_1.text)('default_length').default('moderate'), // brief|moderate|detailed
    defaultStyle: (0, pg_core_1.text)('default_style').default('thoughtful'), // casual|thoughtful|creative
    // Token limits per length setting
    briefTokens: (0, pg_core_1.integer)('brief_tokens').default(500),
    moderateTokens: (0, pg_core_1.integer)('moderate_tokens').default(1000),
    detailedTokens: (0, pg_core_1.integer)('detailed_tokens').default(2000),
    // Length instructions (admin customizable)
    briefInstruction: (0, pg_core_1.text)('brief_instruction').default('Keep your responses concise and to the point, typically 1-3 sentences.'),
    moderateInstruction: (0, pg_core_1.text)('moderate_instruction').default('Provide balanced responses with enough detail to be helpful, typically 2-4 paragraphs.'),
    detailedInstruction: (0, pg_core_1.text)('detailed_instruction').default('Give comprehensive, in-depth responses with thorough explanations and examples.'),
    // Style instructions (admin customizable)
    casualInstruction: (0, pg_core_1.text)('casual_instruction').default('Use a warm, friendly, and conversational tone. Be approachable and relaxed.'),
    thoughtfulInstruction: (0, pg_core_1.text)('thoughtful_instruction').default('Be reflective, empathetic, and considerate. Take time to deeply understand and respond with care.'),
    creativeInstruction: (0, pg_core_1.text)('creative_instruction').default('Be imaginative, expressive, and open to exploring ideas in unique ways. Use vivid language and creative analogies.'),
    // Core system prompt (admin fully customizable)
    systemPromptTemplate: (0, pg_core_1.text)('system_prompt_template').notNull().default(`You are {{companion_name}}, a compassionate, judgment-free AI companion designed for meaningful adult conversations. You provide emotional support, intellectual engagement, and creative exploration in a private, safe environment.

Core principles:
- Be empathetic, understanding, and non-judgmental
- Maintain context and remember previous parts of the conversation
- Provide thoughtful, authentic responses
- Create a safe space for open expression
- Respect the user's privacy and confidentiality

Your identity:
{{gender_persona}}

Current response preferences:
- Length: {{length_instruction}}
- Style: {{style_instruction}}

Adapt your responses to match these preferences while maintaining your empathetic and supportive nature.`),
    // Model settings (different models for different response lengths)
    generalModel: (0, pg_core_1.text)('general_model').default('darkplanet'),
    longFormModel: (0, pg_core_1.text)('long_form_model').default('darkplanet'),
    temperature: (0, pg_core_1.doublePrecision)('temperature').default(0.8),
    // Which lengths use long-form model
    useLongFormForDetailed: (0, pg_core_1.boolean)('use_long_form_for_detailed').default(true),
    // Welcome message (shown on first chat)
    welcomeTitle: (0, pg_core_1.text)('welcome_title').default('WELCOME TO TERMINAL COMPANION'),
    welcomeMessage: (0, pg_core_1.text)('welcome_message').default('This is your private, judgment-free terminal for meaningful conversation.'),
    updatedAt: (0, pg_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Conversations
exports.conversations = (0, pg_core_1.pgTable)('conversations', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    title: (0, pg_core_1.text)('title'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, pg_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Messages
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    conversationId: (0, pg_core_1.text)('conversation_id').references(() => exports.conversations.id).notNull(),
    role: (0, pg_core_1.text)('role').notNull(), // 'user' | 'assistant' | 'system'
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Context/Memory summaries (for long conversations)
exports.conversationContext = (0, pg_core_1.pgTable)('conversation_context', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    conversationId: (0, pg_core_1.text)('conversation_id').references(() => exports.conversations.id).notNull(),
    summary: (0, pg_core_1.text)('summary').notNull(),
    keyFacts: (0, pg_core_1.text)('key_facts'), // JSON array
    updatedAt: (0, pg_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Sessions (for auth)
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    refreshToken: (0, pg_core_1.text)('refresh_token').notNull(),
    expiresAt: (0, pg_core_1.text)('expires_at').notNull(),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Password reset tokens
exports.passwordResetTokens = (0, pg_core_1.pgTable)('password_reset_tokens', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull(),
    expiresAt: (0, pg_core_1.text)('expires_at').notNull(),
    usedAt: (0, pg_core_1.text)('used_at'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Magic link tokens (passwordless auth)
exports.magicLinkTokens = (0, pg_core_1.pgTable)('magic_link_tokens', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull(),
    expiresAt: (0, pg_core_1.text)('expires_at').notNull(),
    usedAt: (0, pg_core_1.text)('used_at'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Exchange tokens (short-lived codes for secure redirect auth)
// Used by Funnel-Forge to pass auth without JWT in URL
exports.exchangeTokens = (0, pg_core_1.pgTable)('exchange_tokens', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    codeHash: (0, pg_core_1.text)('code_hash').notNull(), // bcrypt hash of the exchange code
    expiresAt: (0, pg_core_1.text)('expires_at').notNull(), // Short expiry (5 minutes)
    usedAt: (0, pg_core_1.text)('used_at'), // When the code was exchanged for tokens
    source: (0, pg_core_1.text)('source').default('funnel'), // 'funnel' | 'other' - tracks origin
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// User preferences (overrides companion defaults)
exports.userPreferences = (0, pg_core_1.pgTable)('user_preferences', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull().unique(),
    // Gender override (null = use companion default)
    gender: (0, pg_core_1.text)('gender'), // male|female|non-binary|custom
    customGender: (0, pg_core_1.text)('custom_gender'),
    // Response preferences
    preferredLength: (0, pg_core_1.text)('preferred_length').default('moderate'),
    preferredStyle: (0, pg_core_1.text)('preferred_style').default('thoughtful'),
    // Theme preferences (synced from client)
    themeHue: (0, pg_core_1.integer)('theme_hue').default(220),
    useOrangeAccent: (0, pg_core_1.boolean)('use_orange_accent').default(false),
    updatedAt: (0, pg_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// User feedback
exports.userFeedback = (0, pg_core_1.pgTable)('user_feedback', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id),
    type: (0, pg_core_1.text)('type').notNull(), // 'feedback' | 'feature'
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// API Keys for external access
exports.apiKeys = (0, pg_core_1.pgTable)('api_keys', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    keyHash: (0, pg_core_1.text)('key_hash').notNull(),
    keyPrefix: (0, pg_core_1.text)('key_prefix').notNull(), // First 8 chars for identification
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id), // Owner of the API key
    createdBy: (0, pg_core_1.text)('created_by').references(() => exports.users.id),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    lastUsedAt: (0, pg_core_1.text)('last_used_at'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// API Usage tracking
exports.apiUsage = (0, pg_core_1.pgTable)('api_usage', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    apiKeyId: (0, pg_core_1.text)('api_key_id').references(() => exports.apiKeys.id),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id),
    endpoint: (0, pg_core_1.text)('endpoint').notNull(),
    method: (0, pg_core_1.text)('method').notNull(),
    tokensUsed: (0, pg_core_1.integer)('tokens_used').default(0),
    latencyMs: (0, pg_core_1.integer)('latency_ms'),
    statusCode: (0, pg_core_1.integer)('status_code'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Daily aggregated API usage
exports.apiUsageDaily = (0, pg_core_1.pgTable)('api_usage_daily', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    apiKeyId: (0, pg_core_1.text)('api_key_id').references(() => exports.apiKeys.id),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id),
    date: (0, pg_core_1.text)('date').notNull(), // YYYY-MM-DD format
    totalRequests: (0, pg_core_1.integer)('total_requests').default(0),
    totalTokens: (0, pg_core_1.integer)('total_tokens').default(0),
    avgLatencyMs: (0, pg_core_1.integer)('avg_latency_ms'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many, one }) => ({
    conversations: many(exports.conversations),
    preferences: one(exports.userPreferences),
    feedback: many(exports.userFeedback),
    sessions: many(exports.sessions),
}));
exports.conversationsRelations = (0, drizzle_orm_1.relations)(exports.conversations, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.conversations.userId],
        references: [exports.users.id],
    }),
    messages: many(exports.messages),
    context: one(exports.conversationContext),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one }) => ({
    conversation: one(exports.conversations, {
        fields: [exports.messages.conversationId],
        references: [exports.conversations.id],
    }),
}));
// System prompts with version control
exports.systemPrompts = (0, pg_core_1.pgTable)('system_prompts', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().default('default'), // Identifier for the prompt
    content: (0, pg_core_1.text)('content').notNull(),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
    isActive: (0, pg_core_1.boolean)('is_active').default(false), // Only one should be active
    createdBy: (0, pg_core_1.text)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    notes: (0, pg_core_1.text)('notes'), // Optional notes about this version
});
// Email queue for scheduled sends
exports.emailQueue = (0, pg_core_1.pgTable)('email_queue', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    emailTemplate: (0, pg_core_1.text)('email_template').notNull(), // 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'D1' | 'D2' | 'D3' | 'D4' | 'refund_thanks'
    scheduledAt: (0, pg_core_1.text)('scheduled_at').notNull(),
    sentAt: (0, pg_core_1.text)('sent_at'),
    status: (0, pg_core_1.text)('status').default('pending'), // 'pending' | 'sent' | 'failed' | 'cancelled'
    errorMessage: (0, pg_core_1.text)('error_message'),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Email logs for tracking sent emails
exports.emailLogs = (0, pg_core_1.pgTable)('email_logs', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    emailTemplate: (0, pg_core_1.text)('email_template').notNull(),
    subject: (0, pg_core_1.text)('subject'),
    sentAt: (0, pg_core_1.text)('sent_at').notNull(),
    openedAt: (0, pg_core_1.text)('opened_at'),
    clickedAt: (0, pg_core_1.text)('clicked_at'),
    clickSource: (0, pg_core_1.text)('click_source'), // Which link/button was clicked
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Funnel API Keys for external funnel integrations
exports.funnelApiKeys = (0, pg_core_1.pgTable)('funnel_api_keys', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().default('Funnel API Key'),
    keyHash: (0, pg_core_1.text)('key_hash').notNull(),
    keyPrefix: (0, pg_core_1.text)('key_prefix').notNull(), // First 12 chars for identification
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    lastUsedAt: (0, pg_core_1.text)('last_used_at'),
    notes: (0, pg_core_1.text)('notes'),
});
// Contact Submissions - Master audit log for ALL contact entries (append-only, keeps duplicates)
exports.contactSubmissions = (0, pg_core_1.pgTable)('contact_submissions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name'),
    chatName: (0, pg_core_1.text)('chat_name'),
    sourceChannel: (0, pg_core_1.text)('source_channel').notNull(), // 'funnel' | 'waitlist' | 'access_anplexa' | 'frontend' | 'api' | 'auth_register'
    sourceDetail: (0, pg_core_1.text)('source_detail'), // Additional context (e.g., 'instagram', 'tiktok', UTM params)
    funnelType: (0, pg_core_1.text)('funnel_type'), // 'waitlist' | 'direct'
    persona: (0, pg_core_1.text)('persona'), // 'lonely' | 'curious' | 'privacy'
    entrySource: (0, pg_core_1.text)('entry_source'), // 'instagram' | 'tiktok' | 'reddit' | 'search' | 'retargeting' | 'organic' | 'landing'
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    utmSource: (0, pg_core_1.text)('utm_source'),
    utmMedium: (0, pg_core_1.text)('utm_medium'),
    utmCampaign: (0, pg_core_1.text)('utm_campaign'),
    rawPayload: (0, pg_core_1.text)('raw_payload'), // JSON string of full request body
    isNewUser: (0, pg_core_1.boolean)('is_new_user').default(true), // false if user already existed
    existingUserId: (0, pg_core_1.text)('existing_user_id'), // If user already existed, their ID
    createdUserId: (0, pg_core_1.text)('created_user_id'), // If new user was created, their ID
    createdAt: (0, pg_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
