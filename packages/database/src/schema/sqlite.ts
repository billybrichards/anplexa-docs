import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  chatName: text('chat_name'), // User's preferred name for AI to address them
  personalityMode: text('personality_mode').default('nurturing'), // 'nurturing' | 'playful' | 'dominant'
  storagePreference: text('storage_preference').default('cloud'), // 'local' | 'cloud'
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  subscriptionStatus: text('subscription_status').default('not_subscribed'), // 'subscribed' | 'not_subscribed'
  manualSubscriptionOverride: integer('manual_subscription_override', { mode: 'boolean' }).default(false), // When true, Stripe webhooks won't change subscription status
  credits: integer('credits').default(0),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  accountSource: text('account_source').default('frontend'), // 'frontend' | 'api'
  lastCreditRefresh: text('last_credit_refresh'), // YYYY-MM-DD

  // Amplexa Funnel Profile (optional, not mandatory)
  amplexaFunnel: text('amplexa_funnel'), // A-F (Quietly Lonely, Curious/Fantasy-Open, Privacy-First, Late Night Thinker, Emotional Explorer, Creative Seeker)
  amplexaFunnelName: text('amplexa_funnel_name'), // Full funnel name
  amplexaResponses: text('amplexa_responses'), // JSON string of question responses
  amplexaPrimaryNeed: text('amplexa_primary_need'), // Connection, Exploration, Safety, Processing, Understanding, Imagination
  amplexaCommunicationStyle: text('amplexa_communication_style'), // Gentle/patient, Open/uninhibited, Structured/clear, etc.
  amplexaPace: text('amplexa_pace'), // Slow, Flexible, Controlled, Late-night, Thoughtful, Spontaneous
  amplexaTags: text('amplexa_tags'), // JSON array of personality tags
  amplexaTimestamp: text('amplexa_timestamp'), // When funnel data was submitted

  // Source channel tracking (unified identifier)
  sourceChannel: text('source_channel'), // 'funnel' | 'waitlist' | 'access_anplexa' | 'frontend' | 'api' | 'auth_register'
});

