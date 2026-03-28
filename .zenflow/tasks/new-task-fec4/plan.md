# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 9ebb0f6b-3255-43b1-93a3-48813761d57c -->

Create a Product Requirements Document (PRD) based on the feature description.

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

Save to `{@artifacts_path}/spec.md`.

### [x] Step: Planning

Implementation plan created. See steps below.

### [ ] Step 1: Environment Config & New Dependencies

Add new environment variables and install required npm packages. This is the foundation that all subsequent steps depend on.

**Tasks:**
- [ ] Update `packages/config/src/env.ts`: Add Zod-validated vars for `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `INTERNAL_API_KEY`, `REDIS_URL`, `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY`, `SIMLI_API_KEY`. All optional with sensible defaults (no env required for dev builds).
- [ ] Install backend deps: `pnpm add livekit-server-sdk ioredis --filter @anplexa/services`
- [ ] Install frontend deps: `pnpm add livekit-client @livekit/components-react --filter companions`
- [ ] Verify `pnpm build` still passes after changes

**Files to modify:**
- `packages/config/src/env.ts`
- `packages/services/package.json`
- `apps/companions/package.json`

**Verification:** `pnpm build` succeeds. No TypeScript errors.

### [ ] Step 2: Database Schema Extensions & Migrations

Add new columns to existing tables and create new tables required for voice/video calls.

**Tasks:**
- [ ] Extend `conversations` table: add `voiceAgentId` column (`text('voice_agent_id')`)
- [ ] Extend `messages` table: add `source` (text, default 'chat'), `audioUrl` (text), `audioTranscript` (text), `tokenCount` (integer)
- [ ] Create `companionVoices` table (id, companionPersonaId FK, voiceId, voiceName, gender, simliFaceId, ttsModel, enabled, createdAt)
- [ ] Create `voiceCallMetadata` table (id, conversationId FK, userId FK, roomName, provider, callStatus, hasVideo, durationSeconds, messageCount, memorySynced, startedAt, endedAt, createdAt)
- [ ] Create `livekitAgentConfig` table (key PK, value JSON, updatedAt, updatedBy)
- [ ] Create `livekitCallEvents` table (id, roomName, roomSid, conversationId, userId, companionId, sessionId, eventType, eventName, level, source, metadata, latencyMs, createdAt)
- [ ] Create `chatDebugLogs` table (id, category, event, conversationId, message, metadata, createdAt)
- [ ] Add Drizzle relations for new tables (companionVoicesRelations, voiceCallMetadataRelations)
- [ ] Export new types from schema
- [ ] Generate Drizzle migration: `pnpm drizzle-kit generate`

**Files to modify:**
- `packages/database/src/schema/postgres.ts`

**Verification:** `pnpm build` succeeds. Migration SQL generated correctly. Schema types exported.

### [ ] Step 3: Contracts & Shared Types

Define the API contracts (request/response DTOs and Zod schemas) that backend and frontend will share.

**Tasks:**
- [ ] Add voice types to `packages/contracts/src/`: `LiveKitTokenRequest`, `LiveKitTokenResponse`, `LiveKitConfigResponse`, `CallEventDTO`, `CallSummaryRequest`
- [ ] Enhance existing chat SSE event types: add `activity` event with `status: 'thinking' | 'tool_call' | 'tool_return' | 'responding'`, add `start` event, enhance `done` event with `tokenCount`
- [ ] Add `MessageSource` type: `'chat' | 'voice_call' | 'video_call'`
- [ ] Add rate limit error contract: `RateLimitErrorResponse` with `remaining`, `resetAt`

**Files to create/modify:**
- `packages/contracts/src/voice.ts` (new)
- `packages/contracts/src/livekit-events.ts` (new)
- `packages/contracts/src/chat.ts` (modify — add activity event types)
- `packages/contracts/src/index.ts` (re-export)

**Verification:** `pnpm build` succeeds. Types compile cleanly.

### [ ] Step 4: Core Domain — Interfaces & Use Cases

Define domain-layer interfaces for new services and the RouteToAgentUseCase.

**Tasks:**
- [ ] Create `ILiveKitService` interface in `packages/core/src/domain/services/` — methods: `generateToken()`, `createRoom()`, `dispatchAgent()`, `verifyWebhookSignature()`
- [ ] Create `IRateLimitService` interface — methods: `checkAndIncrement()`, `getRemaining()`
- [ ] Create `RouteToAgentUseCase` in `packages/core/src/use-cases/chat/` — agent resolution chain: DB fast path → Letta metadata fallback → auto-provision
- [ ] Create `ProvisionChatAgentUseCase` in `packages/core/src/use-cases/chat/` — orchestrates end-of-onboarding agent creation with astrology blocks
- [ ] Create companion voice repository interface `ICompanionVoiceRepository`
- [ ] Create voice call metadata repository interface `IVoiceCallMetadataRepository`
- [ ] Wire new use cases into `createAllUseCases` factory

**Files to create:**
- `packages/core/src/domain/services/ILiveKitService.ts`
- `packages/core/src/domain/services/IRateLimitService.ts`
- `packages/core/src/use-cases/chat/RouteToAgentUseCase.ts`
- `packages/core/src/use-cases/chat/ProvisionChatAgentUseCase.ts`

**Files to modify:**
- `packages/core/src/use-cases/index.ts` (add new use cases)
- `packages/core/src/domain/repositories/` (add new repo interfaces)

**Verification:** `pnpm build` succeeds. Interface contracts match spec.md Section 6.6 and 5.3.

### [ ] Step 5: Repository Implementations

Implement Drizzle ORM repositories for new tables.

**Tasks:**
- [ ] Create `CompanionVoiceRepository` — CRUD for companion_voices table, `findByPersonaId()`, `findEnabled()`
- [ ] Create `VoiceCallMetadataRepository` — CRUD for voice_call_metadata, `findByConversation()`, `updateCallStatus()`
- [ ] Create `LiveKitAgentConfigRepository` — `getAll()`, `getByKey()`, `upsert()`
- [ ] Create `LiveKitCallEventRepository` — `insertBatch()`, `findByRoom()`
- [ ] Create `ChatDebugLogRepository` — `insert()`, `findByConversation()`

**Files to create:**
- `packages/repositories/src/CompanionVoiceRepository.ts`
- `packages/repositories/src/VoiceCallMetadataRepository.ts`
- `packages/repositories/src/LiveKitAgentConfigRepository.ts`
- `packages/repositories/src/LiveKitCallEventRepository.ts`
- `packages/repositories/src/ChatDebugLogRepository.ts`

**Verification:** `pnpm build` succeeds. Repositories type-check against interfaces.

### [ ] Step 6: Astrology Block Builders

Create services that convert astrology assessment output into Letta memory block content. This bridges the onboarding flow to the chat system.

**Tasks:**
- [ ] Create `AstrologyBlockBuilder` service:
  - `buildHumanBlock(traitProfile, birthChart, userName?)` → string (max 3000 chars)
  - `buildUserModelBlock(traitProfile, birthChart, userName?)` → string (max 3000 chars)
  - Formats: ASTROLOGICAL PROFILE (Sun/Moon/Rising), DOMINANT TRAITS, PERSONALITY SUMMARY, KNOWN FACTS
- [ ] Create `CompanionBlockBuilder` service:
  - `buildPersonaBlock(companionPersona, traitProfile)` → string (max 4000 chars)
  - Formats: IDENTITY, PERSONALITY, COMMUNICATION STYLE, EMOTIONAL APPROACH, ASTROLOGICAL AWARENESS
- [ ] Write unit tests for both builders (correct format, char limits, graceful handling of missing fields)

**Files to create:**
- `packages/services/src/letta/AstrologyBlockBuilder.ts`
- `packages/services/src/letta/CompanionBlockBuilder.ts`
- `packages/services/src/letta/__tests__/AstrologyBlockBuilder.test.ts`
- `packages/services/src/letta/__tests__/CompanionBlockBuilder.test.ts`

**Reference:** spec.md Section 6.1, 6.2. requirements.md Section 3.4.

**Verification:** `pnpm test` passes. Blocks respect character limits. Handles null/missing trait data gracefully.

### [ ] Step 7: ChatActionStreamFilter

Port the streaming text filter from Letta-Lonely that cleans LLM output for display.

**Tasks:**
- [ ] Port `ChatActionStreamFilter` class with two modes: `text` and `voice`
  - Text mode: buffers potential `*action*` patterns, strips `<think>` blocks
  - Voice mode: zero-latency, strips all formatting immediately
- [ ] Port standalone sanitization functions: `sanitizeAssistantOutput()`, `sanitizeForChat()`, `sanitizeForTTS()`, `stripThinkBlocks()`
- [ ] Write unit tests covering: think block stripping, action pattern filtering, voice mode zero-latency, flush behavior

**Files to create:**
- `packages/services/src/letta/ChatActionStreamFilter.ts`
- `packages/services/src/letta/__tests__/ChatActionStreamFilter.test.ts`

**Reference:** Letta-Lonely `src/letta/ChatActionStreamFilter.ts`. spec.md Section 6.5.

**Verification:** `pnpm test` passes. Both modes produce expected output for known input patterns.

### [ ] Step 8: RateLimitService

Implement Redis-backed rate limiting for free tier users (5 messages/day).

**Tasks:**
- [ ] Create `RateLimitService` implementing `IRateLimitService`:
  - `checkAndIncrement(userId, isSubscribed)` → `{ remaining: number }` or throws
  - `getRemaining(userId, isSubscribed)` → number
  - Key format: `anplexa:rate:{userId}:{YYYY-MM-DD}`, expires at midnight UTC
  - Subscribed users: always returns unlimited (no Redis call)
- [ ] Create `rateLimitMiddleware` Express middleware for chat routes
- [ ] Write unit tests with mock Redis

**Files to create:**
- `packages/services/src/rate-limit/RateLimitService.ts`
- `apps/api/src/middleware/rateLimitMiddleware.ts`
- `packages/services/src/rate-limit/__tests__/RateLimitService.test.ts`

**Reference:** spec.md Section 6.4. requirements.md Section 3.8.

**Verification:** `pnpm test` passes. Free user blocked after 5 messages. Subscriber bypasses limit.

### [ ] Step 9: LiveKitService

Implement the LiveKit integration service for token generation, room creation, and agent dispatch.

**Tasks:**
- [ ] Create `LiveKitService` implementing `ILiveKitService`:
  - `generateToken(identity, roomName, metadata?)` → JWT string
  - `createRoom(roomName, metadata)` → void
  - `dispatchAgent(roomName, agentName, metadata)` → void
  - `verifyWebhookSignature(body, signature)` → boolean
  - Uses `livekit-server-sdk`: `AccessToken`, `RoomServiceClient`, `AgentDispatchClient`
- [ ] Create `CallEventService` for persisting call lifecycle events:
  - `insertEvents(events[])` → void
  - `updateCallStatus(roomName, status, metadata?)` → void

**Files to create:**
- `packages/services/src/livekit/LiveKitService.ts`
- `packages/services/src/livekit/CallEventService.ts`
- `packages/services/src/livekit/types.ts`

**Reference:** spec.md Section 6.3. Letta-Lonely `src/routes/livekit/livekitRoutes.ts`.

**Verification:** `pnpm build` succeeds. Service compiles. Token generation produces valid JWT.

### [ ] Step 10: Extend LettaGateway & AgentProvisioner

Extend existing Letta services with methods needed for voice agent support and astrology integration.

**Tasks:**
- [ ] Add to `LettaGateway`:
  - `getAgentSystemPrompt(agentId)` → string
  - `getAgentMemoryBlockByLabel(agentId, label)` → MemoryBlock | null
  - `deleteRecentMessages(agentId, count)` → void
- [ ] Extend `AgentProvisioner.provisionCompanionAgent()`:
  - Accept optional `astrologyBlocks` parameter (human block, user_model block content from AstrologyBlockBuilder)
  - Create paired voice agent (with sleeptime configuration) when `createVoiceAgent: true`
  - Accept `personaBlock` override from CompanionBlockBuilder
- [ ] Extend `CognitiveBlockFactory`:
  - Accept optional initial `userModel` content (from astrology data) instead of empty default
- [ ] Extend `PersonaBuilder`:
  - Add ASTROLOGICAL AWARENESS section to persona text

**Files to modify:**
- `packages/services/src/letta/LettaGateway.ts`
- `packages/services/src/letta/AgentProvisioner.ts`
- `packages/services/src/letta/CognitiveBlockFactory.ts`
- `packages/services/src/letta/PersonaBuilder.ts`

**Reference:** spec.md Section 2.1, 2.2.

**Verification:** `pnpm build` succeeds. Existing tests still pass.

### [ ] Step 11: DI Container & API Middleware Registration

Wire all new services into the Awilix DI container and create new middleware.

**Tasks:**
- [ ] Register in `apps/api/src/container.ts`:
  - `Redis` client (from `REDIS_URL`)
  - `LiveKitService` (from LIVEKIT env vars)
  - `CallEventService`
  - `RateLimitService`
  - `AstrologyBlockBuilder`
  - `CompanionBlockBuilder`
  - New repositories: `CompanionVoiceRepository`, `VoiceCallMetadataRepository`, `LiveKitAgentConfigRepository`, `LiveKitCallEventRepository`
  - New use cases: `RouteToAgentUseCase`, `ProvisionChatAgentUseCase`
- [ ] Create `internalApiKeyMiddleware` — validates `x-internal-api-key` header against `INTERNAL_API_KEY` env var
- [ ] Update `AppContainer` interface with new service types

**Files to modify:**
- `apps/api/src/container.ts`

**Files to create:**
- `apps/api/src/middleware/internalApiKeyMiddleware.ts`

**Verification:** `pnpm build` succeeds. Container resolves all new dependencies without errors.

### [ ] Step 12: Enhanced Chat Routes (SSE + Rate Limiting + Action Filter)

Enhance the existing chat send endpoint with the ChatActionStreamFilter, rate limiting, and required auth.

**Tasks:**
- [ ] Refactor `apps/api/src/routes/chat/send.ts`:
  - Change from `optionalAuthMiddleware` to `authMiddleware` (no more guest access)
  - Integrate `ChatActionStreamFilter` (text mode) into streaming pipeline
  - Add rate limit check before streaming (via `RateLimitService`)
  - Use `RouteToAgentUseCase` for agent resolution instead of inline logic
  - Add `start` SSE event at beginning, `activity` events from filter, `done` event with tokenCount
  - Persist user message and assistant response to messages table with `source: 'chat'`
- [ ] Enhance `apps/api/src/routes/chat/conversations.ts`:
  - Add `DELETE /conversations/:id` endpoint
  - Add `source` field to message DTOs
  - Add `POST /conversations/:id/call-summary` endpoint (internal API key auth) for Python agent post-call transcript storage
- [ ] Update `apps/api/src/routes/chat/index.ts`: change auth to `authMiddleware` (required)
- [ ] Add `GET /api/chat/agents/:conversationId/memory` — read Letta memory blocks
- [ ] Add `PATCH /api/chat/agents/:conversationId/memory/:blockId` — update memory block

**Files to modify:**
- `apps/api/src/routes/chat/send.ts`
- `apps/api/src/routes/chat/conversations.ts`
- `apps/api/src/routes/chat/index.ts`

**Reference:** spec.md Section 5.1. requirements.md Section 3.1.

**Verification:** `pnpm build` succeeds. SSE stream produces start → activity → token → done events.

### [ ] Step 13: LiveKit Voice/Video Routes

Create the LiveKit voice endpoint group for token generation, agent dispatch, config management, event logging, and webhooks.

**Tasks:**
- [ ] Create `apps/api/src/routes/voice/livekit.ts` with endpoints:
  - `POST /api/voice/livekit/token` (JWT auth): validate user owns conversation, resolve companion voice from DB, resolve/create voice agent, build dispatch metadata (with `backendUrl`), generate token, create room, dispatch agent, return `{ token, roomName, wsUrl }`
  - `GET /api/voice/livekit/status` (JWT auth): health check (LiveKit reachable)
  - `GET /api/voice/livekit/config` (internal API key): return pipeline config from `livekitAgentConfig` table
  - `PUT /api/voice/livekit/config/:key` (admin auth): update pipeline config entry
  - `POST /api/voice/livekit/events` (internal API key): batch insert call events from Python agent
  - `POST /api/voice/livekit/webhooks` (LiveKit signature): handle room_started, room_finished, participant events
- [ ] Create `apps/api/src/routes/voice/index.ts` barrel
- [ ] Mount `/api/voice` in `apps/api/src/app.ts`

**Files to create:**
- `apps/api/src/routes/voice/livekit.ts`
- `apps/api/src/routes/voice/index.ts`

**Files to modify:**
- `apps/api/src/app.ts`

**Reference:** spec.md Section 5.2. requirements.md Sections 3.2, 3.6. Letta-Lonely `src/routes/livekit/livekitRoutes.ts`.

**Verification:** `pnpm build` succeeds. Token endpoint returns valid LiveKit JWT.

### [ ] Step 14: Companion Provisioning Integration (Onboarding Exit)

Connect the end of the astrology onboarding flow to Letta agent provisioning so users enter chat immediately after onboarding.

**Tasks:**
- [ ] Create `POST /api/companion/provision` endpoint (JWT auth):
  - Accepts `companionPersonaId` + `birthChartId`
  - Fetches CompanionPersona and BirthChart from DB
  - Calls `AstrologyBlockBuilder.buildHumanBlock()` and `buildUserModelBlock()`
  - Calls `CompanionBlockBuilder.buildPersonaBlock()`
  - Calls `AgentProvisioner.provisionCompanionAgent()` with astrology block content
  - Creates conversation record linked to new agent
  - Returns `{ conversationId, lettaAgentId, companionPersonaId }`
- [ ] Ensure companion regeneration updates existing agent blocks (not create new agent) — `AgentProvisioner` needs `updateExistingAgent()` method or similar

**Files to modify:**
- `apps/api/src/routes/companion/generate.ts` (or create provision.ts)
- `apps/api/src/routes/companion/index.ts`

**Reference:** spec.md Section 5.3. requirements.md Sections 2.1, 3.5.

**Verification:** `pnpm build` succeeds. End-to-end: provision endpoint creates agent with astrology blocks.

### [ ] Step 15: Frontend Chat Store (Zustand)

Create a Zustand store for centralized chat state management, replacing the current inline state in ChatInterface.

**Tasks:**
- [ ] Create `chatStore` with state: `messages`, `isSending`, `isStreaming`, `currentConversationId`, `agentActivity`, `streamStartTime`, `error`
- [ ] Create actions: `sendMessage()` (calls /api/chat/send, parses SSE stream), `loadConversation()`, `loadHistory()`, `createConversation()`
- [ ] Create `useChat` hook wrapping the store for component-level convenience
- [ ] Create enhanced SSE parser in `lib/sse-parser.ts` supporting `start`, `activity`, `token`, `done`, `error` event types

**Files to create:**
- `apps/companions/src/stores/chatStore.ts`
- `apps/companions/src/hooks/useChat.ts`

**Files to modify:**
- `apps/companions/src/lib/sse-parser.ts` (if exists, or create new)

**Reference:** spec.md Section 7.1, 7.3.

**Verification:** `pnpm build` succeeds. Store handles SSE streaming lifecycle correctly.

### [ ] Step 16: Frontend Chat UI Enhancement

Enhance the existing ChatInterface with streaming message display, agent activity indicators, and conversation management.

**Tasks:**
- [ ] Refactor `ChatInterface.tsx` to use the new `chatStore`
- [ ] Create `StreamingMessage.tsx` component — progressive character-by-character rendering
- [ ] Create `AgentActivityIndicator.tsx` — shows thinking/tool_call/responding status
- [ ] Create `ConversationList.tsx` — sidebar listing user's conversations
- [ ] Enhance `MessageBubble.tsx` (or create if doesn't exist) — styled message display with role, timestamp, source indicator
- [ ] Ensure chat requires auth (redirect to login if not authenticated)
- [ ] Integrate companion provisioning: after onboarding completion, call `/api/companion/provision` then redirect to chat

**Files to modify:**
- `apps/companions/src/components/ChatInterface.tsx`

**Files to create:**
- `apps/companions/src/components/chat/StreamingMessage.tsx`
- `apps/companions/src/components/chat/AgentActivityIndicator.tsx`
- `apps/companions/src/components/chat/ConversationList.tsx`
- `apps/companions/src/components/chat/MessageBubble.tsx`

**Reference:** spec.md Section 7.

**Verification:** `pnpm build` succeeds. Chat renders streaming messages with activity indicators.

### [ ] Step 17: Frontend LiveKit Voice/Video Call UI

Add voice and video call capabilities to the chat interface using the LiveKit SDK.

**Tasks:**
- [ ] Create `useLiveKit` hook: `startCall()`, `endCall()`, `toggleMute()`, connection state management, call duration timer
- [ ] Create `CallButton.tsx` — phone icon in chat UI, triggers token request + LiveKit room connection
- [ ] Create `InCallModal.tsx` — full-screen/overlay call UI with visual indicators (speaking, listening)
- [ ] Create `VideoDisplay.tsx` — renders Simli avatar video track from LiveKit
- [ ] Create `CallControls.tsx` — mute, hang up, toggle video buttons
- [ ] Create `livekit-client.ts` wrapper — abstracts LiveKit Room connection, track management
- [ ] Integrate call components into ChatInterface

**Files to create:**
- `apps/companions/src/hooks/useLiveKit.ts`
- `apps/companions/src/components/voice/CallButton.tsx`
- `apps/companions/src/components/voice/InCallModal.tsx`
- `apps/companions/src/components/voice/VideoDisplay.tsx`
- `apps/companions/src/components/voice/CallControls.tsx`
- `apps/companions/src/lib/livekit-client.ts`

**Reference:** spec.md Section 7.2. Letta-Lonely `client/src/features/chat/components/CallMeButton.tsx`, `InCallModal.tsx`.

**Verification:** `pnpm build` succeeds. Call button visible in chat. LiveKit SDK imported without errors.

### [ ] Step 18: Python Agent Worker Configuration

Configure the shared Python LiveKit agent worker on Vast.ai to serve Anplexa calls via metadata-based routing.

**Tasks:**
- [ ] Verify Python agent worker is running on Vast.ai PRO 6000 S at `194.228.55.129`
- [ ] Add `backendUrl` field to agent metadata parsing in `aura_agent/config.py`
- [ ] Update `aura_agent/memory_sync.py` to accept per-call `backend_url` override (defaults to `RAILWAY_API_URL`)
- [ ] Update `aura_agent/call_logger.py` to use metadata-driven backend URL
- [ ] Update `agent.py` to pass `backendUrl` through dispatch metadata to companion agent and call logger
- [ ] Test: dispatch an agent to a LiveKit room with Anplexa metadata, verify it posts events to Anplexa Railway backend

**Files to modify (on Vast.ai):**
- `aura-livekit-agent/aura_agent/config.py`
- `aura-livekit-agent/aura_agent/memory_sync.py`
- `aura-livekit-agent/aura_agent/call_logger.py`
- `aura-livekit-agent/agent.py`

**Reference:** spec.md Section 8. requirements.md Section 5.4.

**Verification:** Python agent starts without errors. Accepts dispatch with `backendUrl` in metadata.

### [ ] Step 19: Infrastructure & Deployment Configuration

Configure Railway environment variables, verify network connectivity to Vast.ai services, and set up LiveKit webhook.

**Tasks:**
- [ ] Set all environment variables on Railway `anplexa-dev` service (per requirements.md Section 5.3)
- [ ] Verify Railway API can reach Letta server: `curl http://194.228.55.129:39967/v1/health`
- [ ] Verify Railway API can reach Ollama: `curl http://194.228.55.129:39967/ollama/v1/models`
- [ ] Verify Redis instance is accessible on Railway
- [ ] Configure LiveKit Cloud webhook URL: `https://api-develop-f1bc.up.railway.app/api/voice/livekit/webhooks`
- [ ] Run database migrations on Railway PostgreSQL
- [ ] Seed `livekitAgentConfig` table with initial pipeline config (STT model, TTS model, LLM model settings)
- [ ] Seed `companionVoices` table with initial curated voice pool (placeholder voice IDs — to be finalized with actual ElevenLabs voices)
- [ ] Verify S3 bucket `DO_NOT_DELETE_OR_TOUCH_BBR_1` is accessible

