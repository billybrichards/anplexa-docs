# Technical Specification: Anplexa Chat Infrastructure Port

## 1. Technical Context

### 1.1 Language & Runtime

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | >=20.0.0 |
| Language | TypeScript | ^5.7.2 |
| Package Manager | pnpm | >=8.0.0 |
| Monorepo | Turbo | ^2.3.3 |
| ORM | Drizzle ORM | Latest (PostgreSQL) |
| API Framework | Express.js | Latest |
| Frontend | Next.js 15 (App Router) | Latest |
| DI Container | Awilix | Latest |
| Validation | Zod | Latest |
| Testing | Vitest | Latest |
| Python Agent | Python 3.12+ | LiveKit Agents SDK >=1.3.10 |

### 1.2 Existing Architecture

The Anplexa monorepo follows Clean Architecture with these layers:

```
packages/core        → Domain layer (entities, value objects, use cases, repository interfaces)
packages/contracts   → Shared API types & Zod schemas
packages/config      → Environment variable validation
packages/database    → Drizzle ORM schemas & migrations
packages/services    → Infrastructure services (Letta, AI, Astrology, Auth, Email, Stripe)
packages/repositories → Repository implementations
apps/api             → Express backend (Awilix DI container)
apps/companions      → Next.js frontend
apps/funnel          → Marketing funnel (Vite + React)
apps/docs            → Documentation site
```

**DI Registration**: All services are registered in `apps/api/src/container.ts` using Awilix `asClass` / `asFunction`. Route handlers resolve dependencies from `req.app.locals.container`.

**Auth Pattern**: JWT middleware in `apps/api/src/middleware/auth.ts` attaches `req.user: { sub, email, isAdmin }` to authenticated requests.

### 1.3 Key Dependencies (Existing)

- `@anplexa/services/LettaGateway` — Already has: `createAgent`, `getAgent`, `findAgentByConversation`, `deleteAgent`, `createMemoryBlocks`, `getMemoryBlocks`, `updateMemoryBlock`, `sendMessage`, `sendMessageStream`, `insertArchivalMemory`, `createCustomTool`, `listTools`
- `@anplexa/services/AgentProvisioner` — Already has: full provisioning flow (PersonaBuilder → CognitiveBlockFactory → CognitivePromptService → LettaGateway → DB persist)
- `@anplexa/services/PersonaBuilder` — Builds persona text from CompanionPersona
- `@anplexa/services/CognitiveBlockFactory` — Creates `current_focus`, `user_model`, `active_goals` blocks
- `@anplexa/services/CognitivePromptService` — Generates cognitive memory instructions for system prompt
- `@anplexa/core` entities — `User`, `Conversation`, `Message`, `BirthChart`, `CompanionPersona`
- `@anplexa/contracts` — `ChatRequest`, `ChatPreferences`, SSE event types, `MessageDTO`, `ConversationDTO`

### 1.4 External Services

| Service | URL | Auth | Purpose |
|---------|-----|------|---------|
| Letta Server | `http://194.228.55.129:39967` | Bearer token | Agent orchestration, memory blocks |
| Ollama | `http://194.228.55.129:39967/ollama` | Bearer token | LLM inference + embeddings (future NSFW) |
| LiveKit Cloud | `wss://aurapoc-ny8qqa3y.livekit.cloud` | API key + secret | WebRTC signaling, agent dispatch |
| Deepgram | Cloud API | API key | Speech-to-text (Nova-3) |
| ElevenLabs | Cloud API | API key | Text-to-speech (eleven_turbo_v2_5) |
| Simli | Cloud API | API key | Lip-synced video avatar |
| Anthropic Claude | Cloud API | API key | SFW chat LLM + trait enrichment |
| Redis | Railway instance | Connection URL | Rate limiting, caching |
| PostgreSQL | Railway `Postgres-0WPo` | Connection URL | Application data |
| AWS S3 | `DO_NOT_DELETE_OR_TOUCH_BBR_1` | IAM keys | Media storage |

---

## 2. Implementation Approach

### 2.1 Strategy: Extend, Don't Replace

The Anplexa codebase already has partial Letta integration. The approach is to **extend existing services** rather than creating parallel implementations:

1. **LettaGateway** — Already fully functional for single-agent operations. Extend with: `getAgentSystemPrompt()`, `getAgentMemoryBlockByLabel()`, `deleteRecentMessages()`. No architectural changes needed.

2. **AgentProvisioner** — Currently provisions single agents. Extend to also create a paired **voice agent** (with sleeptime for async memory processing) and accept astrology-derived block content.

