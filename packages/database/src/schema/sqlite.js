"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSubmissions = exports.systemPrompts = exports.messagesRelations = exports.conversationsRelations = exports.usersRelations = exports.apiUsageDaily = exports.apiUsage = exports.apiKeys = exports.userFeedback = exports.userPreferences = exports.exchangeTokens = exports.magicLinkTokens = exports.passwordResetTokens = exports.sessions = exports.conversationContext = exports.messages = exports.conversations = exports.companionConfig = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
// Users table
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    email: (0, sqlite_core_1.text)('email').unique().notNull(),
    passwordHash: (0, sqlite_core_1.text)('password_hash').notNull(),
    displayName: (0, sqlite_core_1.text)('display_name'),
    chatName: (0, sqlite_core_1.text)('chat_name'), // User's preferred name for AI to address them
    personalityMode: (0, sqlite_core_1.text)('personality_mode').default('nurturing'), // 'nurturing' | 'playful' | 'dominant'
    storagePreference: (0, sqlite_core_1.text)('storage_preference').default('cloud'), // 'local' | 'cloud'
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
    isAdmin: (0, sqlite_core_1.integer)('is_admin', { mode: 'boolean' }).default(false),
    subscriptionStatus: (0, sqlite_core_1.text)('subscription_status').default('not_subscribed'), // 'subscribed' | 'not_subscribed'
    manualSubscriptionOverride: (0, sqlite_core_1.integer)('manual_subscription_override', { mode: 'boolean' }).default(false), // When true, Stripe webhooks won't change subscription status
    credits: (0, sqlite_core_1.integer)('credits').default(0),
    stripeCustomerId: (0, sqlite_core_1.text)('stripe_customer_id'),
    stripeSubscriptionId: (0, sqlite_core_1.text)('stripe_subscription_id'),
    accountSource: (0, sqlite_core_1.text)('account_source').default('frontend'), // 'frontend' | 'api'
    lastCreditRefresh: (0, sqlite_core_1.text)('last_credit_refresh'), // YYYY-MM-DD
    // Amplexa Funnel Profile (optional, not mandatory)
    amplexaFunnel: (0, sqlite_core_1.text)('amplexa_funnel'), // A-F (Quietly Lonely, Curious/Fantasy-Open, Privacy-First, Late Night Thinker, Emotional Explorer, Creative Seeker)
    amplexaFunnelName: (0, sqlite_core_1.text)('amplexa_funnel_name'), // Full funnel name
    amplexaResponses: (0, sqlite_core_1.text)('amplexa_responses'), // JSON string of question responses
    amplexaPrimaryNeed: (0, sqlite_core_1.text)('amplexa_primary_need'), // Connection, Exploration, Safety, Processing, Understanding, Imagination
    amplexaCommunicationStyle: (0, sqlite_core_1.text)('amplexa_communication_style'), // Gentle/patient, Open/uninhibited, Structured/clear, etc.
    amplexaPace: (0, sqlite_core_1.text)('amplexa_pace'), // Slow, Flexible, Controlled, Late-night, Thoughtful, Spontaneous
    amplexaTags: (0, sqlite_core_1.text)('amplexa_tags'), // JSON array of personality tags
    amplexaTimestamp: (0, sqlite_core_1.text)('amplexa_timestamp'), // When funnel data was submitted
    // Source channel tracking (unified identifier)
    sourceChannel: (0, sqlite_core_1.text)('source_channel'), // 'funnel' | 'waitlist' | 'access_anplexa' | 'frontend' | 'api' | 'auth_register'
});
// Companion config (single row - admin configured)
exports.companionConfig = (0, sqlite_core_1.sqliteTable)('companion_config', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default('default'),
    name: (0, sqlite_core_1.text)('name').notNull().default('Aura'),
    // Identity settings
    defaultGender: (0, sqlite_core_1.text)('default_gender').default('female'), // male|female|non-binary|custom
    customGenderText: (0, sqlite_core_1.text)('custom_gender_text'),
    // Response settings (defaults, users can override)
    defaultLength: (0, sqlite_core_1.text)('default_length').default('moderate'), // brief|moderate|detailed
    defaultStyle: (0, sqlite_core_1.text)('default_style').default('thoughtful'), // casual|thoughtful|creative
    // Token limits per length setting
    briefTokens: (0, sqlite_core_1.integer)('brief_tokens').default(500),
    moderateTokens: (0, sqlite_core_1.integer)('moderate_tokens').default(1000),
    detailedTokens: (0, sqlite_core_1.integer)('detailed_tokens').default(2000),
    // Length instructions (admin customizable)
    briefInstruction: (0, sqlite_core_1.text)('brief_instruction').default('Keep your responses concise and to the point, typically 1-3 sentences.'),
    moderateInstruction: (0, sqlite_core_1.text)('moderate_instruction').default('Provide balanced responses with enough detail to be helpful, typically 2-4 paragraphs.'),
    detailedInstruction: (0, sqlite_core_1.text)('detailed_instruction').default('Give comprehensive, in-depth responses with thorough explanations and examples.'),
    // Style instructions (admin customizable)
    casualInstruction: (0, sqlite_core_1.text)('casual_instruction').default('Use a warm, friendly, and conversational tone. Be approachable and relaxed.'),
    thoughtfulInstruction: (0, sqlite_core_1.text)('thoughtful_instruction').default('Be reflective, empathetic, and considerate. Take time to deeply understand and respond with care.'),
    creativeInstruction: (0, sqlite_core_1.text)('creative_instruction').default('Be imaginative, expressive, and open to exploring ideas in unique ways. Use vivid language and creative analogies.'),
    // Core system prompt (admin fully customizable)
    systemPromptTemplate: (0, sqlite_core_1.text)('system_prompt_template').notNull().default(`You are {{companion_name}}, a compassionate, judgment-free AI companion designed for meaningful adult conversations. You provide emotional support, intellectual engagement, and creative exploration in a private, safe environment.

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
    generalModel: (0, sqlite_core_1.text)('general_model').default('darkplanet'),
    longFormModel: (0, sqlite_core_1.text)('long_form_model').default('darkplanet'),
    temperature: (0, sqlite_core_1.real)('temperature').default(0.8),
    // Which lengths use long-form model
    useLongFormForDetailed: (0, sqlite_core_1.integer)('use_long_form_for_detailed', { mode: 'boolean' }).default(true),
    // Welcome message (shown on first chat)
    welcomeTitle: (0, sqlite_core_1.text)('welcome_title').default('WELCOME TO TERMINAL COMPANION'),
    welcomeMessage: (0, sqlite_core_1.text)('welcome_message').default('This is your private, judgment-free terminal for meaningful conversation.'),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Conversations
exports.conversations = (0, sqlite_core_1.sqliteTable)('conversations', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    title: (0, sqlite_core_1.text)('title'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Messages
exports.messages = (0, sqlite_core_1.sqliteTable)('messages', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    conversationId: (0, sqlite_core_1.text)('conversation_id').references(() => exports.conversations.id).notNull(),
    role: (0, sqlite_core_1.text)('role').notNull(), // 'user' | 'assistant' | 'system'
    content: (0, sqlite_core_1.text)('content').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Context/Memory summaries (for long conversations)
exports.conversationContext = (0, sqlite_core_1.sqliteTable)('conversation_context', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    conversationId: (0, sqlite_core_1.text)('conversation_id').references(() => exports.conversations.id).notNull(),
    summary: (0, sqlite_core_1.text)('summary').notNull(),
    keyFacts: (0, sqlite_core_1.text)('key_facts'), // JSON array
    updatedAt: (0, sqlite_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// Sessions (for auth)
exports.sessions = (0, sqlite_core_1.sqliteTable)('sessions', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    refreshToken: (0, sqlite_core_1.text)('refresh_token').notNull(),
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Password reset tokens
exports.passwordResetTokens = (0, sqlite_core_1.sqliteTable)('password_reset_tokens', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    tokenHash: (0, sqlite_core_1.text)('token_hash').notNull(),
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(),
    usedAt: (0, sqlite_core_1.text)('used_at'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Magic link tokens (passwordless auth)
exports.magicLinkTokens = (0, sqlite_core_1.sqliteTable)('magic_link_tokens', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    email: (0, sqlite_core_1.text)('email').notNull(),
    tokenHash: (0, sqlite_core_1.text)('token_hash').notNull(),
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(),
    usedAt: (0, sqlite_core_1.text)('used_at'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Exchange tokens (short-lived codes for secure redirect auth)
// Used by Funnel-Forge to pass auth without JWT in URL
exports.exchangeTokens = (0, sqlite_core_1.sqliteTable)('exchange_tokens', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id).notNull(),
    email: (0, sqlite_core_1.text)('email').notNull(),
    codeHash: (0, sqlite_core_1.text)('code_hash').notNull(), // bcrypt hash of the exchange code
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(), // Short expiry (5 minutes)
    usedAt: (0, sqlite_core_1.text)('used_at'), // When the code was exchanged for tokens
    source: (0, sqlite_core_1.text)('source').default('funnel'), // 'funnel' | 'other' - tracks origin
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// User preferences (overrides companion defaults)
exports.userPreferences = (0, sqlite_core_1.sqliteTable)('user_preferences', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id).notNull().unique(),
    // Gender override (null = use companion default)
    gender: (0, sqlite_core_1.text)('gender'), // male|female|non-binary|custom
    customGender: (0, sqlite_core_1.text)('custom_gender'),
    // Response preferences
    preferredLength: (0, sqlite_core_1.text)('preferred_length').default('moderate'),
    preferredStyle: (0, sqlite_core_1.text)('preferred_style').default('thoughtful'),
    // Theme preferences (synced from client)
    themeHue: (0, sqlite_core_1.integer)('theme_hue').default(220),
    useOrangeAccent: (0, sqlite_core_1.integer)('use_orange_accent', { mode: 'boolean' }).default(false),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default('CURRENT_TIMESTAMP'),
});
// User feedback
exports.userFeedback = (0, sqlite_core_1.sqliteTable)('user_feedback', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id),
    type: (0, sqlite_core_1.text)('type').notNull(), // 'feedback' | 'feature'
    content: (0, sqlite_core_1.text)('content').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// API Keys for external access
exports.apiKeys = (0, sqlite_core_1.sqliteTable)('api_keys', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    keyHash: (0, sqlite_core_1.text)('key_hash').notNull(),
    keyPrefix: (0, sqlite_core_1.text)('key_prefix').notNull(), // First 8 chars for identification
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id), // Owner of the API key
    createdBy: (0, sqlite_core_1.text)('created_by').references(() => exports.users.id),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    lastUsedAt: (0, sqlite_core_1.text)('last_used_at'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// API Usage tracking
exports.apiUsage = (0, sqlite_core_1.sqliteTable)('api_usage', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    apiKeyId: (0, sqlite_core_1.text)('api_key_id').references(() => exports.apiKeys.id),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id),
    endpoint: (0, sqlite_core_1.text)('endpoint').notNull(),
    method: (0, sqlite_core_1.text)('method').notNull(),
    tokensUsed: (0, sqlite_core_1.integer)('tokens_used').default(0),
    latencyMs: (0, sqlite_core_1.integer)('latency_ms'),
    statusCode: (0, sqlite_core_1.integer)('status_code'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
// Daily aggregated API usage
exports.apiUsageDaily = (0, sqlite_core_1.sqliteTable)('api_usage_daily', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    apiKeyId: (0, sqlite_core_1.text)('api_key_id').references(() => exports.apiKeys.id),
    userId: (0, sqlite_core_1.text)('user_id').references(() => exports.users.id),
    date: (0, sqlite_core_1.text)('date').notNull(), // YYYY-MM-DD format
    totalRequests: (0, sqlite_core_1.integer)('total_requests').default(0),
    totalTokens: (0, sqlite_core_1.integer)('total_tokens').default(0),
    avgLatencyMs: (0, sqlite_core_1.integer)('avg_latency_ms'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
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
exports.systemPrompts = (0, sqlite_core_1.sqliteTable)('system_prompts', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull().default('default'), // Identifier for the prompt
    content: (0, sqlite_core_1.text)('content').notNull(),
    version: (0, sqlite_core_1.integer)('version').notNull().default(1),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(false), // Only one should be active
    createdBy: (0, sqlite_core_1.text)('created_by').references(() => exports.users.id),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
    notes: (0, sqlite_core_1.text)('notes'), // Optional notes about this version
});
// Contact Submissions - Master audit log for ALL contact entries (append-only, keeps duplicates)
exports.contactSubmissions = (0, sqlite_core_1.sqliteTable)('contact_submissions', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    email: (0, sqlite_core_1.text)('email').notNull(),
    displayName: (0, sqlite_core_1.text)('display_name'),
    chatName: (0, sqlite_core_1.text)('chat_name'),
    sourceChannel: (0, sqlite_core_1.text)('source_channel').notNull(),
    sourceDetail: (0, sqlite_core_1.text)('source_detail'),
    funnelType: (0, sqlite_core_1.text)('funnel_type'),
    persona: (0, sqlite_core_1.text)('persona'),
    entrySource: (0, sqlite_core_1.text)('entry_source'),
    ipAddress: (0, sqlite_core_1.text)('ip_address'),
    userAgent: (0, sqlite_core_1.text)('user_agent'),
    utmSource: (0, sqlite_core_1.text)('utm_source'),
    utmMedium: (0, sqlite_core_1.text)('utm_medium'),
    utmCampaign: (0, sqlite_core_1.text)('utm_campaign'),
    rawPayload: (0, sqlite_core_1.text)('raw_payload'),
    isNewUser: (0, sqlite_core_1.integer)('is_new_user', { mode: 'boolean' }).default(true),
    existingUserId: (0, sqlite_core_1.text)('existing_user_id'),
    createdUserId: (0, sqlite_core_1.text)('created_user_id'),
    createdAt: (0, sqlite_core_1.text)('created_at').default('CURRENT_TIMESTAMP'),
});