// Companion config (single row - admin configured)
export const companionConfig = sqliteTable('companion_config', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull().default('Aura'),

  // Identity settings
  defaultGender: text('default_gender').default('female'), // male|female|non-binary|custom
  customGenderText: text('custom_gender_text'),

  // Response settings (defaults, users can override)
  defaultLength: text('default_length').default('moderate'), // brief|moderate|detailed
  defaultStyle: text('default_style').default('thoughtful'), // casual|thoughtful|creative

  // Token limits per length setting
  briefTokens: integer('brief_tokens').default(500),
  moderateTokens: integer('moderate_tokens').default(1000),
  detailedTokens: integer('detailed_tokens').default(2000),

  // Length instructions (admin customizable)
  briefInstruction: text('brief_instruction').default('Keep your responses concise and to the point, typically 1-3 sentences.'),
  moderateInstruction: text('moderate_instruction').default('Provide balanced responses with enough detail to be helpful, typically 2-4 paragraphs.'),
  detailedInstruction: text('detailed_instruction').default('Give comprehensive, in-depth responses with thorough explanations and examples.'),

  // Style instructions (admin customizable)
  casualInstruction: text('casual_instruction').default('Use a warm, friendly, and conversational tone. Be approachable and relaxed.'),
  thoughtfulInstruction: text('thoughtful_instruction').default('Be reflective, empathetic, and considerate. Take time to deeply understand and respond with care.'),
  creativeInstruction: text('creative_instruction').default('Be imaginative, expressive, and open to exploring ideas in unique ways. Use vivid language and creative analogies.'),

  // Core system prompt (admin fully customizable)
  systemPromptTemplate: text('system_prompt_template').notNull().default(`You are {{companion_name}}, a compassionate, judgment-free AI companion designed for meaningful adult conversations. You provide emotional support, intellectual engagement, and creative exploration in a private, safe environment.

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
  generalModel: text('general_model').default('darkplanet'),
  longFormModel: text('long_form_model').default('darkplanet'),
  temperature: real('temperature').default(0.8),

  // Which lengths use long-form model
  useLongFormForDetailed: integer('use_long_form_for_detailed', { mode: 'boolean' }).default(true),

  // Welcome message (shown on first chat)
  welcomeTitle: text('welcome_title').default('WELCOME TO TERMINAL COMPANION'),
  welcomeMessage: text('welcome_message').default('This is your private, judgment-free terminal for meaningful conversation.'),

  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Conversations
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Messages
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Context/Memory summaries (for long conversations)
export const conversationContext = sqliteTable('conversation_context', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  summary: text('summary').notNull(),
  keyFacts: text('key_facts'), // JSON array
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Sessions (for auth)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Password reset tokens
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Magic link tokens (passwordless auth)
export const magicLinkTokens = sqliteTable('magic_link_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Exchange tokens (short-lived codes for secure redirect auth)
// Used by Funnel-Forge to pass auth without JWT in URL
export const exchangeTokens = sqliteTable('exchange_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(), // bcrypt hash of the exchange code
  expiresAt: text('expires_at').notNull(), // Short expiry (5 minutes)
  usedAt: text('used_at'), // When the code was exchanged for tokens
  source: text('source').default('funnel'), // 'funnel' | 'other' - tracks origin
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// User preferences (overrides companion defaults)
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull().unique(),

  // Gender override (null = use companion default)
  gender: text('gender'), // male|female|non-binary|custom
  customGender: text('custom_gender'),

  // Response preferences
  preferredLength: text('preferred_length').default('moderate'),
  preferredStyle: text('preferred_style').default('thoughtful'),

  // Theme preferences (synced from client)
  themeHue: integer('theme_hue').default(220),
  useOrangeAccent: integer('use_orange_accent', { mode: 'boolean' }).default(false),

  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// User feedback
export const userFeedback = sqliteTable('user_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(), // 'feedback' | 'feature'
  content: text('content').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// API Keys for external access
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  userId: text('user_id').references(() => users.id), // Owner of the API key
  createdBy: text('created_by').references(() => users.id),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// API Usage tracking
export const apiUsage = sqliteTable('api_usage', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),
  userId: text('user_id').references(() => users.id),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  tokensUsed: integer('tokens_used').default(0),
  latencyMs: integer('latency_ms'),
  statusCode: integer('status_code'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Daily aggregated API usage
export const apiUsageDaily = sqliteTable('api_usage_daily', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),
  userId: text('user_id').references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  totalRequests: integer('total_requests').default(0),
  totalTokens: integer('total_tokens').default(0),
  avgLatencyMs: integer('avg_latency_ms'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Funnel API Keys for external funnel integrations
export const funnelApiKeys = sqliteTable('funnel_api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Funnel API Key'),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 12 chars for identification
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  lastUsedAt: text('last_used_at'),
  notes: text('notes'),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  conversations: many(conversations),
  preferences: one(userPreferences),
  feedback: many(userFeedback),
  sessions: many(sessions),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  context: one(conversationContext),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// System prompts with version control
export const systemPrompts = sqliteTable('system_prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('default'), // Identifier for the prompt
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).default(false), // Only one should be active
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  notes: text('notes'), // Optional notes about this version
});

// Contact Submissions - Master audit log for ALL contact entries (append-only, keeps duplicates)
export const contactSubmissions = sqliteTable('contact_submissions', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  chatName: text('chat_name'),
  sourceChannel: text('source_channel').notNull(),
  sourceDetail: text('source_detail'),
  funnelType: text('funnel_type'),
  persona: text('persona'),
  entrySource: text('entry_source'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  rawPayload: text('raw_payload'),
  isNewUser: integer('is_new_user', { mode: 'boolean' }).default(true),
  existingUserId: text('existing_user_id'),
  createdUserId: text('created_user_id'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CompanionConfig = typeof companionConfig.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type UserFeedback = typeof userFeedback.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type ApiUsageDaily = typeof apiUsageDaily.$inferSelect;
export type FunnelApiKey = typeof funnelApiKeys.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type ExchangeToken = typeof exchangeTokens.$inferSelect;