3. **Chat routes** — Existing `/api/chat/send` SSE endpoint works. Enhance with: `ChatActionStreamFilter` for cleaner streaming, rate limiting middleware, source tracking (`chat` | `voice_call` | `video_call`).

4. **Database schema** — Extend existing tables (`conversations`, `messages`) with new columns. Add new tables for voice features.

5. **Frontend** — Extend existing `ChatInterface` component. Add LiveKit SDK for voice/video calls.

### 2.2 Component Mapping: What Gets Ported from Letta-Lonely

| Letta-Lonely Component | Anplexa Target | Action |
|-------------------------|---------------|--------|
| `LettaGateway.ts` (1095 lines) | `packages/services/src/letta/LettaGateway.ts` (477 lines) | **Extend** — add 3 methods |
| `ChatActionStreamFilter` | `packages/services/src/letta/ChatActionStreamFilter.ts` | **Port** — new file |
| `livekitRoutes.ts` (777 lines) | `apps/api/src/routes/voice/livekit.ts` | **Port & adapt** — JWT auth, simplified agent resolution |
| `RouteToAgentUseCase.ts` | `packages/core/src/use-cases/chat/RouteToAgentUseCase.ts` | **Port & simplify** — single agent (no NSFW/SFW split) |
| `HumanBlockBuilder.ts` | `packages/services/src/letta/AstrologyBlockBuilder.ts` | **New** — builds from TraitProfile + BirthChart (not onboarding sessions) |
| `LiveKitCallEventService` | `packages/services/src/livekit/CallEventService.ts` | **Port** — new file |
| `lettaConversationRoutes.ts` | Extend `apps/api/src/routes/chat/` | **Port** — conversation CRUD, call-summary endpoint |
| Chat SSE streaming | Extend `apps/api/src/routes/chat/send.ts` | **Enhance** — add action filter, activity events |
| Frontend chat store | `apps/companions/src/stores/chatStore.ts` | **New** — Zustand store for chat state |
| Frontend LiveKit components | `apps/companions/src/components/voice/` | **New** — call button, in-call UI, video display |
| Python agent worker | Clone `aura-livekit-agent/` as `anplexa-livekit-agent/` | **Fork** — update RAILWAY_API_URL to Anplexa backend |

### 2.3 What Is NOT Ported

| Component | Reason |
|-----------|--------|
| Dual NSFW/SFW agent pair | Anplexa is SFW-only initially; single agent per user-companion pair |
| `NsfwDirectiveBuilder` | No NSFW content at launch |
| `voiceProxyRoutes.ts` (old ElevenLabs proxy) | Replaced by LiveKit architecture |
| `SceneVideoService` / LoRA catalog | Adult content feature |
| `BackstoryBlockBuilder` | Anplexa uses astrology data instead of explicit backstory |
| Guest chat | Removed per requirement |
| In-memory call mode store | Use Redis instead |
| Prompt VCS | Defer to admin tooling phase |

---

## 3. Source Code Structure Changes

### 3.1 New Files

```
packages/services/src/
├── letta/
│   ├── ChatActionStreamFilter.ts        ← Port from LL (text/voice mode filtering)
│   ├── AstrologyBlockBuilder.ts         ← New: TraitProfile + BirthChart → human block
│   └── CompanionBlockBuilder.ts         ← New: CompanionPersona + astrology → persona block
├── livekit/
│   ├── LiveKitService.ts                ← New: token generation, room creation, agent dispatch
│   ├── CallEventService.ts              ← Port from LL: call event persistence
│   └── types.ts                         ← LiveKit-specific types
└── rate-limit/
    └── RateLimitService.ts              ← New: Redis-backed rate limiting

packages/core/src/
├── use-cases/chat/
│   ├── RouteToAgentUseCase.ts           ← Port & simplify from LL
│   └── ProvisionChatAgentUseCase.ts     ← New: orchestrates agent provisioning from onboarding
├── domain/services/
│   ├── ILiveKitService.ts               ← Interface for LiveKit operations
│   └── IRateLimitService.ts             ← Interface for rate limiting

packages/contracts/src/
├── voice.ts                             ← LiveKit token request/response types
└── livekit-events.ts                    ← Call event types

packages/database/src/
├── schema/postgres.ts                   ← Extend with new tables + columns
└── migrations/                          ← New migration files

apps/api/src/
├── routes/
│   ├── voice/
│   │   └── livekit.ts                   ← LiveKit endpoints (token, config, events, webhooks)
│   └── chat/
│       └── send.ts                      ← Enhanced with action filter, rate limiting
├── middleware/
│   ├── rateLimitMiddleware.ts           ← Redis-backed rate limit middleware
│   └── internalApiKeyMiddleware.ts      ← Validates x-internal-api-key header
└── container.ts                         ← Register new services

apps/companions/src/
├── stores/
│   └── chatStore.ts                     ← Zustand store for chat state management
├── hooks/
│   ├── useChat.ts                       ← Enhanced chat hook with streaming
│   └── useLiveKit.ts                    ← LiveKit room connection hook
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx            ← Enhanced message display
│   │   ├── StreamingMessage.tsx         ← Progressive rendering component
│   │   ├── AgentActivityIndicator.tsx   ← Thinking/tool_call status
│   │   └── ConversationList.tsx         ← Sidebar conversation list
│   └── voice/
│       ├── CallButton.tsx               ← Initiate voice/video call
│       ├── InCallModal.tsx              ← Active call UI
│       ├── VideoDisplay.tsx             ← Simli avatar video
│       └── CallControls.tsx             ← Mute, hang up, toggle video
└── lib/
    ├── livekit-client.ts                ← LiveKit SDK wrapper
    └── sse-parser.ts                    ← Enhanced SSE parser (activity events)
```