**Verification:** All services reachable from Railway. Migrations run successfully. Config seeded.

### [ ] Step 20: End-to-End Integration Testing & Verification

Full integration testing of the complete flow: onboarding → agent provisioning → text chat → voice call → memory persistence.

**Tasks:**
- [ ] Test: User completes onboarding → Letta agent created with astrology-derived human/persona blocks
- [ ] Test: Send text message → SSE stream with start/activity/token/done events → message persisted
- [ ] Test: Free user sends 5 messages → 6th message rate-limited
- [ ] Test: Voice call → LiveKit token generated → room created → agent dispatched → user hears response
- [ ] Test: Video call (with Simli face configured) → avatar renders alongside voice
- [ ] Test: Post-call → transcript persisted via call-summary endpoint → memory blocks updated
- [ ] Test: Conversation list loads → history paginates → delete conversation works
- [ ] Test: Companion regeneration → existing agent blocks updated (no duplicate agent)
- [ ] Test: Memory persistence across sessions → companion recalls user's name and traits
- [ ] Run `pnpm build` — verify clean build
- [ ] Run `pnpm test` — verify all tests pass
- [ ] Run `pnpm lint` — verify no lint errors
- [ ] Deploy to Railway and verify production functionality

**Verification:** All tests pass. Full user flow works end-to-end. No TypeScript errors. No lint errors.
