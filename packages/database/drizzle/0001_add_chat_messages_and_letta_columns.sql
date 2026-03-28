-- Migration: Add letta columns, make birthChartId nullable, add companionPersonaId to conversations
-- Generated: 2026-03-05

-- Add letta_agent_id and letta_conversation_id convenience columns to companion_personas
ALTER TABLE "companion_personas" ADD COLUMN IF NOT EXISTS "letta_agent_id" text;
ALTER TABLE "companion_personas" ADD COLUMN IF NOT EXISTS "letta_conversation_id" text;

-- Make birth_chart_id nullable (companions can be created before birth chart is persisted)
ALTER TABLE "companion_personas" ALTER COLUMN "birth_chart_id" DROP NOT NULL;

-- Add companion_persona_id to conversations for direct lookup
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "companion_persona_id" text REFERENCES "companion_personas"("id");
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "letta_agent_id" text;