### 3.2 Modified Files

```
packages/services/src/letta/LettaGateway.ts
  ← Add: getAgentSystemPrompt(), getAgentMemoryBlockByLabel(), deleteRecentMessages()

packages/services/src/letta/AgentProvisioner.ts
  ← Add: provisionWithAstrology() method accepting TraitProfile + BirthChart
  ← Add: voice agent creation (with sleeptime) as part of provisioning
  ← Add: astrology block content via AstrologyBlockBuilder

packages/services/src/letta/CognitiveBlockFactory.ts
  ← Add: astrology-initialized user_model block content

packages/services/src/letta/PersonaBuilder.ts
  ← Add: astrological awareness section in persona text

packages/database/src/schema/postgres.ts
  ← Add new tables: companionVoices, voiceCallMetadata, livekitAgentConfig, livekitCallEvents, chatDebugLogs
  ← Extend conversations table: voiceAgentId column
  ← Extend messages table: source, audioUrl, audioTranscript, tokenCount columns

packages/contracts/src/chat.ts
  ← Add: activity SSE event types, voice call metadata types

apps/api/src/container.ts
  ← Register: LiveKitService, CallEventService, RateLimitService, AstrologyBlockBuilder, CompanionBlockBuilder
  ← Register: RouteToAgentUseCase, ProvisionChatAgentUseCase

apps/api/src/app.ts
  ← Mount: /api/voice routes

apps/companions/src/components/ChatInterface.tsx
  ← Integrate: streaming message display, agent activity indicators, call button

apps/companions/src/lib/adapters/api-client.ts
  ← Add: LiveKit token endpoint, voice call methods

packages/config/src/env.ts
  ← Add: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, INTERNAL_API_KEY,
         ELEVENLABS_API_KEY, DEEPGRAM_API_KEY, SIMLI_API_KEY, REDIS_URL,
         AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_REGION
```

---

## 4. Data Model Changes

### 4.1 Schema Migrations

All migrations use Drizzle's migration system and follow the existing pattern in `packages/database/`.

#### 4.1.1 Extend `conversations` Table

```typescript
// Add column to existing conversations table
voiceAgentId: text('voice_agent_id'),  // Letta voice agent ID (with sleeptime)
```

#### 4.1.2 Extend `messages` Table

```typescript
// Add columns to existing messages table
source: text('source').default('chat'),           // 'chat' | 'voice_call' | 'video_call'
audioUrl: text('audio_url'),                       // S3 URL for voice message audio
audioTranscript: text('audio_transcript'),         // JSON transcript from voice calls
tokenCount: integer('token_count'),                // Token count for the message
```

#### 4.1.3 New Table: `companionVoices`

Curated voice pool mapping companions to ElevenLabs voices and Simli faces.

```typescript
export const companionVoices = pgTable('companion_voices', {
  id: text('id').primaryKey(),
  companionPersonaId: text('companion_persona_id').references(() => companionPersonas.id),
  voiceId: text('voice_id').notNull(),               // ElevenLabs voice ID
  voiceName: text('voice_name'),                      // Human-readable name
  gender: text('gender'),                             // 'female' | 'male'
  simliFaceId: text('simli_face_id'),                // Simli avatar face ID
  ttsModel: text('tts_model').default('eleven_turbo_v2_5'),
  enabled: boolean('enabled').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
```

#### 4.1.4 New Table: `voiceCallMetadata`

Tracks voice/video call lifecycle.

