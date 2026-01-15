---
sidebar_position: 14
---

# Cosmic Companion: Folder Structure & Data Flow

## Part 3: Package Structure & Integration

### 3.1 Recommended Folder Structure

```
packages/
├── cosmic-companion/                    # NEW: Cosmic Companion feature package
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   │
│   ├── src/
│   │   ├── index.ts                     # Public API exports
│   │   │
│   │   ├── domain/                      # Domain Layer (Zero external deps)
│   │   │   ├── entities/
│   │   │   │   ├── BirthChart.ts
│   │   │   │   ├── Companion.ts
│   │   │   │   ├── Memory.ts
│   │   │   │   ├── AgeVerification.ts
│   │   │   │   ├── CosmicConversation.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── value-objects/
│   │   │   │   ├── ZodiacSign.ts
│   │   │   │   ├── ZodiacPersonality.ts
│   │   │   │   ├── CompatibilityScore.ts
│   │   │   │   ├── ContentTier.ts
│   │   │   │   ├── AppearanceConfig.ts
│   │   │   │   ├── VoiceConfig.ts
│   │   │   │   ├── PersonalitySliders.ts
│   │   │   │   ├── PlanetaryPosition.ts
│   │   │   │   ├── GeoLocation.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── CompatibilityService.ts
│   │   │   │   ├── TransitService.ts
│   │   │   │   ├── MemoryService.ts
│   │   │   │   ├── PersonalityService.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── repositories/            # Interfaces only
│   │   │   │   ├── IBirthChartRepository.ts
│   │   │   │   ├── ICompanionRepository.ts
│   │   │   │   ├── IMemoryRepository.ts
│   │   │   │   ├── IAgeVerificationRepository.ts
│   │   │   │   ├── IGeneratedImageRepository.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── errors/
│   │   │   │   ├── CosmicDomainError.ts
│   │   │   │   ├── BirthChartErrors.ts
│   │   │   │   ├── CompanionErrors.ts
│   │   │   │   ├── ContentErrors.ts
│   │   │   │   ├── VerificationErrors.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── use-cases/                   # Application Layer
│   │   │   ├── birth-chart/
│   │   │   │   ├── CreateBirthChartUseCase.ts
│   │   │   │   ├── UpdateBirthChartUseCase.ts
│   │   │   │   ├── GetBirthChartUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── companion/
│   │   │   │   ├── CreateCompanionUseCase.ts
│   │   │   │   ├── UpdateCompanionUseCase.ts
│   │   │   │   ├── GetCompanionUseCase.ts
│   │   │   │   ├── DeleteCompanionUseCase.ts
│   │   │   │   ├── SetActiveCompanionUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── SendCompanionMessageUseCase.ts
│   │   │   │   ├── GetCompanionConversationHistoryUseCase.ts
│   │   │   │   ├── CreateCompanionConversationUseCase.ts
│   │   │   │   ├── StreamCompanionResponseUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── image/
│   │   │   │   ├── GenerateCompanionImageUseCase.ts
│   │   │   │   ├── GetUserImagesUseCase.ts
│   │   │   │   ├── DeleteImageUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── voice/
│   │   │   │   ├── InitiateVoiceCallUseCase.ts
│   │   │   │   ├── ProcessVoiceInputUseCase.ts
│   │   │   │   ├── GenerateVoiceResponseUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── verification/
│   │   │   │   ├── InitiateAgeVerificationUseCase.ts
│   │   │   │   ├── HandleVerificationWebhookUseCase.ts
│   │   │   │   ├── CheckVerificationStatusUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── subscription/
│   │   │   │   ├── CreateCosmicCheckoutUseCase.ts
│   │   │   │   ├── HandleCosmicWebhookUseCase.ts
│   │   │   │   ├── GetUserTierUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── memory/
│   │   │   │   ├── GetRelevantMemoriesUseCase.ts
│   │   │   │   ├── PromoteMemoriesUseCase.ts
│   │   │   │   ├── CleanupExpiredMemoriesUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── transit/
│   │   │   │   ├── GetCurrentTransitsUseCase.ts
│   │   │   │   ├── GetIntimacyForecastUseCase.ts
│   │   │   │   ├── GetMonthlyReportUseCase.ts
│   │   │   │   ├── dtos.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── ports/                   # Port interfaces for adapters
│   │   │   │   ├── IEphemerisService.ts
│   │   │   │   ├── IAIService.ts
│   │   │   │   ├── IImageGenerationService.ts
│   │   │   │   ├── IVoiceService.ts
│   │   │   │   ├── IVerificationProviderService.ts
│   │   │   │   ├── IContentModerationService.ts
│   │   │   │   ├── ISubscriptionService.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── factories.ts                 # Factory functions for DI
│   │
│   └── tests/
│       ├── unit/
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   ├── value-objects/
│       │   │   └── services/
│       │   └── use-cases/
│       │       ├── birth-chart/
│       │       ├── companion/
│       │       ├── chat/
│       │       └── ...
│       └── integration/
│           └── ...
│
├── cosmic-adapters/                     # NEW: Infrastructure adapters
│   ├── package.json
│   ├── src/
│   │   ├── persistence/
│   │   │   ├── drizzle/
│   │   │   │   ├── DrizzleBirthChartRepository.ts
│   │   │   │   ├── DrizzleCompanionRepository.ts
│   │   │   │   ├── DrizzleMemoryRepository.ts
│   │   │   │   ├── DrizzleAgeVerificationRepository.ts
│   │   │   │   ├── DrizzleGeneratedImageRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── external/
│   │   │   ├── ephemeris/
│   │   │   │   ├── SwissEphemerisAdapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── CosmicOllamaGateway.ts
│   │   │   │   ├── CosmicAnthropicGateway.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── image-generation/
│   │   │   │   ├── StableDiffusionAdapter.ts
│   │   │   │   ├── ReplicateAdapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── voice/
│   │   │   │   ├── ElevenLabsAdapter.ts
│   │   │   │   ├── CoquiTTSAdapter.ts
│   │   │   │   ├── WhisperSTTAdapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── verification/
│   │   │   │   ├── YotiAdapter.ts
│   │   │   │   ├── VeriffAdapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── moderation/
│   │   │       ├── ContentModerationAdapter.ts
│   │   │       └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   └── tests/
│       └── integration/
│
├── core/                                # EXISTING: Core domain (extend)
│   └── src/
│       └── ...                          # Existing entities, use cases
│
├── database/                            # EXISTING: Database schemas (extend)
│   └── src/
│       └── schema/
│           ├── postgres.ts              # Add cosmic tables
│           └── ...
│
├── contracts/                           # EXISTING: Shared types (extend)
│   └── src/
│       ├── cosmic/                      # NEW: Cosmic-specific DTOs
│       │   ├── birth-chart.dto.ts
│       │   ├── companion.dto.ts
│       │   ├── image.dto.ts
│       │   └── index.ts
│       └── ...
│
└── services/                            # EXISTING: Shared services
    └── src/
        └── ...

apps/
├── api/                                 # EXISTING: Backend API (extend)
│   └── src/
│       ├── routes/
│       │   ├── cosmic/                  # NEW: Cosmic routes
│       │   │   ├── birth-chart.routes.ts
│       │   │   ├── companion.routes.ts
│       │   │   ├── cosmic-chat.routes.ts
│       │   │   ├── image.routes.ts
│       │   │   ├── voice.routes.ts
│       │   │   ├── verification.routes.ts
│       │   │   └── index.ts
│       │   └── ...
│       │
│       ├── controllers/
│       │   └── cosmic/                  # NEW: Cosmic controllers
│       │       ├── BirthChartController.ts
│       │       ├── CompanionController.ts
│       │       ├── CosmicChatController.ts
│       │       ├── ImageController.ts
│       │       ├── VoiceController.ts
│       │       └── index.ts
│       │
│       └── di/
│           └── cosmic-container.ts      # NEW: Cosmic DI setup
│
├── cosmic-web/                          # NEW: Cosmic Companion frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   │
│   ├── src/
│   │   ├── app/                         # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── quiz/                    # Birth chart quiz flow
│   │   │   │   └── page.tsx
│   │   │   ├── companion/               # Companion management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── chat/                    # Chat interface
│   │   │   │   └── page.tsx
│   │   │   ├── gallery/                 # Image gallery
│   │   │   │   └── page.tsx
│   │   │   ├── settings/                # User settings
│   │   │   │   └── page.tsx
│   │   │   ├── verify/                  # Age verification
│   │   │   │   └── page.tsx
│   │   │   └── api/                     # API routes (proxy)
│   │   │       └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── quiz/
│   │   │   │   ├── BirthChartForm.tsx
│   │   │   │   ├── QuizSteps.tsx
│   │   │   │   ├── CompatibilityResult.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── companion/
│   │   │   │   ├── CompanionCard.tsx
│   │   │   │   ├── CompanionCustomizer.tsx
│   │   │   │   ├── ZodiacPersonalityDisplay.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── CosmicChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── TransitBanner.tsx
│   │   │   │   ├── ContentModeSelector.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── gallery/
│   │   │   │   ├── ImageGrid.tsx
│   │   │   │   ├── ImageGeneratorModal.tsx
│   │   │   │   ├── ZodiacStylePicker.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── astrology/
│   │   │   │   ├── ZodiacWheel.tsx
│   │   │   │   ├── BirthChartDisplay.tsx
│   │   │   │   ├── TransitTimeline.tsx
│   │   │   │   ├── MoonPhaseIndicator.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── ui/                      # Shared UI components
│   │   │       ├── CosmicButton.tsx
│   │   │       ├── CosmicCard.tsx
│   │   │       ├── StarField.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCompanion.ts
│   │   │   ├── useCosmicChat.ts
│   │   │   ├── useBirthChart.ts
│   │   │   ├── useTransits.ts
│   │   │   ├── useImageGeneration.ts
│   │   │   ├── useAgeVerification.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── cosmic-client.ts
│   │   │   │   ├── birth-chart.api.ts
│   │   │   │   ├── companion.api.ts
│   │   │   │   ├── cosmic-chat.api.ts
│   │   │   │   └── index.ts
│   │   │   └── storage/
│   │   │       └── cosmic-storage.ts
│   │   │
│   │   ├── contexts/
│   │   │   ├── CompanionContext.tsx
│   │   │   ├── BirthChartContext.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── styles/
│   │       ├── globals.css
│   │       └── cosmic-theme.css
│   │
│   └── public/
│       └── ...
│
├── companions/                          # EXISTING: Main companion app
│   └── ...
│
└── funnel/                              # EXISTING: Marketing funnel
    └── ...
```

