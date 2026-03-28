# Product Requirements Document: Anplexa Chat Infrastructure Port

## 1. Overview

### 1.1 Problem Statement

Anplexa is an astrology-based AI companion platform with a working onboarding flow (birth chart calculation, trait analysis, companion generation) but a rudimentary chat interface. The Letta-Lonely project (AURA platform) has a mature, production-grade chat system with text chat (SSE streaming), voice/video calls (LiveKit + Deepgram STT + ElevenLabs TTS + Simli avatar), and media generation (ComfyUI) - all powered by Letta agents with sophisticated memory blocks.

The goal is to port the Letta-Lonely chat infrastructure into Anplexa so that Anplexa users get the same quality chat experience, while keeping Anplexa's own database, identity, and astrology-driven companion design.

### 1.2 Scope

**In scope:**
- Port the Letta-Lonely text chat system (SSE streaming, agent provisioning, memory blocks) into Anplexa
- Port LiveKit-based voice and video call support (Deepgram STT + ElevenLabs TTS + Simli avatar)
- Port the Python LiveKit agent worker (`aura-livekit-agent`) for Anplexa use
- Integrate astrology assessment output into Letta human memory blocks
- Generate complementary companion memory blocks from user's astrological profile
- Anplexa-specific database schema (new tables, not sharing Letta-Lonely's DB)
- Deployment on Railway (Anplexa's existing deployment target)
- Shared infrastructure: Letta server, Ollama, ComfyUI, LiveKit agent worker on existing Vast.ai GPU servers
- Limited companion pool: curated set of voices and visual companions with varying personalities
- Free tier rate limiting: 5 messages per day for free users

**Out of scope (for this phase):**
- Guest chat functionality (removed - users must authenticate)
- Scene video generation (adult content feature)
- AURA-API session sharing (Anplexa uses JWT, not shared sessions)
- Prompt version control system (admin tooling, can come later)
- Testing dashboard (admin tooling, defer)

### 1.3 Resolved Decisions

These were open questions from the initial draft, now resolved:

| # | Question | Decision |
|---|----------|----------|
| 1 | Voice architecture | **LiveKit** (not old ElevenLabs proxy). Python agent worker with Deepgram STT + ElevenLabs TTS + optional Simli avatar. ElevenLabs API key used for TTS only. |
| 2 | Voice selection | Curated pool: a few attractive female voices + a few attractive male voices. Users matched to a limited number of visual companions with varying personalities. Not fully custom per-user. |
| 3 | LLM model | **Claude** (via Anthropic API through Letta) for SFW text chat and voice. Ability to switch to **Ollama** (e.g., `qwen3.5-nsfw:27b`) when NSFW mode is introduced later. |
| 4 | Guest chat | **Removed.** No guest chat. Users must sign up to use the platform. |
| 5 | Rate limits | Free users: **5 messages per day**. Paid tier limits TBD. |
| 6 | Companion regeneration | **Update existing** Letta agent (update memory blocks), not create a new one. |
| 7 | API keys | All keys provided (see Infrastructure section). SSH access to Vast.ai available. |
| 8 | Network access | Vast.ai servers accessible from Railway. SSH available as needed. |
| 9 | S3 bucket | **New bucket**: `DO_NOT_DELETE_OR_TOUCH_BBR_1` (codename). Using existing AWS credentials. |
| 10 | Database | Existing Railway PostgreSQL instance: `Postgres-0WPo` (online, `anplexa-dev` project, `develop` environment). |

### 1.4 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Use existing Anplexa PostgreSQL on Railway (`Postgres-0WPo`) | Already running, no need for new instance |
| Use existing Redis on Railway | Available for caching, rate limiting, call mode storage |
| Shared Letta server on Vast.ai (`194.228.55.129:39967`) | Agents namespaced by metadata; no conflict between apps |
| Shared Ollama on Vast.ai (`194.228.55.129:39967/ollama`) | Same GPU server hosts models for both apps |
| LiveKit Cloud for voice/video signaling (`wss://aurapoc-ny8qqa3y.livekit.cloud`) | Shared LiveKit Cloud account; rooms namespaced by conversation ID |
| Python LiveKit agent worker on Vast.ai PRO 6000 S | Same worker can serve both AURA and Anplexa (agent resolution by metadata) |
| Claude for SFW chat, Ollama for future NSFW | Quality-first approach; cost managed by rate limits |
| JWT auth (not Passport sessions) | Anplexa already uses JWT |
| Clean Architecture preserved | Existing monorepo structure maintained |
| User's astrology data populates Letta `human` block | Birth chart traits = foundation for companion's understanding of user |
| Companion persona block generated from astrology compatibility | Complementary (not mirror) personality design |
| Limited companion pool with curated voices | Predictable quality; sexy male + female voices pre-selected |

---

## 2. User Stories

### 2.1 Astrology-to-Chat Flow

**US-1: Complete onboarding generates Letta agent**
> As a new user, after completing the astrology onboarding (birth data -> chart calculation -> trait analysis -> companion generation), I am automatically transitioned into a chat with my AI companion, which already "knows" my personality from my birth chart.

**Acceptance Criteria:**
- Onboarding completion triggers Letta agent provisioning
- The Letta agent's `human` block contains a summary of the user's astrological profile (Sun/Moon/Rising, dominant traits, element, modality)
- The Letta agent's `persona` block contains the companion's personality, built to complement the user's chart
- The Letta agent's `user_model` block is initialized with the user's name and key trait information
- Chat loads immediately after onboarding with no additional setup required
- The companion's first message references something about the user's astrological profile

**US-2: Astrology traits inform ongoing conversations**
> As a user chatting with my companion, the companion references my astrological traits naturally in conversation.

**Acceptance Criteria:**
- The `human` block includes astrological context the Letta agent can reference
- The companion's system prompt instructs it to weave astrological awareness into conversation naturally (not forced)
- The `user_model` block evolves over time as the agent learns more beyond the chart

### 2.2 Text Chat

**US-3: Real-time streaming chat**
> As a user, I can send text messages and see the companion's response stream character-by-character.

**Acceptance Criteria:**
- Messages sent via POST endpoint, response streamed via SSE
- Frontend renders response progressively (character-by-character)
- "Thinking" indicator shown while waiting for first token
- Messages persisted to Anplexa's database
- Conversation history loadable from database
- Error states handled: network failure, stream interruption, timeout
- Free users limited to 5 messages per day

**US-4: Conversation management**
> As a user, I can manage multiple conversations, create new ones, view history, and delete old conversations.

**Acceptance Criteria:**
- List all conversations for the authenticated user
- Create new conversation (provisions new Letta agent or reuses existing)
- Load message history for a conversation
- Delete a conversation (and associated Letta agent)
- Conversations scoped to user (no cross-user data leakage)

**US-5: Memory persistence across sessions**
> As a user, my companion remembers things I've told it across different chat sessions.

**Acceptance Criteria:**
- Letta's memory block system persists across sessions
- The companion can recall user's name, preferences, past topics
- Memory blocks updated during conversation by Letta's built-in memory tools
- Archival memory stores significant moments/milestones

### 2.3 Voice & Video Calls (LiveKit)

**US-6: Voice call with companion**
> As a user, I can initiate a voice call with my companion and have a natural spoken conversation.

**Acceptance Criteria:**
- "Call" button in chat interface requests a LiveKit token from the backend
- Backend creates LiveKit room, dispatches Python agent worker
- Deepgram STT transcribes user speech in real-time
- LLM generates response (Claude for SFW)
- ElevenLabs TTS speaks the response with the companion's assigned voice
- Silero VAD detects voice activity for turn-taking
- Call transcript synced to conversation history via memory sync
- Post-call memory sync persists learned user information to Letta blocks

**US-7: Video call with companion avatar**
> As a user, I can initiate a video call where I see an animated avatar of my companion responding to me.

**Acceptance Criteria:**
- Video call option available when companion has a Simli face ID configured
- Simli avatar renders lip-synced video from the TTS audio stream
- Avatar displayed in the call UI alongside audio
- Graceful fallback to audio-only if Simli unavailable

**US-8: Seamless chat/voice switching**
> As a user, I can switch between text chat and voice calls within the same conversation.

**Acceptance Criteria:**
- Voice calls use the same Letta agent as text chat (voice agent variant with sleeptime)
- Memory blocks shared between text and voice modes
- Post-call memory sync ensures voice conversation context available in next text chat
- Message source tracked (`chat` vs `voice_call`) for display purposes
- Mid-call memory sync refreshes blocks every 20 turns

---

## 3. Functional Requirements

### 3.1 Chat API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/chat/send` | POST | JWT | Send message to Letta agent, receive SSE stream |
| `/api/chat/conversations` | GET | JWT | List user's conversations |
| `/api/chat/conversations` | POST | JWT | Create new conversation |
| `/api/chat/conversations/:id` | GET | JWT | Get conversation with messages |
| `/api/chat/conversations/:id` | DELETE | JWT | Delete conversation |
| `/api/chat/conversations/:id/messages` | GET | JWT | Paginated message history |
| `/api/chat/agents/:conversationId/memory` | GET | JWT | Read Letta memory blocks |
| `/api/chat/agents/:conversationId/memory/:blockId` | PATCH | JWT | Update memory block |

### 3.2 LiveKit Voice/Video Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/voice/livekit/token` | POST | JWT | Generate LiveKit token, create room, dispatch agent |
| `/api/voice/livekit/status` | GET | JWT | LiveKit health check |
| `/api/voice/livekit/config` | GET | Internal API key | Pipeline config for Python agent |
| `/api/voice/livekit/config/:key` | PUT | Admin | Update pipeline config |
| `/api/voice/livekit/events` | POST | Internal API key | Batch call events from Python agent |
| `/api/voice/livekit/webhooks` | POST | LiveKit signature | Room lifecycle webhooks |

### 3.3 Agent Provisioning Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/companion/provision` | POST | JWT | Provision Letta agent for companion |
| `/api/companion/:id` | GET | JWT | Get companion details |

### 3.4 Letta Agent Memory Block Structure (Anplexa-specific)

For each user-companion pair, the following Letta memory blocks are created:

#### `persona` block (4000 char limit)
The companion's identity and personality. Built from `GenerateCompanionPersonaUseCase` output + astrological compatibility analysis.

```
IDENTITY:
I am {name}, your astrological companion. I was born from the cosmic alignment
of your birth chart - designed to complement your {dominant_element} energy with
my {companion_element} perspective.

PERSONALITY:
{personalityTraits from CompanionPersona}

COMMUNICATION STYLE:
{communicationStyle from CompanionPersona - tone, formality, detail level}

EMOTIONAL APPROACH:
{emotionalApproach from CompanionPersona - support style, boundaries}

ASTROLOGICAL AWARENESS:
I understand astrology deeply and can help you explore how your chart influences
your daily life. I weave astrological insights naturally into our conversations
when relevant, but I'm not limited to astrology - I'm your full companion.
```

#### `human` block (3000 char limit)
The user's profile, initially populated from astrology assessment and enriched over time.

```
ASTROLOGICAL PROFILE:
- Sun in {sign} ({element}, {modality}): {enriched_trait_description}
- Moon in {sign}: {enriched_trait_description}
- Rising in {sign}: {enriched_trait_description}
- Dominant element: {element} ({percentage}%)
- Dominant modality: {modality}

DOMINANT TRAITS (from trait analysis):
{top 3-5 traits with strength scores and descriptions}

PERSONALITY SUMMARY:
{AI-generated personality summary from AnalyzeChartPersonalityUseCase}

KNOWN FACTS:
{name}, {age if provided}
{Initially sparse, grows as agent learns through conversation}
```

#### `current_focus` block (2000 char limit)
What's happening in the current conversation. Updated by Letta during chat.

#### `user_model` block (3000 char limit)
Evolving understanding of the user. Initialized from astrology, grows from conversation.

```
INITIAL UNDERSTANDING (from birth chart):
{user_name} has a {element}-dominant chart suggesting they value {element_traits}.
Their Sun-Moon combination ({sun_sign}/{moon_sign}) indicates {interpretation}.
Communication style: {mercury_sign interpretation}
Relationship approach: {venus_sign interpretation}

LEARNED PREFERENCES:
{Updated by Letta during conversations}

BOUNDARIES:
{Updated by Letta as it learns what the user is comfortable with}
```

#### `active_goals` block (2000 char limit)
Relationship progression goals for the companion.

```
CURRENT PHASE: Initial Connection
GOALS:
1. Make {user_name} feel understood through astrological resonance
2. Demonstrate awareness of their chart traits in natural conversation
3. Build rapport through genuine curiosity about their life beyond astrology
4. Transition from astrology-focused to holistic companion relationship

NEXT PHASE: Deepening Trust
```

### 3.5 Astrology-to-Blocks Data Pipeline

```
1. User completes onboarding
   |- BirthData collected (date, time, location)
   |- BirthChart calculated (SimplifiedAstrologyService)
   |- TraitProfile extracted (AnalyzeChartPersonalityUseCase)
   |   |- 8-15 TraitVisualization objects with strength scores
   |   |- personalitySummary (AI-generated)
   |   |- elementalNarrative (AI-generated)
   |   '- dominantTraits (top 3-5)
   '- CompanionPersona generated (GenerateCompanionPersonaUseCase)
       |- name, personalityTraits, communicationStyle
       |- emotionalApproach
       '- systemPrompt (50-10000 chars)

2. Agent Provisioning triggered
   |- Build `persona` block from CompanionPersona
   |- Build `human` block from TraitProfile + BirthChart
   |- Build `user_model` block from chart interpretation
   |- Initialize `current_focus` block (empty)
   |- Initialize `active_goals` block (relationship progression)
   |- Construct system prompt with cognitive instructions
   '- Create Letta agent via LettaGateway

3. Chat begins
   '- User's first message routed to provisioned Letta agent
```

### 3.6 Voice/Video Call Flow (LiveKit Architecture)

```
1. User clicks "Call" (or "Video Call") in chat UI

2. Frontend: POST /api/voice/livekit/token
   Body: { conversationId, companionId, nsfwLevel: 0, enableVideo?: true }

3. Backend (livekitRoutes.ts):
   a. Resolve companion data (name, voice ID, Simli face ID)
   b. Resolve or create Letta agent pair via RouteToAgentUseCase
   c. Ensure VoiceAgent exists (with sleeptime for async memory processing)
   d. Build dispatch metadata:
      { companionId, conversationId, nsfwLevel, voiceId, faceId,
        lettaAgentId, companionName, userId }
   e. Generate LiveKit access token for user
   f. Create LiveKit room with metadata
   g. Dispatch named agent "aura-companion" to room
   h. Return { token, roomName, wsUrl }

4. Frontend: Connect to LiveKit room using token
   - Publish microphone track (+ camera if video)
   - Subscribe to agent's audio/video tracks

5. Python Agent Worker (on Vast.ai PRO 6000 S):
   a. Receives dispatch, joins room
   b. Parses metadata (companionId, lettaAgentId, voiceId, faceId, etc.)
   c. Fetches runtime pipeline config from Railway backend
   d. Configures pipeline:
      - STT: Deepgram Nova-3
      - LLM: Claude (SFW, nsfwLevel=0) or Ollama (future NSFW)
      - TTS: ElevenLabs eleven_turbo_v2_5 with companion's voice ID
      - VAD: Silero voice activity detection
   e. Fetches Letta memory blocks -> builds system prompt
   f. If faceId present: starts Simli avatar session (lip-synced video)
   g. Starts AgentSession (STT -> LLM -> TTS pipeline)

6. During call:
   - Deepgram transcribes user speech in real-time
   - LLM generates response using Letta memory as context
   - ElevenLabs TTS speaks response with companion's voice
   - Simli avatar lip-syncs to TTS audio (if video call)
   - Every 20 turns: mid-call memory sync refreshes blocks
   - Call events batched and sent to Railway backend

7. Call ends (on_exit):
   a. Collect full transcript from chat context
   b. Sync transcript to Letta (sleeptime processing)
   c. POST call summary to Railway backend
   d. Flush call event logs
```

### 3.7 Companion Pool Design

Users are matched with companions from a **curated limited pool**:

- **Female voices**: 3-5 curated ElevenLabs voices (attractive, varied accents/tones)
- **Male voices**: 3-5 curated ElevenLabs voices (attractive, varied accents/tones)
- Each voice maps to a visual companion (Simli face ID for video calls)
- Companion personalities vary (playful, nurturing, intellectual, adventurous, etc.)
- User's astrology assessment influences which companion archetype they're matched with
- Voice IDs and face IDs stored in `companion_profiles` table

### 3.8 Rate Limiting

| User Tier | Text Messages/Day | Voice Call Minutes/Day |
|-----------|-------------------|------------------------|
| Free | 5 | 0 (text only) |
| Paid (TBD) | Unlimited | TBD |

Rate limit tracking uses Redis (already available on Railway).

### 3.9 Streaming Response Format

SSE streaming from chat endpoint:

```
data: {"type":"message_chunk","role":"assistant","content":"Hello,","tokens":2}
data: {"type":"message_chunk","role":"assistant","content":" how are","tokens":2}
data: {"type":"message_chunk","role":"assistant","content":" you?","tokens":2}
data: {"type":"tool_call","name":"memory_replace","status":"executing"}
data: {"type":"complete","messageId":"uuid","tokenCount":150}
```

---

## 4. Database Schema (Anplexa-specific)

Anplexa uses its existing PostgreSQL instance on Railway (`Postgres-0WPo`).

### 4.1 New Tables

**`conversations`** (extend existing)
```sql
conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  companion_persona_id UUID REFERENCES companion_personas(id),
  letta_agent_id VARCHAR,           -- Letta text chat agent ID
  voice_agent_id VARCHAR,           -- Letta voice agent ID (with sleeptime)
  title VARCHAR(255),
  source VARCHAR(20) DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`messages`** (extend existing)
```sql
messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(20) DEFAULT 'chat',  -- 'chat' | 'voice_call' | 'video_call'
  audio_url TEXT,
  audio_transcript TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`letta_agents`** (extend existing)
```sql
letta_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  companion_persona_id UUID REFERENCES companion_personas(id),
  letta_agent_id VARCHAR NOT NULL,
  agent_name VARCHAR(255),
  agent_type VARCHAR(20) DEFAULT 'text',  -- 'text' | 'voice'
  block_ids JSONB,
  model_handle VARCHAR(100),
  embedding_handle VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`companion_voices`** (new - curated voice pool)
```sql
companion_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_persona_id UUID REFERENCES companion_personas(id),
  voice_id VARCHAR(100) NOT NULL,       -- ElevenLabs voice ID
  voice_name VARCHAR(100),
  gender VARCHAR(20),                    -- 'female' | 'male'
  simli_face_id VARCHAR(100),           -- Simli avatar face ID (for video)
  tts_model VARCHAR(50) DEFAULT 'eleven_turbo_v2_5',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`voice_call_metadata`** (new)
```sql
voice_call_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  room_name VARCHAR(255),               -- LiveKit room name
  provider VARCHAR(20) DEFAULT 'livekit',
  call_status VARCHAR(20) DEFAULT 'active',  -- 'active' | 'completed' | 'failed'
  has_video BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  message_count INTEGER,
  memory_synced BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`livekit_agent_config`** (new - runtime pipeline config)
```sql
livekit_agent_config (
  key VARCHAR(50) PRIMARY KEY,          -- 'stt' | 'llm_nsfw' | 'llm_sfw' | 'tts' | etc.
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100)
)
```

**`livekit_call_events`** (new - call observability)
```sql
livekit_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name VARCHAR(255),
  room_sid VARCHAR(255),
  conversation_id UUID,
  user_id UUID,
  companion_id UUID,
  session_id VARCHAR(255),
  event_type VARCHAR(50),
  event_name VARCHAR(100),
  level VARCHAR(20) DEFAULT 'info',
  source VARCHAR(20),                   -- 'agent' | 'webhook' | 'backend'
  metadata JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**`chat_debug_logs`** (new, optional)
```sql
chat_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50),
  event VARCHAR(100),
  conversation_id UUID,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.2 Existing Tables - No Changes Needed

- `users` - Already has all needed fields
- `birth_charts` - Already exists
- `companion_personas` - Already exists
- `sessions` - Already exists (JWT-based)

---

## 5. Infrastructure Architecture

### 5.1 Complete System Architecture

```
                    ┌─────────────────────────────────────┐
                    │         LiveKit Cloud                │
                    │  wss://aurapoc-ny8qqa3y.livekit.cloud│
                    │  WebRTC signaling + agent dispatch   │
                    └──────┬──────────────┬───────────────┘
                           |              |
              User WebRTC  |              | Agent WebRTC
                           |              |
┌──────────────────┐       |    ┌─────────┴──────────────────────────┐
│ User Browser     │───────┘    │  Vast.ai PRO 6000 S (GPU)          │
│                  │            │                                     │
│ Next.js 15       │            │  ┌─────────────────────────────┐   │
│ - Chat UI        │            │  │ Python LiveKit Agent Worker  │   │
│ - Voice/Video UI │            │  │ "aura-companion"             │   │
│ - LiveKit SDK    │            │  │                              │   │
└───────┬──────────┘            │  │ Deepgram STT (Nova-3)        │   │
        |                       │  │ ElevenLabs TTS (turbo v2.5)  │   │
        | HTTPS                 │  │ Silero VAD                   │   │
        |                       │  │ Simli Avatar (video calls)   │   │
┌───────┴──────────┐            │  │ Letta memory integration     │   │
│ Railway          │            │  └──────────┬──────────────────┘   │
│ (anplexa-dev)    │            │             |                      │
│                  │            │  ┌──────────┴──────────────────┐   │
│ ┌──────────────┐ │            │  │ Letta Server v0.16.6+       │   │
│ │ Anplexa API  │ │◄───────────│  │ 194.228.55.129:39967        │   │
│ │ Express.js   │ │ internal   │  │ Agent orchestration          │   │
│ │ Port 3002    │ │ API key    │  │ Memory blocks                │   │
│ └──────┬───────┘ │            │  └─────────────────────────────┘   │
│        |         │            │                                     │
│ ┌──────┴───────┐ │            │  ┌─────────────────────────────┐   │
│ │ PostgreSQL   │ │            │  │ Ollama                      │   │
│ │ Postgres-0WPo│ │            │  │ 194.228.55.129:39967/ollama │   │
│ └──────────────┘ │            │  │ qwen3.5-nsfw:27b (future)   │   │
│                  │            │  │ nomic-embed-text             │   │
│ ┌──────────────┐ │            │  └─────────────────────────────┘   │
│ │ Redis        │ │            └─────────────────────────────────────┘
│ │ Rate limits  │ │
│ │ Caching      │ │
│ └──────────────┘ │
└──────────────────┘
```

### 5.2 External Services

| Service | Purpose | Shared with AURA? | Access |
|---------|---------|-------------------|--------|
| **Letta Server** | Agent orchestration, memory | Yes | `http://194.228.55.129:39967` |
| **Ollama** | LLM inference + embeddings | Yes | `http://194.228.55.129:39967/ollama` |
| **LiveKit Cloud** | WebRTC signaling + dispatch | Yes | `wss://aurapoc-ny8qqa3y.livekit.cloud` |
| **LiveKit Agent Worker** | Python voice/video pipeline | Yes (same worker) | Runs on PRO 6000 S |
| **Deepgram** | Speech-to-text (STT) | Yes (same API key) | Cloud API |
| **ElevenLabs** | Text-to-speech (TTS) | Yes (same API key) | Cloud API |
| **Simli** | Lip-synced video avatar | Yes (same API key) | Cloud API |
| **Anthropic Claude** | SFW chat LLM + trait enrichment | Own API key | Cloud API |
| **PostgreSQL** | Anplexa data | No (own instance) | Railway `Postgres-0WPo` |
| **Redis** | Rate limiting, caching | No (own instance) | Railway Redis |
| **AWS S3** | Media storage | New bucket | `DO_NOT_DELETE_OR_TOUCH_BBR_1` |
| **ComfyUI** | Media generation (future) | Yes | `http://89.221.67.149:42840/` |

### 5.3 Environment Variables (Anplexa API)

```bash
# ── Database (existing Railway instance) ──
DATABASE_URL=postgresql://postgres:htgiPErBmgWcbBGyShSsJkxKFsAVdVPr@turntable.proxy.rlwy.net:35535/railway

# ── Auth ──
JWT_SECRET=<existing>
CORS_ORIGIN=<companions app URL>
ADMIN_UI_PASSWORD=<existing>

# ── Letta Server (shared Vast.ai) ──
LETTA_API_URL=http://194.228.55.129:39967
LETTA_API_KEY=<your-letta-api-key>
LETTA_CHAT_MODEL=anthropic/claude-sonnet-4-5-20250929
LETTA_EMBEDDING_MODEL=ollama/nomic-embed-text:latest

# ── Ollama (shared Vast.ai) ──
OLLAMA_BASE_URL=http://194.228.55.129:39967/ollama
OLLAMA_API_KEY=<your-ollama-api-key>

# ── Anthropic (trait enrichment + SFW chat) ──
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# ── LiveKit (voice/video calls) ──
LIVEKIT_URL=wss://aurapoc-ny8qqa3y.livekit.cloud
LIVEKIT_API_KEY=<your-livekit-api-key>
LIVEKIT_API_SECRET=<your-livekit-api-secret>
INTERNAL_API_KEY=<your-internal-api-key>

# ── ElevenLabs (TTS only, used by Python agent) ──
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>

# ── Deepgram (STT, used by Python agent) ──
DEEPGRAM_API_KEY=<your-deepgram-api-key>

# ── Simli (video avatar, used by Python agent) ──
SIMLI_API_KEY=<your-simli-api-key>

# ── AWS S3 (new bucket for Anplexa) ──
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_S3_BUCKET_NAME=DO_NOT_DELETE_OR_TOUCH_BBR_1
AWS_REGION=us-east-1

# ── Server ──
PORT=3002
NODE_ENV=production
```

### 5.4 Python Agent Worker Environment (on Vast.ai PRO 6000 S)

```bash
# LiveKit Cloud
LIVEKIT_URL=wss://aurapoc-ny8qqa3y.livekit.cloud
LIVEKIT_API_KEY=<your-livekit-api-key>
LIVEKIT_API_SECRET=<your-livekit-api-secret>

# Deepgram STT
DEEPGRAM_API_KEY=<your-deepgram-api-key>

# ElevenLabs TTS
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>

# Simli Avatar
SIMLI_API_KEY=<your-simli-api-key>

# Letta Memory Server (same machine)
LETTA_API_URL=http://194.228.55.129:39967
LETTA_API_KEY=<your-letta-api-key>

# Anthropic (SFW LLM)
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Ollama (local, same machine)
OLLAMA_BASE_URL=http://localhost:11434/v1

# Railway Backend (for call events + config)
RAILWAY_API_URL=https://api-develop-f1bc.up.railway.app  # Anplexa API
INTERNAL_API_KEY=<your-internal-api-key>

# Models
NSFW_MODEL=qwen3.5-nsfw:27b
SFW_MODEL=claude-sonnet-4-5-20250929
STT_MODEL=nova-3
TTS_MODEL=eleven_turbo_v2_5
MEMORY_EXTRACTION_MODEL=qwen3.5-vision-nsfw:9b

# Behaviour
MID_CALL_SYNC_INTERVAL=20
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|--------|--------|
| Time to first token (text chat) | < 2s |
| Token throughput | 20+ tokens/sec |
| Voice TTFB (LiveKit agent response) | < 3s |
| Agent provisioning time | < 10s |
| Conversation list load | < 500ms |
| Message history pagination | < 300ms per page |

### 6.2 Reliability

- Chat endpoint: 99.5% availability
- Voice calls: 99% availability (dependent on LiveKit Cloud + Vast.ai)
- Letta agent creation: Retry with exponential backoff (3 attempts)
- SSE stream reconnection: Client-side retry on disconnect
- Memory sync: Fire-and-forget (non-blocking, logged on failure)
- Mid-call memory sync: Non-fatal errors swallowed (never interrupt active call)

### 6.3 Security

- All API endpoints require JWT authentication
- LiveKit token endpoint validates user owns the conversation
- Internal API key authenticates Python agent -> Railway backend communication
- LiveKit webhook signature verification
- Agent resolution includes user ownership check (prevent cross-user access)
- No PII in debug logs
- Database connections use SSL
- Rate limiting on chat endpoints (5 messages/day free tier)
- Redis-backed rate limit tracking (not in-memory)

### 6.4 Scalability

- Letta agents are stateless from the app's perspective
- LiveKit Cloud handles WebRTC scaling
- Python agent worker can be scaled horizontally (register more workers)
- Database connection pool: max 10, min 2
- SSE streams time out after 3 minutes
- Redis for rate limits scales across API instances

---

## 7. What Gets Ported from Letta-Lonely

### 7.1 Direct Ports (adapt to Anplexa patterns)

| Letta-Lonely Component | Anplexa Target | Adaptation Needed |
|------------------------|----------------|-------------------|
| `LettaGateway.ts` | `packages/services/src/letta/LettaGateway.ts` | Already partially exists; extend with streaming, agent creation, memory block mgmt |
| `livekitRoutes.ts` | `apps/api/src/routes/voice/livekit.ts` | Port token generation, room creation, agent dispatch; adapt to JWT auth |
| Chat SSE streaming logic | `apps/api/src/routes/chat/send.ts` | Port SSE format, tool call detection, action filtering |
| `ChatActionStreamFilter` | `packages/services/src/letta/ChatActionStreamFilter.ts` | Port as-is |
| `PersonaBuilder.ts` | Already exists; extend | Add astrological awareness section |
| `CognitivePromptService.ts` | Already exists; extend | Adapt cognitive block labels |
| `CognitiveBlockFactory.ts` | Already exists; extend | Add astrology-specific blocks |
| `RouteToAgentUseCase.ts` | New use case | Port agent resolution + auto-creation logic |
| `LiveKitCallEventService.ts` | New service | Port call event persistence |
| `HumanBlockBuilder.ts` | New/extend | Build from astrological profile |
| Python `aura-livekit-agent/` | Clone and adapt for Anplexa | Same worker can serve both apps (metadata-based routing) |
| Python `companion_agent.py` | Shared (metadata-driven) | No changes needed if worker serves both apps |
| Python `memory_sync.py` | Shared | Posts to Anplexa Railway backend URL |
| Python `prompt_builder.py` | Shared | Builds prompt from whatever blocks Letta returns |
| Frontend: `ChatInterface`, `MessageBubble` | Extend existing | Port streaming display, message bubbles |
| Frontend: LiveKit voice/video call components | New components | Call button, in-call modal, video display |

### 7.2 New Components (Anplexa-specific)

| Component | Purpose |
|-----------|---------|
| `AstrologyBlockBuilder.ts` | Converts TraitProfile + BirthChart into Letta `human` block format |
| `CompanionBlockBuilder.ts` | Converts CompanionPersona + compatibility into Letta `persona` block |
| `OnboardingAgentProvisioner.ts` | Orchestrates agent creation at end of onboarding flow |
| `RateLimitService.ts` | Redis-backed rate limiting (5 msgs/day free tier) |
| Drizzle migrations | New tables for conversations, messages, letta_agents, companion_voices, voice_call_metadata, livekit_agent_config, livekit_call_events |

### 7.3 Not Ported

| Letta-Lonely Component | Reason |
|------------------------|--------|
| Old `voiceProxyRoutes.ts` (ElevenLabs proxy) | Replaced by LiveKit architecture |
| NSFW agent routing / `NsfwDirectiveBuilder.ts` | SFW-only initially (NSFW comes later) |
| `SceneVideoService.ts` / LoRA catalog | Adult content feature |
| Prompt VCS | Admin tooling, defer |
| Letta-Lonely onboarding wizard | Anplexa has own astrology onboarding |
| `NativeMediaService.ts` (image gen) | Defer to future phase |
| AURA-API session sharing | Anplexa uses JWT |
| Guest chat | Removed per decision |

---

## 8. Deployment Plan

### 8.1 Database Setup

1. Verify existing `Postgres-0WPo` is accessible and has current Anplexa schema
2. Run existing Anplexa migrations (users, birth_charts, companion_personas, etc.)
3. Add new Drizzle migrations for all new tables
4. Verify schema integrity
5. Create S3 bucket `DO_NOT_DELETE_OR_TOUCH_BBR_1`

### 8.2 Infrastructure Configuration

1. Verify Railway API can reach Letta server on Vast.ai (network test)
2. Verify Railway API can reach Ollama on Vast.ai
3. Configure all environment variables on Railway (API service)
4. Configure LiveKit webhook URL in LiveKit Cloud dashboard -> Anplexa API
5. Verify Python agent worker is running on PRO 6000 S
6. Configure Python agent's `RAILWAY_API_URL` to point to Anplexa API

### 8.3 Deployment Order

1. Database migrations (schema ready)
2. Backend services (LettaGateway extensions, LiveKit routes, chat routes, rate limiting)
3. Agent provisioning integration (end of onboarding flow)
4. Frontend chat interface (streaming, message display)
5. Frontend voice/video call UI (LiveKit SDK integration)
6. Curate companion voice pool (select voices, create companion_voices records)
7. End-to-end testing
8. Production deployment

---

## 9. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| User completes onboarding and enters chat | Letta agent provisioned, first message references astrology |
| Text chat works with streaming | SSE stream renders character-by-character in < 2s TTFT |
| Memory persists across sessions | Companion recalls user's name and traits in new session |
| Voice calls function | LiveKit room created, agent joins, user hears companion respond |
| Video calls function | Simli avatar renders lip-synced video alongside voice |
| Astrology data in memory blocks | `human` block contains Sun/Moon/Rising and trait data |
| Companion personality reflects chart | `persona` block references complementary astrological design |
| Own database isolation | All Anplexa data in Railway `Postgres-0WPo` |
| Shared infra works | Letta/Ollama/LiveKit serve both Anplexa and AURA without conflict |
| Rate limits enforced | Free users blocked after 5 messages/day |
| Companion regeneration updates existing agent | Memory blocks updated, no new agent created |

---

## 10. Remaining Open Questions

All major questions have been resolved. Minor items that may need attention during implementation:

1. **Companion pool curation**: Which specific ElevenLabs voices and Simli faces to use? This can be decided during the voice pool setup step.
2. **Paid tier limits**: What are the exact rate limits for paid users? TBD when monetization is designed.
3. **LiveKit webhook URL**: The exact Railway URL for the Anplexa API (currently `api-develop-f1bc.up.railway.app`) needs to be configured in the LiveKit Cloud dashboard.
4. **Python agent multi-tenancy**: The Python agent worker currently serves AURA. It needs to be verified that it can serve Anplexa calls simultaneously without conflict (metadata-based routing should handle this, but needs testing).