```typescript
export const voiceCallMetadata = pgTable('voice_call_metadata', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  roomName: text('room_name'),                       // LiveKit room name
  provider: text('provider').default('livekit'),
  callStatus: text('call_status').default('active'), // 'active' | 'completed' | 'failed'
  hasVideo: boolean('has_video').default(false),
  durationSeconds: integer('duration_seconds'),
  messageCount: integer('message_count'),
  memorySynced: boolean('memory_synced').default(false),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
```

#### 4.1.5 New Table: `livekitAgentConfig`

Runtime pipeline configuration for Python agent worker (hot-configurable without redeploy).

```typescript
export const livekitAgentConfig = pgTable('livekit_agent_config', {
  key: text('key').primaryKey(),                     // 'stt' | 'llm_nsfw' | 'llm_sfw' | 'tts' | 'avatar'
  value: text('value').notNull(),                    // JSON string
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
  updatedBy: text('updated_by'),
});
```

#### 4.1.6 New Table: `livekitCallEvents`

Call observability events batched from Python agent.

```typescript
export const livekitCallEvents = pgTable('livekit_call_events', {
  id: text('id').primaryKey(),
  roomName: text('room_name'),
  roomSid: text('room_sid'),
  conversationId: text('conversation_id'),
  userId: text('user_id'),
  companionId: text('companion_id'),
  sessionId: text('session_id'),
  eventType: text('event_type'),                    // 'pipeline_turn' | 'session_summary' | 'memory' | 'error'
  eventName: text('event_name'),
  level: text('level').default('info'),             // 'info' | 'warn' | 'error'
  source: text('source'),                           // 'agent' | 'webhook' | 'backend'
  metadata: text('metadata'),                       // JSON string
  latencyMs: integer('latency_ms'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
```

#### 4.1.7 New Table: `chatDebugLogs`

Optional debug logging for chat interactions.

```typescript
export const chatDebugLogs = pgTable('chat_debug_logs', {
  id: text('id').primaryKey(),
  category: text('category'),                       // 'chat' | 'agent' | 'memory' | 'voice'
  event: text('event'),
  conversationId: text('conversation_id'),
  message: text('message'),
  metadata: text('metadata'),                       // JSON string
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
```

### 4.2 Drizzle Relations (additions)

```typescript
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
```

---

## 5. API Interface Changes

### 5.1 Chat API (Enhanced Existing)

#### POST `/api/chat/send` — Enhanced SSE Streaming

**Changes from current implementation:**
- Add `ChatActionStreamFilter` to clean streaming tokens
- Add activity SSE events (`thinking`, `tool_call`, `tool_return`, `responding`)
- Add rate limiting check (5 messages/day for free users)
- Add source tracking on persisted messages
- Add `companionPersonaId` to request body for agent resolution

**Request:**
```typescript
{
  conversationId?: string;     // Optional — creates new if absent
  message: string;
  companionPersonaId?: string; // For agent resolution
}
```

**SSE Events (enhanced):**
```
event: start
data: {"conversationId":"uuid","messageId":"uuid"}

event: activity
data: {"status":"thinking"}

event: activity
data: {"status":"tool_call","toolName":"core_memory_replace"}

event: activity
data: {"status":"tool_return","toolName":"core_memory_replace"}

event: activity
data: {"status":"responding"}

event: token
data: {"content":"Hello"}

event: token
data: {"content":", how"}

event: done
data: {"conversationId":"uuid","messageId":"uuid","tokenCount":42}

event: error
data: {"error":"Rate limit exceeded","code":"RATE_LIMIT_EXCEEDED"}
```

#### GET `/api/chat/conversations/:id/messages` — Enhanced

**Changes:**
- Add `source` field to returned messages
- Add `audioTranscript` field for voice call messages

### 5.2 Voice API (New)

#### POST `/api/voice/livekit/token` — Generate LiveKit Token

**Auth:** JWT required

**Request:**
```typescript
{
  conversationId: string;
  companionId: string;        // companionPersonaId
  enableVideo?: boolean;      // Request video call (requires Simli face)
}
```

**Process:**
1. Validate user owns conversation
2. Resolve companion voice (from `companionVoices` table)
3. Resolve or create voice agent (Letta agent with sleeptime)
4. Build dispatch metadata
5. Generate LiveKit access token
6. Create LiveKit room: `anplexa-call-{conversationId}-{timestamp}`
7. Dispatch named agent `"aura-companion"` to room
8. Return token + room info

**Response:**
```typescript
{
  token: string;              // LiveKit access token
  roomName: string;           // LiveKit room name
  wsUrl: string;              // wss://aurapoc-ny8qqa3y.livekit.cloud
}
```

#### GET `/api/voice/livekit/config` — Pipeline Config

**Auth:** `x-internal-api-key` header

