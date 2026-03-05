-- Migration: Add chat_messages table and letta columns to companion_personas
-- Generated: 2026-03-05

-- Add letta_agent_id and letta_conversation_id convenience columns to companion_personas
ALTER TABLE "companion_personas" ADD COLUMN IF NOT EXISTS "letta_agent_id" text;
ALTER TABLE "companion_personas" ADD COLUMN IF NOT EXISTS "letta_conversation_id" text;

-- Create chat_messages table for companion-keyed message history
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "companion_id" text NOT NULL REFERENCES "companion_personas"("id"),
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for fast history lookups by companion + user
CREATE INDEX IF NOT EXISTS "idx_chat_messages_companion_user" ON "chat_messages" ("companion_id", "user_id", "created_at" DESC);