---

### 3.2 Database Schema Extensions

```typescript
// packages/database/src/schema/cosmic-postgres.ts

import { pgTable, text, integer, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './postgres';

// Birth Charts
export const birthCharts = pgTable('birth_charts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  birthDate: text('birth_date').notNull(),
  birthTime: text('birth_time').notNull(),
  birthCity: text('birth_city').notNull(),
  birthCountry: text('birth_country').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  timezone: text('timezone').notNull(),

  // Planetary positions (degrees)
  sunDegree: doublePrecision('sun_degree').notNull(),
  moonDegree: doublePrecision('moon_degree').notNull(),
  mercuryDegree: doublePrecision('mercury_degree').notNull(),
  venusDegree: doublePrecision('venus_degree').notNull(),
  marsDegree: doublePrecision('mars_degree').notNull(),
  jupiterDegree: doublePrecision('jupiter_degree'),
  saturnDegree: doublePrecision('saturn_degree'),
  ascendantDegree: doublePrecision('ascendant_degree').notNull(),
  midheavenDegree: doublePrecision('midheaven_degree'),

  // Cached sign names for quick access
  sunSign: text('sun_sign').notNull(),
  moonSign: text('moon_sign').notNull(),
  venusSign: text('venus_sign').notNull(),
  marsSign: text('mars_sign').notNull(),
  risingSign: text('rising_sign').notNull(),

  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Companions
export const companions = pgTable('companions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  relationshipType: text('relationship_type').notNull(), // girlfriend, companion, soulmate, etc.

  // Zodiac personality
  sunSign: text('sun_sign').notNull(),
  moonSign: text('moon_sign').notNull(),
  venusSign: text('venus_sign').notNull(),
  marsSign: text('mars_sign').notNull(),
  risingSign: text('rising_sign').notNull(),

  // Compatibility
  compatibilityScore: integer('compatibility_score').notNull(),
  matchType: text('match_type').notNull(),

  // Appearance config (JSON)
  appearanceConfig: jsonb('appearance_config').$type<{
    ethnicity: string;
    bodyType: string;
    hairColor: string;
    hairLength: string;
    eyeColor: string;
    ageAppearance: number;
  }>(),

  // Voice config (JSON)
  voiceConfig: jsonb('voice_config').$type<{
    voiceId: string;
    pitch: string;
    pace: string;
    tone: string;
  }>(),

  // Personality sliders (JSON)
  personalitySliders: jsonb('personality_sliders').$type<{
    confidence: number;
    playfulness: number;
    dominance: number;
    emotionalDepth: number;
    directness: number;
  }>(),

  isActive: boolean('is_active').default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Companion Memories
export const companionMemories = pgTable('companion_memories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  companionId: text('companion_id').references(() => companions.id).notNull(),
  tier: text('tier').notNull(), // short_term, medium_term, long_term
  category: text('category').notNull(), // preference, milestone, emotional, topic, intimacy, astro
  content: text('content').notNull(),
  importance: integer('importance').notNull().default(50),
  accessCount: integer('access_count').default(0),
  lastAccessed: text('last_accessed'),
  expiresAt: text('expires_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Age Verifications
export const ageVerifications = pgTable('age_verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  status: text('status').notNull().default('pending'), // pending, verified, rejected, expired
  method: text('method').notNull(), // government_id, credit_card, third_party_yoti, third_party_veriff
  verifiedAt: text('verified_at'),
  expiresAt: text('expires_at'),
  externalVerificationId: text('external_verification_id'),
  metadata: jsonb('metadata').$type<{
    ageConfirmed: boolean;
    countryCode?: string;
    documentType?: string;
    rejectionReason?: string;
  }>(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Generated Images
export const generatedImages = pgTable('generated_images', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  companionId: text('companion_id').references(() => companions.id).notNull(),
  promptUsed: text('prompt_used').notNull(),
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  isNSFW: boolean('is_nsfw').default(false),
  zodiacAesthetic: text('zodiac_aesthetic').notNull(),
  style: text('style').notNull(), // portrait, lingerie, artistic_nude, scenario, custom
  expiresAt: text('expires_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Cosmic Conversations (extends base conversations)
export const cosmicConversations = pgTable('cosmic_conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  companionId: text('companion_id').references(() => companions.id).notNull(),
  title: text('title'),
  contentMode: text('content_mode').default('sfw'), // sfw, flirty, explicit, fantasy
  messageCount: integer('message_count').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Cosmic Messages (extends base messages with transit context)
export const cosmicMessages = pgTable('cosmic_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => cosmicConversations.id).notNull(),
  role: text('role').notNull(), // user, assistant, system
  content: text('content').notNull(),
  contentMode: text('content_mode'),
  transitContext: text('transit_context'), // Transit info at time of message
  memoryReferences: jsonb('memory_references').$type<string[]>(), // IDs of memories used
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// User Subscription Tiers (Cosmic-specific)
export const cosmicSubscriptions = pgTable('cosmic_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  tierName: text('tier_name').notNull().default('free'), // free, astrology_seeker, cosmic_soulmate, astral_intimacy
  isAnnual: boolean('is_annual').default(false),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Relations
export const birthChartsRelations = relations(birthCharts, ({ one }) => ({
  user: one(users, {
    fields: [birthCharts.userId],
    references: [users.id],
  }),
}));

export const companionsRelations = relations(companions, ({ one, many }) => ({
  user: one(users, {
    fields: [companions.userId],
    references: [users.id],
  }),
  memories: many(companionMemories),
  images: many(generatedImages),
  conversations: many(cosmicConversations),
}));

export const cosmicConversationsRelations = relations(cosmicConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [cosmicConversations.userId],
    references: [users.id],
  }),
  companion: one(companions, {
    fields: [cosmicConversations.companionId],
    references: [companions.id],
  }),
  messages: many(cosmicMessages),
}));

// Types
export type BirthChart = typeof birthCharts.$inferSelect;
export type NewBirthChart = typeof birthCharts.$inferInsert;
export type Companion = typeof companions.$inferSelect;
export type NewCompanion = typeof companions.$inferInsert;
export type CompanionMemory = typeof companionMemories.$inferSelect;
export type AgeVerification = typeof ageVerifications.$inferSelect;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type CosmicConversation = typeof cosmicConversations.$inferSelect;
export type CosmicMessage = typeof cosmicMessages.$inferSelect;
export type CosmicSubscription = typeof cosmicSubscriptions.$inferSelect;
```