**Response:**
```typescript
{
  success: true;
  config: Record<string, unknown>;  // From livekitAgentConfig table
}
```

#### PUT `/api/voice/livekit/config/:key` — Update Config

**Auth:** Admin JWT required

**Request:**
```typescript
{
  value: Record<string, unknown>;  // Config value (JSON)
}
```

#### POST `/api/voice/livekit/events` — Batch Call Events

**Auth:** `x-internal-api-key` header

**Request:**
```typescript
{
  events: Array<{
    roomName: string;
    roomSid?: string;
    conversationId?: string;
    userId?: string;
    companionId?: string;
    sessionId?: string;
    eventType: string;
    eventName: string;
    level?: string;
    source?: string;
    metadata?: Record<string, unknown>;
    latencyMs?: number;
  }>;
}
```

#### POST `/api/voice/livekit/webhooks` — LiveKit Webhooks

**Auth:** LiveKit webhook signature verification

Handles room lifecycle events (room_started, room_finished, participant_joined, participant_left).

#### POST `/api/chat/conversations/:id/call-summary` — Store Call Transcript

**Auth:** `x-internal-api-key` header (called from Python agent)

**Request:**
```typescript
{
  companionName: string;
  duration: number;           // seconds
  startedAt: string;          // ISO 8601
  entries: Array<{
    role: string;             // 'user' | 'assistant'
    text: string;
    timestamp?: string;
  }>;
}
```

**Process:**
1. Create a single `message` record with role `'assistant'`, source `'voice_call'`
2. Store entries as JSON in `audioTranscript` column
3. Update `voiceCallMetadata` record with duration, message count, memory synced status

### 5.3 Companion API (Enhanced)

#### POST `/api/companion/provision` — Provision Letta Agent

**Auth:** JWT required

**Request:**
```typescript
{
  companionPersonaId: string;
  birthChartId: string;
  traitProfileData: object;   // Serialized TraitProfile
}
```

**Process:**
1. Fetch CompanionPersona from DB
2. Fetch BirthChart from DB
3. Build `human` block via `AstrologyBlockBuilder.buildHumanBlock(traitProfile, birthChart)`
4. Build `persona` block via `CompanionBlockBuilder.buildPersonaBlock(companionPersona, traitProfile)`
5. Build `user_model` block via `AstrologyBlockBuilder.buildUserModelBlock(traitProfile, birthChart)`
6. Create cognitive blocks via `CognitiveBlockFactory`
7. Build system prompt via `CognitivePromptService`
8. Create Letta agent via `LettaGateway.createAgent()`
9. Create conversation record with `lettaAgentId`
10. Persist to `lettaAgents` table

**Response:**
```typescript
{
  conversationId: string;
  lettaAgentId: string;
  companionPersonaId: string;
}
```

---

## 6. Service Implementations

### 6.1 AstrologyBlockBuilder

Converts astrology assessment output into Letta memory block content.

```typescript
// packages/services/src/letta/AstrologyBlockBuilder.ts

export class AstrologyBlockBuilder {
  /**
   * Build the Letta `human` block from the user's astrology assessment.
   * Limit: 3000 characters
   */
  buildHumanBlock(
    traitProfile: TraitProfile,
    birthChart: BirthChart,
    userName?: string,
  ): string {
    // Format:
    // ASTROLOGICAL PROFILE:
    // - Sun in {sign} ({element}, {modality}): {trait description}
    // - Moon in {sign}: {trait description}
    // - Rising in {sign}: {trait description}
    // - Dominant element: {element} ({percentage}%)
    // - Dominant modality: {modality}
    //
    // DOMINANT TRAITS (from trait analysis):
    // {top 3-5 traits with strength scores}
    //
    // PERSONALITY SUMMARY:
    // {AI-generated personality summary}
    //
    // KNOWN FACTS:
    // {name if provided}
    // (Update this block as you learn more about the user through conversation.)
  }

  /**
   * Build the Letta `user_model` block with astrology-derived initial understanding.
   * Limit: 3000 characters
   */
  buildUserModelBlock(
    traitProfile: TraitProfile,
    birthChart: BirthChart,
    userName?: string,
  ): string {
    // Format:
    // INITIAL UNDERSTANDING (from birth chart):
    // {user_name} has a {element}-dominant chart suggesting they value {element_traits}.
    // Their Sun-Moon combination ({sun}/{moon}) indicates {interpretation}.
    // Communication style: {mercury interpretation}
    // Relationship approach: {venus interpretation}
    //
    // LEARNED PREFERENCES:
    // (Updated by Letta during conversations)
    //
    // BOUNDARIES:
    // (Updated by Letta as it learns)
  }
}
```

