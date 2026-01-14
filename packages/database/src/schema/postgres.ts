import { pgTable, text, integer, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  chatName: text('chat_name'), // User's preferred name for AI to address them
  personalityMode: text('personality_mode').default('nurturing'), // 'nurturing' | 'playful' | 'dominant'
  preferredGender: text('preferred_gender').default('female'), // 'male' | 'female' | 'non-binary' | 'custom'
  customGender: text('custom_gender'), // Custom gender text if preferredGender is 'custom'
  storagePreference: text('storage_preference').default('cloud'), // 'local' | 'cloud'
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
  isAdmin: boolean('is_admin').default(false),
  subscriptionStatus: text('subscription_status').default('not_subscribed'), // 'subscribed' | 'not_subscribed'
  manualSubscriptionOverride: boolean('manual_subscription_override').default(false), // When true, Stripe webhooks won't change subscription status
  credits: integer('credits').default(5), // Daily message credits for free users (max 5)
  lastCreditRefresh: text('last_credit_refresh'), // ISO date string of last daily credit refresh
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  accountSource: text('account_source').default('abionti_api'), // 'anplexa' = Anplexa app users (from funnel), 'abionti_api' = Abionti API product users

  // CRM fields for email sequences
  funnelType: text('funnel_type').default('direct'), // 'waitlist' | 'direct'
  persona: text('persona'), // 'lonely' | 'curious' | 'privacy'
  stage: text('stage').default('new'), // 'new' | 'waitlist' | 'invited' | 'converted' | 'dormant'
  entrySource: text('entry_source'), // 'instagram' | 'tiktok' | 'reddit' | 'search' | 'retargeting' | 'organic'
  usedFreeMessages: integer('used_free_messages').default(0),
  emailOpened1: boolean('email_opened_1').default(false),
  emailOpened2: boolean('email_opened_2').default(false),
  emailOpened3: boolean('email_opened_3').default(false),
  clickedUseApp: boolean('clicked_use_app').default(false),
  feedbackSubmitted: boolean('feedback_submitted').default(false),
  refundRequested: boolean('refund_requested').default(false),
  refundProcessed: boolean('refund_processed').default(false),
  lastActivityAt: text('last_activity_at'),

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
export const companionConfig = pgTable('companion_config', {
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
  temperature: doublePrecision('temperature').default(0.8),

  // Which lengths use long-form model
  useLongFormForDetailed: boolean('use_long_form_for_detailed').default(true),

  // Welcome message (shown on first chat)
  welcomeTitle: text('welcome_title').default('WELCOME TO TERMINAL COMPANION'),
  welcomeMessage: text('welcome_message').default('This is your private, judgment-free terminal for meaningful conversation.'),

  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Conversations
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Messages
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Context/Memory summaries (for long conversations)
export const conversationContext = pgTable('conversation_context', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  summary: text('summary').notNull(),
  keyFacts: text('key_facts'), // JSON array
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Sessions (for auth)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Magic link tokens (passwordless auth)
export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Exchange tokens (short-lived codes for secure redirect auth)
// Used by Funnel-Forge to pass auth without JWT in URL
export const exchangeTokens = pgTable('exchange_tokens', {
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
export const userPreferences = pgTable('user_preferences', {
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
  useOrangeAccent: boolean('use_orange_accent').default(false),

  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// User feedback
export const userFeedback = pgTable('user_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(), // 'feedback' | 'feature'
  content: text('content').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// API Keys for external access
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  userId: text('user_id').references(() => users.id), // Owner of the API key
  createdBy: text('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// API Usage tracking
export const apiUsage = pgTable('api_usage', {
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
export const apiUsageDaily = pgTable('api_usage_daily', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),
  userId: text('user_id').references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  totalRequests: integer('total_requests').default(0),
  totalTokens: integer('total_tokens').default(0),
  avgLatencyMs: integer('avg_latency_ms'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
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
export const systemPrompts = pgTable('system_prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('default'), // Identifier for the prompt
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').default(false), // Only one should be active
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  notes: text('notes'), // Optional notes about this version
});

// Email queue for scheduled sends
export const emailQueue = pgTable('email_queue', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  emailTemplate: text('email_template').notNull(), // 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'D1' | 'D2' | 'D3' | 'D4' | 'refund_thanks'
  scheduledAt: text('scheduled_at').notNull(),
  sentAt: text('sent_at'),
  status: text('status').default('pending'), // 'pending' | 'sent' | 'failed' | 'cancelled'
  errorMessage: text('error_message'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Email logs for tracking sent emails
export const emailLogs = pgTable('email_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  emailTemplate: text('email_template').notNull(),
  subject: text('subject'),
  sentAt: text('sent_at').notNull(),
  openedAt: text('opened_at'),
  clickedAt: text('clicked_at'),
  clickSource: text('click_source'), // Which link/button was clicked
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Funnel API Keys for external funnel integrations
export const funnelApiKeys = pgTable('funnel_api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Funnel API Key'),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 12 chars for identification
  isActive: boolean('is_active').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  lastUsedAt: text('last_used_at'),
  notes: text('notes'),
});

// Contact Submissions - Master audit log for ALL contact entries (append-only, keeps duplicates)
export const contactSubmissions = pgTable('contact_submissions', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  chatName: text('chat_name'),
  sourceChannel: text('source_channel').notNull(), // 'funnel' | 'waitlist' | 'access_anplexa' | 'frontend' | 'api' | 'auth_register'
  sourceDetail: text('source_detail'), // Additional context (e.g., 'instagram', 'tiktok', UTM params)
  funnelType: text('funnel_type'), // 'waitlist' | 'direct'
  persona: text('persona'), // 'lonely' | 'curious' | 'privacy'
  entrySource: text('entry_source'), // 'instagram' | 'tiktok' | 'reddit' | 'search' | 'retargeting' | 'organic' | 'landing'
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  rawPayload: text('raw_payload'), // JSON string of full request body
  isNewUser: boolean('is_new_user').default(true), // false if user already existed
  existingUserId: text('existing_user_id'), // If user already existed, their ID
  createdUserId: text('created_user_id'), // If new user was created, their ID
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
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type FunnelApiKey = typeof funnelApiKeys.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
export type ExchangeToken = typeof exchangeTokens.$inferSelect;