---

### 3.3 Data Flow Diagrams

#### Birth Chart Creation Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend   │     │   API Server    │     │   Use Case       │
│   Quiz Form  │────>│   Controller    │────>│   CreateBirthChart│
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                       │
                     ┌─────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   IEphemerisService    │ <─── Swiss Ephemeris Adapter
        │   (Port Interface)     │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Domain Service:      │
        │   Calculate Positions  │
        │   Create ZodiacSigns   │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   IBirthChartRepository│ <─── Drizzle Repository
        │   (Port Interface)     │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   PostgreSQL Database  │
        └────────────────────────┘
```

#### Companion Chat Flow

```
┌────────────────┐
│  User Message  │
└───────┬────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                 SendCompanionMessageUseCase               │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. Validate content mode access (subscription check)     │
│     └── ISubscriptionService                              │
│                                                           │
│  2. Get companion entity                                  │
│     └── ICompanionRepository                              │
│                                                           │
│  3. Check content moderation                              │
│     └── IContentModerationService                         │
│                                                           │
│  4. Build context:                                        │
│     ├── Get relevant memories (IMemoryRepository)         │
│     ├── Get current transits (IEphemerisService)          │
│     └── Generate transit greeting (TransitService)        │
│                                                           │
│  5. Build system prompt (Companion.buildSystemPrompt)     │
│                                                           │
│  6. Generate AI response                                  │
│     └── IAIService (Ollama/Anthropic adapter)             │
│                                                           │
│  7. Store messages (IMessageRepository)                   │
│                                                           │
│  8. Extract & store memories (IMemoryRepository)          │
│                                                           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────┐
│  AI Response   │
└────────────────┘
```

#### Image Generation Flow

```
┌─────────────────┐
│ Image Request   │
│ (style, nsfw?)  │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│              GenerateCompanionImageUseCase                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Validate NSFW access                                   │
│     ├── Check subscription tier (ISubscriptionService)     │
│     └── Verify age (IAgeVerificationRepository)            │
│                                                            │
│  2. Check quota                                            │
│     └── Count images this period (IGeneratedImageRepo)     │
│                                                            │
│  3. Build prompt from companion's zodiac aesthetics        │
│     └── Companion.zodiacPersonality.sunSign.imageAesthetics│
│                                                            │
│  4. Moderate custom prompt if provided                     │
│     └── IContentModerationService                          │
│                                                            │
│  5. Generate image                                         │
│     └── IImageGenerationService (SDXL/Replicate adapter)   │
│                                                            │
│  6. Store image record                                     │
│     └── IGeneratedImageRepository                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Generated Image │
│ URL + Thumbnail │
└─────────────────┘
```

#### Age Verification Flow

```
┌────────────────────┐
│ User requests      │
│ NSFW access        │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│            InitiateAgeVerificationUseCase                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Check existing verification                             │
│     └── IAgeVerificationRepository                          │
│                                                             │
│  2. Create verification record (pending)                    │
│     └── IAgeVerificationRepository.create()                 │
│                                                             │
│  3. Create session with provider                            │
│     └── IVerificationProviderService (Yoti/Veriff)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Redirect to         │────>│ Third-party          │
│ Provider (Yoti)     │     │ Verification UI      │
└─────────────────────┘     └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Webhook callback     │
                            │ to our API           │
                            └──────────┬───────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│          HandleVerificationWebhookUseCase                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Validate webhook signature                              │
│     └── IVerificationProviderService                        │
│                                                             │
│  2. Update verification status                              │
│     └── IAgeVerificationRepository.update()                 │
│                                                             │
│  3. If verified: enable NSFW access                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────┐
│ User can now       │
│ access NSFW content│
└────────────────────┘
```