### 6.2 CompanionBlockBuilder

Converts companion persona + astrology compatibility into Letta persona block.

```typescript
// packages/services/src/letta/CompanionBlockBuilder.ts

export class CompanionBlockBuilder {
  /**
   * Build the Letta `persona` block from CompanionPersona + astrological context.
   * Limit: 4000 characters
   */
  buildPersonaBlock(
    persona: CompanionPersona,
    traitProfile: TraitProfile,
  ): string {
    // Format:
    // IDENTITY:
    // I am {name}, your astrological companion. I was born from the cosmic alignment
    // of your birth chart - designed to complement your {dominant_element} energy.
    //
    // PERSONALITY:
    // {personalityTraits from CompanionPersona}
    //
    // COMMUNICATION STYLE:
    // {communicationStyle from CompanionPersona}
    //
    // EMOTIONAL APPROACH:
    // {emotionalApproach from CompanionPersona}
    //
    // ASTROLOGICAL AWARENESS:
    // I understand astrology deeply and can help you explore how your chart
    // influences your daily life. I weave astrological insights naturally
    // into our conversations when relevant.
  }
}
```

### 6.3 LiveKitService

Manages LiveKit room lifecycle and agent dispatch.

```typescript
// packages/services/src/livekit/LiveKitService.ts

import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';

export class LiveKitService {
  private roomService: RoomServiceClient;
  private dispatchClient: AgentDispatchClient;

  constructor(config: { url: string; apiKey: string; apiSecret: string }) {
    this.roomService = new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
    this.dispatchClient = new AgentDispatchClient(config.url, config.apiKey, config.apiSecret);
  }

  /**
   * Generate a LiveKit access token for a user to join a room.
   */
  generateToken(identity: string, roomName: string, metadata?: string): string

  /**
   * Create a LiveKit room with metadata for agent dispatch.
   */
  async createRoom(roomName: string, metadata: string): Promise<void>

  /**
   * Dispatch the "aura-companion" named agent to a room.
   */
  async dispatchAgent(roomName: string, agentName: string, metadata: string): Promise<void>

  /**
   * Verify LiveKit webhook signature.
   */
  verifyWebhookSignature(body: string, signature: string): boolean
}
```

**Dependency:** `livekit-server-sdk` (npm package) — add to `packages/services/package.json`.

### 6.4 RateLimitService

Redis-backed rate limiting for free tier users.

```typescript
// packages/services/src/rate-limit/RateLimitService.ts

import { Redis } from 'ioredis';

export class RateLimitService {
  constructor(private redis: Redis) {}

  /**
   * Check if user can send a message. Returns remaining count or throws.
   * Free users: 5 messages per day (UTC reset).
   * Subscribed users: unlimited.
   */
  async checkAndIncrement(userId: string, isSubscribed: boolean): Promise<{ remaining: number }>

  /**
   * Get remaining message count for a user.
   */
  async getRemaining(userId: string, isSubscribed: boolean): Promise<number>
}
```

**Key design:** Uses Redis `INCR` with `EXPIREAT` set to midnight UTC. Key format: `anplexa:rate:{userId}:{YYYY-MM-DD}`.

### 6.5 ChatActionStreamFilter (Port from Letta-Lonely)

Two-mode streaming filter for cleaning LLM output.

```typescript
// packages/services/src/letta/ChatActionStreamFilter.ts

export class ChatActionStreamFilter {
  constructor(mode: 'text' | 'voice') {}

  /**
   * Process a single streaming token. Returns filtered output.
   * Text mode: Buffers potential *action* patterns, strips <think> blocks
   * Voice mode: Zero-latency, strips all formatting immediately
   */
  processToken(token: string): string

  /**
   * Flush remaining buffered content.
   */
  flush(): string
}

/**
 * Standalone sanitization functions for complete strings.
 */
export function sanitizeAssistantOutput(text: string): string
export function sanitizeForChat(text: string): string
export function sanitizeForTTS(text: string): string
export function stripThinkBlocks(text: string): string
```

### 6.6 RouteToAgentUseCase (Simplified)

Agent resolution for Anplexa's single-agent model.

```typescript
// packages/core/src/use-cases/chat/RouteToAgentUseCase.ts

export class RouteToAgentUseCase {
  constructor(
    private conversationRepo: IConversationRepository,
    private lettaAgentRepo: ILettaAgentRepository,
    private agentProvisioner: AgentProvisioner,
    private lettaGateway: LettaGateway,
  ) {}

  /**
   * Resolve the Letta agent for a conversation.
   * 1. Check conversation.lettaAgentId (fast path)
   * 2. Check lettaAgents table by companionPersonaId
   * 3. Check Letta metadata (fallback)
   * 4. Auto-provision if none exists
   */
  async execute(input: {
    conversationId: string;
    userId: string;
    companionPersonaId: string;
  }): Promise<{
    agentId: string;
    agentName: string;
    modelUsed: string;
    blockIds: string[];
  }>
}
```

