import { pgTable, text, integer, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';
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
  isVerified: boolean('is_verified').default(false),
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

// Birth Charts
export const birthCharts = pgTable('birth_charts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  birthData: text('birth_data').notNull(), // JSON: BirthDataProps
  chartData: text('chart_data').notNull(), // JSON: NatalChartDataProps
  displayName: text('display_name'),
  isActive: boolean('is_active').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Companion Personas
export const companionPersonas = pgTable('companion_personas', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  birthChartId: text('birth_chart_id').references(() => birthCharts.id), // Nullable: may not exist during initial onboarding save

  // Persona attributes
  name: text('name').notNull(),
  personalityTraits: text('personality_traits').notNull(), // JSON: PersonalityTraitsProps
  communicationStyle: text('communication_style').notNull(), // JSON: CommunicationStyleProps
  emotionalApproach: text('emotional_approach').notNull(), // JSON: EmotionalApproachProps
  systemPrompt: text('system_prompt').notNull(),

  // Generation metadata
  llmModel: text('llm_model').notNull(), // Which LLM generated this persona
  generationReasoning: text('generation_reasoning'), // Why these choices were made
  generatedAt: text('generated_at').notNull(),

  // Status
  isActive: boolean('is_active').default(true),

  // Profile image (generated by ComfyUI via ProfileGeneratorAgent)
  profileImageUrl: text('profile_image_url'), // S3 URL of generated profile image
  profileImageGenerationId: text('profile_image_generation_id'), // FK to media_generations
  appearanceDescription: text('appearance_description'), // Physical description for image gen

  // Letta agent mapping (convenience columns — canonical mapping is in lettaAgents table)
  lettaAgentId: text('letta_agent_id'), // Letta server agent ID for quick lookup
  lettaConversationId: text('letta_conversation_id'), // Letta conversation/thread ID

  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Conversations
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title'),

  // Letta agent integration (added for companion chat)
  companionPersonaId: text('companion_persona_id').references(() => companionPersonas.id),
  lettaAgentId: text('letta_agent_id'), // Letta server agent ID for this conversation
  voiceAgentId: text('voice_agent_id'), // Letta voice agent ID (paired with chat agent)
  sharedBlockIds: text('shared_block_ids'), // JSON array of Letta block IDs

  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Messages
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  source: text('source').default('chat'), // 'chat' | 'voice_call' | 'video_call'
  audioUrl: text('audio_url'), // URL to audio recording (voice/video calls)
  audioTranscript: text('audio_transcript'), // Transcript of audio content
  tokenCount: integer('token_count'), // Token count for this message
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// NOTE: chat_messages table was considered but removed — message storage goes through
// the existing `messages` table via conversation lookup (conversations now have
// companionPersonaId for direct lookup). This avoids dual write paths.

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

// Email verification tokens
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  codeHash: text('code_hash').notNull(),
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

// Letta Agents — Maps companion personas to Letta server agents
export const lettaAgents = pgTable('letta_agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  companionPersonaId: text('companion_persona_id').references(() => companionPersonas.id).notNull(),
  conversationId: text('conversation_id').references(() => conversations.id),
  lettaAgentId: text('letta_agent_id').notNull(), // ID on the Letta server
  agentType: text('agent_type').notNull(), // 'companion' | 'prompt_enhancer'
  agentName: text('agent_name').notNull(),
  modelHandle: text('model_handle'), // e.g. 'ollama/qwen3-8b-nsfw:latest'
  blockIds: text('block_ids'), // JSON array of Letta block IDs
  contextWindowLimit: integer('context_window_limit'),
  isActive: boolean('is_active').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Media Generations — Tracks ComfyUI generation lifecycle
export const mediaGenerations = pgTable('media_generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  conversationId: text('conversation_id').references(() => conversations.id),
  companionPersonaId: text('companion_persona_id').references(() => companionPersonas.id),
  type: text('type').notNull(), // 'image' | 'video'
  status: text('status').notNull().default('pending'), // pending | generating | completed | failed
  originalRequest: text('original_request'),
  enhancedPrompt: text('enhanced_prompt').notNull(),
  comfyRequestId: text('comfy_request_id'),
  workflowName: text('workflow_name'),
  seed: text('seed'),
  storageUrl: text('storage_url'), // S3 URL of completed media
  storageKey: text('storage_key'), // S3 key
  filename: text('filename'),
  progress: integer('progress').default(0),
  errorMessage: text('error_message'),
  debugLogs: text('debug_logs'), // JSON array
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  completedAt: text('completed_at'),
});

// ComfyUI Workflows — Workflow storage (replaces JSON files for scalability)
export const comfyuiWorkflows = pgTable('comfyui_workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  type: text('type').notNull(), // 'image' | 'video'
  workflowJson: text('workflow_json').notNull(), // JSON blob of ComfyUI workflow
  promptNodeId: text('prompt_node_id').notNull(),
  outputNodeId: text('output_node_id').notNull(),
  seedNodeId: text('seed_node_id'),
  faceImageNodeId: text('face_image_node_id'),
  requiredModels: text('required_models'), // JSON
  configurableNodes: text('configurable_nodes'), // JSON
  isActive: boolean('is_active').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Activity Logs — unified tracking for frontend events and backend API requests
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  sessionId: text('session_id'), // Browser sessionStorage ID
  eventType: text('event_type').notNull(), // 'click' | 'page_view' | 'navigation' | 'onboarding' | 'api_request' | 'api_response' | 'error'
  eventName: text('event_name').notNull(), // e.g. 'login_button_click', 'GET /api/chat'
  source: text('source').notNull().default('backend'), // 'frontend' | 'backend'
  requestId: text('request_id'), // X-Request-ID for correlating frontend/backend
  method: text('method'), // HTTP method (GET, POST, etc.)
  path: text('path'), // URL path
  statusCode: integer('status_code'),
  durationMs: integer('duration_ms'),
  metadata: text('metadata'), // JSON string for arbitrary extra data
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  referrer: text('referrer'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Companion Voices — curated voice pool for companions
export const companionVoices = pgTable('companion_voices', {
  id: text('id').primaryKey(),
  companionPersonaId: text('companion_persona_id').references(() => companionPersonas.id),
  voiceId: text('voice_id').notNull(), // ElevenLabs voice ID
  voiceName: text('voice_name').notNull(),
  gender: text('gender').notNull(), // 'male' | 'female' | 'non-binary'
  simliFaceId: text('simli_face_id'), // Simli avatar face ID for video calls
  ttsModel: text('tts_model').default('eleven_turbo_v2'), // TTS model to use
  enabled: boolean('enabled').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Voice Call Metadata — tracks voice/video call sessions
export const voiceCallMetadata = pgTable('voice_call_metadata', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  roomName: text('room_name').notNull(), // LiveKit room name
  provider: text('provider').default('livekit'), // 'livekit'
  callStatus: text('call_status').notNull().default('initiated'), // 'initiated' | 'connected' | 'ended' | 'failed'
  hasVideo: boolean('has_video').default(false),
  durationSeconds: integer('duration_seconds'),
  messageCount: integer('message_count').default(0),
  memorySynced: boolean('memory_synced').default(false),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// LiveKit Agent Config — runtime pipeline configuration (key-value store)
export const livekitAgentConfig = pgTable('livekit_agent_config', {
  key: text('key').primaryKey(),
  value: jsonb('value'), // JSON config value
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
  updatedBy: text('updated_by'),
});

// LiveKit Call Events — event log for call lifecycle & debugging
export const livekitCallEvents = pgTable('livekit_call_events', {
  id: text('id').primaryKey(),
  roomName: text('room_name').notNull(),
  roomSid: text('room_sid'),
  conversationId: text('conversation_id'),
  userId: text('user_id'),
  companionId: text('companion_id'),
  sessionId: text('session_id'),
  eventType: text('event_type').notNull(), // 'call' | 'agent' | 'error' | 'metric'
  eventName: text('event_name').notNull(), // e.g. 'room_started', 'agent_connected', 'tts_latency'
  level: text('level').default('info'), // 'debug' | 'info' | 'warn' | 'error'
  source: text('source').default('agent'), // 'agent' | 'webhook' | 'api'
  metadata: text('metadata'), // JSON string
  latencyMs: integer('latency_ms'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Chat Debug Logs — debugging log for chat pipeline
export const chatDebugLogs = pgTable('chat_debug_logs', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // 'agent_resolution' | 'stream' | 'filter' | 'memory'
  event: text('event').notNull(),
  conversationId: text('conversation_id'),
  message: text('message'),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  conversations: many(conversations),
  birthCharts: many(birthCharts),
  companionPersonas: many(companionPersonas),
  lettaAgents: many(lettaAgents),
  mediaGenerations: many(mediaGenerations),
  preferences: one(userPreferences),
  feedback: many(userFeedback),
  sessions: many(sessions),
}));

export const birthChartsRelations = relations(birthCharts, ({ one, many }) => ({
  user: one(users, {
    fields: [birthCharts.userId],
    references: [users.id],
  }),
  personas: many(companionPersonas),
}));

export const companionPersonasRelations = relations(companionPersonas, ({ one, many }) => ({
  user: one(users, {
    fields: [companionPersonas.userId],
    references: [users.id],
  }),
  birthChart: one(birthCharts, {
    fields: [companionPersonas.birthChartId],
    references: [birthCharts.id],
  }),
  lettaAgents: many(lettaAgents),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  companionPersona: one(companionPersonas, {
    fields: [conversations.companionPersonaId],
    references: [companionPersonas.id],
  }),
  messages: many(messages),
  context: one(conversationContext),
  lettaAgents: many(lettaAgents),
  mediaGenerations: many(mediaGenerations),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// chatMessages relations removed — table not used (see note above)

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

export const lettaAgentsRelations = relations(lettaAgents, ({ one }) => ({
  user: one(users, {
    fields: [lettaAgents.userId],
    references: [users.id],
  }),
  companionPersona: one(companionPersonas, {
    fields: [lettaAgents.companionPersonaId],
    references: [companionPersonas.id],
  }),
  conversation: one(conversations, {
    fields: [lettaAgents.conversationId],
    references: [conversations.id],
  }),
}));

export const mediaGenerationsRelations = relations(mediaGenerations, ({ one }) => ({
  user: one(users, {
    fields: [mediaGenerations.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [mediaGenerations.conversationId],
    references: [conversations.id],
  }),
  companionPersona: one(companionPersonas, {
    fields: [mediaGenerations.companionPersonaId],
    references: [companionPersonas.id],
  }),
}));

export const companionVoicesRelations = relations(companionVoices, ({ one }) => ({
  companionPersona: one(companionPersonas, {
    fields: [companionVoices.companionPersonaId],
    references: [companionPersonas.id],
  }),
}));

export const voiceCallMetadataRelations = relations(voiceCallMetadata, ({ one }) => ({
  conversation: one(conversations, {
    fields: [voiceCallMetadata.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [voiceCallMetadata.userId],
    references: [users.id],
  }),
}));

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
export type BirthChart = typeof birthCharts.$inferSelect;
export type NewBirthChart = typeof birthCharts.$inferInsert;

export type CompanionPersona = typeof companionPersonas.$inferSelect;
export type NewCompanionPersona = typeof companionPersonas.$inferInsert;

export type LettaAgent = typeof lettaAgents.$inferSelect;
export type NewLettaAgent = typeof lettaAgents.$inferInsert;
export type MediaGeneration = typeof mediaGenerations.$inferSelect;
export type NewMediaGeneration = typeof mediaGenerations.$inferInsert;
export type ComfyuiWorkflow = typeof comfyuiWorkflows.$inferSelect;
export type NewComfyuiWorkflow = typeof comfyuiWorkflows.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type CompanionVoice = typeof companionVoices.$inferSelect;
export type NewCompanionVoice = typeof companionVoices.$inferInsert;
export type VoiceCallMetadata = typeof voiceCallMetadata.$inferSelect;
export type NewVoiceCallMetadata = typeof voiceCallMetadata.$inferInsert;
export type LivekitAgentConfig = typeof livekitAgentConfig.$inferSelect;
export type NewLivekitAgentConfig = typeof livekitAgentConfig.$inferInsert;
export type LivekitCallEvent = typeof livekitCallEvents.$inferSelect;
export type NewLivekitCallEvent = typeof livekitCallEvents.$inferInsert;
export type ChatDebugLog = typeof chatDebugLogs.$inferSelect;
export type NewChatDebugLog = typeof chatDebugLogs.$inferInsert;
