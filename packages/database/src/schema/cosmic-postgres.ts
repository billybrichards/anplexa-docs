/**
 * Cosmic Companion Database Schema (PostgreSQL)
 *
 * Tables for astrology-based AI girlfriend platform.
 */

import { pgTable, text, integer, doublePrecision, boolean, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Birth Charts table
export const birthCharts = pgTable('birth_charts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // One chart per user
  birthDate: text('birth_date').notNull(), // ISO date string
  birthTime: text('birth_time').notNull(), // HH:mm format
  // Birth location
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  timezone: text('timezone').notNull(),
  city: text('city'),
  country: text('country'),
  // Major placements (zodiac sign names)
  sunSign: text('sun_sign').notNull(),
  moonSign: text('moon_sign').notNull(),
  venusSign: text('venus_sign').notNull(),
  marsSign: text('mars_sign').notNull(),
  risingSign: text('rising_sign').notNull(),
  // Optional placements
  mercurySign: text('mercury_sign'),
  jupiterSign: text('jupiter_sign'),
  saturnSign: text('saturn_sign'),
  // Metadata
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// AI Companions table
export const companions = pgTable('companions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  // Astrological personality (zodiac sign names)
  sunSign: text('sun_sign').notNull(),
  moonSign: text('moon_sign').notNull(),
  venusSign: text('venus_sign').notNull(),
  marsSign: text('mars_sign').notNull(),
  risingSign: text('rising_sign').notNull(),
  // Compatibility data (stored as JSON)
  compatibilityScore: text('compatibility_score').notNull(), // JSON: {overall, sun, moon, venus, mars, rising, label}
  // Appearance configuration (JSON)
  appearance: text('appearance').notNull(), // JSON: {ethnicity, bodyType, hairColor, hairLength, ageAppearance, customPrompts}
  // Personality sliders (JSON)
  personalitySliders: text('personality_sliders').notNull(), // JSON: {confidence, playfulness, dominance, emotionalDepth, directness}
  // Voice configuration
  voiceId: text('voice_id'),
  // Metadata
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Companion Memories table (3-tier memory system)
export const companionMemories = pgTable('companion_memories', {
  id: text('id').primaryKey(),
  companionId: text('companion_id').notNull(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'short-term' | 'medium-term' | 'long-term'
  category: text('category').notNull(), // 'preference' | 'event' | 'emotion' | 'astrological' | 'intimate' | 'general'
  content: text('content').notNull(),
  importance: integer('importance').notNull(), // 0-100
  expiresAt: text('expires_at'), // ISO date, null for long-term
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Age Verification table (NSFW access control)
export const ageVerifications = pgTable('age_verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  status: text('status').notNull(), // 'pending' | 'verified' | 'failed' | 'expired'
  method: text('method').notNull(), // 'government-id' | 'credit-card' | 'third-party' | 'manual-review'
  verifiedAt: text('verified_at'),
  expiresAt: text('expires_at'),
  providerSessionId: text('provider_session_id'),
  metadata: text('metadata'), // JSON: provider-specific data
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Generated Images table (tracks NSFW image generation)
export const generatedImages = pgTable('generated_images', {
  id: text('id').primaryKey(),
  companionId: text('companion_id').notNull(),
  userId: text('user_id').notNull(),
  url: text('url').notNull(),
  prompt: text('prompt').notNull(),
  zodiacStyle: text('zodiac_style').notNull(), // Zodiac sign used for aesthetic
  seed: integer('seed'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: text('created_at').notNull()
});

// Cosmic Conversations table (chat sessions)
export const cosmicConversations = pgTable('cosmic_conversations', {
  id: text('id').primaryKey(),
  companionId: text('companion_id').notNull(),
  userId: text('user_id').notNull(),
  title: text('title'), // Auto-generated or user-set
  lastMessageAt: text('last_message_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Cosmic Messages table (individual messages)
export const cosmicMessages = pgTable('cosmic_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  companionId: text('companion_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  transitContext: text('transit_context'), // Astrological transit message if present
  createdAt: text('created_at').notNull()
});

// Cosmic Subscriptions table (tier management)
export const cosmicSubscriptions = pgTable('cosmic_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  tier: text('tier').notNull(), // 'free' | 'astrology-seeker' | 'cosmic-soulmate' | 'astral-intimacy'
  status: text('status').notNull(), // 'active' | 'canceled' | 'past_due' | 'expired'
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: text('current_period_start').notNull(),
  currentPeriodEnd: text('current_period_end').notNull(),
  // Usage tracking
  messagesUsedToday: integer('messages_used_today').default(0),
  imagesUsedThisMonth: integer('images_used_this_month').default(0),
  voiceMinutesUsedThisMonth: integer('voice_minutes_used_this_month').default(0),
  lastDailyReset: text('last_daily_reset'),
  lastMonthlyReset: text('last_monthly_reset'),
  // Metadata
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Relations
export const birthChartsRelations = relations(birthCharts, ({ one }) => ({
  user: one(companions, {
    fields: [birthCharts.userId],
    references: [companions.userId]
  })
}));

export const companionsRelations = relations(companions, ({ many }) => ({
  memories: many(companionMemories),
  images: many(generatedImages),
  conversations: many(cosmicConversations),
  messages: many(cosmicMessages)
}));

export const companionMemoriesRelations = relations(companionMemories, ({ one }) => ({
  companion: one(companions, {
    fields: [companionMemories.companionId],
    references: [companions.id]
  })
}));

export const cosmicConversationsRelations = relations(cosmicConversations, ({ one, many }) => ({
  companion: one(companions, {
    fields: [cosmicConversations.companionId],
    references: [companions.id]
  }),
  messages: many(cosmicMessages)
}));

export const cosmicMessagesRelations = relations(cosmicMessages, ({ one }) => ({
  conversation: one(cosmicConversations, {
    fields: [cosmicMessages.conversationId],
    references: [cosmicConversations.id]
  }),
  companion: one(companions, {
    fields: [cosmicMessages.companionId],
    references: [companions.id]
  })
}));

export const cosmicSubscriptionsRelations = relations(cosmicSubscriptions, ({ one }) => ({
  verification: one(ageVerifications, {
    fields: [cosmicSubscriptions.userId],
    references: [ageVerifications.userId]
  })
}));