---

## 7. Frontend Implementation

### 7.1 Chat Store (Zustand)

Central state management for the chat interface, replacing the current hook-based approach.

```typescript
// apps/companions/src/stores/chatStore.ts

interface ChatState {
  messages: MessageDTO[];
  isSending: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  currentConversationId: string | null;
  agentActivity: AgentActivity | null;
  streamStartTime: number | null;
}

interface AgentActivity {
  status: 'listening' | 'thinking' | 'tool_call' | 'tool_return' | 'responding';
  toolName?: string;
}

interface ChatActions {
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  createConversation: (companionPersonaId: string) => Promise<string>;
}
```

### 7.2 LiveKit Integration

Use `@livekit/components-react` for room connection and media track management.

```typescript
// apps/companions/src/hooks/useLiveKit.ts

export function useLiveKit() {
  return {
    startCall: (conversationId: string, companionId: string, enableVideo?: boolean) => Promise<void>;
    endCall: () => void;
    isInCall: boolean;
    isMuted: boolean;
    toggleMute: () => void;
    callDuration: number;
    connectionState: 'disconnected' | 'connecting' | 'connected';
  }
}
```

**Dependencies to add to `apps/companions/package.json`:**
- `livekit-client`
- `@livekit/components-react`

### 7.3 SSE Parser Enhancement

Extend existing `lib/sse-parser.ts` to handle new event types:

```typescript
// Extended event types
type SSEEvent =
  | { type: 'start'; conversationId: string; messageId: string }
  | { type: 'token'; content: string }
  | { type: 'activity'; status: string; toolName?: string }
  | { type: 'done'; conversationId: string; messageId: string; tokenCount?: number }
  | { type: 'error'; error: string; code?: string };
```

---

## 8. Python Agent Worker

### 8.1 Approach: Shared Worker with Metadata-Based Routing

The existing Python LiveKit agent worker (`aura-livekit-agent`) uses metadata-based routing — it reads `conversationId`, `companionId`, `lettaAgentId` etc. from the LiveKit dispatch metadata. This means the **same worker** can serve both AURA and Anplexa calls without code changes.

The only configuration difference is the `RAILWAY_API_URL` (where call events and summaries are POSTed). Two approaches:

**Option A (Recommended): Single worker, metadata-driven backend URL**
- Add `backendUrl` field to dispatch metadata
- Python agent reads `backendUrl` from metadata to know which Railway backend to POST to
- Zero code duplication, single worker process

**Option B: Separate worker process**
- Clone `aura-livekit-agent/` as `anplexa-livekit-agent/`
- Configure different `RAILWAY_API_URL` in `.env`
- Register with same LiveKit Cloud but different agent name

For **this phase**, use **Option A** — add `backendUrl` to dispatch metadata, with the existing `RAILWAY_API_URL` as fallback. This requires a minor change in `aura_agent/config.py` and `aura_agent/memory_sync.py` to accept a per-call backend URL override.

### 8.2 Dispatch Metadata (Anplexa)

When Anplexa's backend dispatches the agent, it sends:

```json
{
  "companionId": "uuid",
  "conversationId": "uuid",
  "nsfwLevel": 0,
  "voiceId": "eleven_labs_voice_id",
  "faceId": "simli_face_id_or_null",
  "lettaAgentId": "letta_voice_agent_id",
  "companionName": "Luna",
  "userId": "uuid",
  "backendUrl": "https://api-develop-f1bc.up.railway.app"
}
```

### 8.3 Agent Worker Changes Required

1. **`aura_agent/config.py`**: Add `backendUrl` to metadata parsing, use as override for `RAILWAY_API_URL`
2. **`aura_agent/memory_sync.py`**: Accept `backend_url` parameter in `post_call_summary()` and `CallLogger`
3. **`aura_agent/call_logger.py`**: Accept `backend_url` parameter for event flush endpoint
4. **`agent.py`**: Pass `backendUrl` from metadata through to companion agent and call logger

---

## 9. Infrastructure Configuration

### 9.1 New Environment Variables (Railway API)

Add to `packages/config/src/env.ts` and Railway service environment:

```bash
# LiveKit
LIVEKIT_URL=wss://aurapoc-ny8qqa3y.livekit.cloud
LIVEKIT_API_KEY=<your-livekit-api-key>
LIVEKIT_API_SECRET=<your-livekit-api-secret>
INTERNAL_API_KEY=<your-internal-api-key>

# Redis
REDIS_URL=<Railway Redis connection URL>

# AWS S3
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_S3_BUCKET_NAME=DO_NOT_DELETE_OR_TOUCH_BBR_1
AWS_REGION=us-east-1
```

The following keys are already configured or referenced in the existing env:
- `LETTA_API_URL`, `LETTA_API_KEY` — already in env
- `ANTHROPIC_API_KEY` — already in env
- `OLLAMA_BASE_URL`, `OLLAMA_API_KEY` — already in env
- `DATABASE_URL` — already in env

### 9.2 LiveKit Cloud Dashboard Configuration

- **Webhook URL**: `https://api-develop-f1bc.up.railway.app/api/voice/livekit/webhooks`
- **Named Agent**: `aura-companion` (already registered by existing Python worker)

### 9.3 Redis Setup

The Redis instance already exists on Railway (`anplexa-dev` project). Use the provided connection URL for:
- Rate limiting (keys: `anplexa:rate:{userId}:{date}`)
- Optional caching (agent config, companion voices)

---

## 10. Verification Approach

### 10.1 Build Verification

```bash
# Full monorepo build (must pass)
pnpm build

# TypeScript type checking
pnpm run lint
```

### 10.2 Unit Tests

| Component | Test File | Key Assertions |
|-----------|-----------|----------------|
| AstrologyBlockBuilder | `packages/services/src/letta/__tests__/AstrologyBlockBuilder.test.ts` | Correct block format, character limits, missing data handling |
| CompanionBlockBuilder | `packages/services/src/letta/__tests__/CompanionBlockBuilder.test.ts` | Persona section format, astrology awareness inclusion |
| ChatActionStreamFilter | `packages/services/src/letta/__tests__/ChatActionStreamFilter.test.ts` | Think block stripping, action filtering, voice mode zero-latency |
| RateLimitService | `packages/services/src/rate-limit/__tests__/RateLimitService.test.ts` | Free user limit enforcement, subscriber bypass, daily reset |
| RouteToAgentUseCase | `packages/core/src/use-cases/chat/__tests__/RouteToAgentUseCase.test.ts` | Fast path resolution, fallback chain, auto-provisioning |

### 10.3 Integration Tests

| Test | Scope | Method |
|------|-------|--------|
| SSE streaming | Chat send endpoint → LettaGateway mock → SSE events | E2E with supertest |
| LiveKit token | Token endpoint → LiveKit SDK → valid JWT returned | E2E with supertest |
| Rate limiting | Redis mock → 5 messages allowed → 6th rejected | Unit with mock Redis |
| Agent provisioning | Full flow: astrology data → block building → Letta mock → DB persist | Integration |
| Database migrations | All new tables created, existing tables extended | Migration up + down |

### 10.4 Manual Verification Checklist

- [ ] User completes onboarding → Letta agent created with astrology-derived blocks
- [ ] Chat message streams correctly with activity indicators
- [ ] Free user hits 5 message/day limit → rate limit error
- [ ] Voice call: token generated → room created → agent dispatched → user hears response
- [ ] Video call: Simli avatar renders alongside voice
- [ ] Post-call: transcript persisted, memory blocks updated
- [ ] Conversation list loads, history paginates
- [ ] Companion regeneration updates existing agent (no duplicate)

---

## 11. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Letta server on Vast.ai is shared with AURA | Agent/block namespace collision | Use Anplexa-specific metadata tags on all agents; namespace agent names with `anplexa-` prefix |
| Python agent serves both apps | Incorrect backend URL for call events | Metadata-driven `backendUrl` with fallback to configured URL |
| ElevenLabs TTS model constraint | `eleven_v3` breaks WebSocket streaming | Hardcode `eleven_turbo_v2_5` in companion_voices table defaults |
| Redis rate limit clock skew | Users get more/fewer messages | Use server-side UTC date, not client time |
| LiveKit room name collision | Two users get same room | Include timestamp + conversationId in room name: `anplexa-call-{convId}-{Date.now()}` |
| Drizzle migration on production DB | Data loss or schema conflict | Test migrations against staging first; use additive-only changes (no column drops) |

---

## 12. Dependencies to Install

### Backend (packages/services)

```bash
pnpm add livekit-server-sdk ioredis
```

### Frontend (apps/companions)

```bash
pnpm add livekit-client @livekit/components-react zustand
```

### Python Agent (aura-livekit-agent)

No changes needed — existing `requirements.txt` covers all dependencies.
