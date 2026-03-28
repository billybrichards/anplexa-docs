/**
 * Seed script for livekitAgentConfig and companionVoices tables.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx packages/database/src/seed/seed-voice-config.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { livekitAgentConfig, companionVoices } from '../schema/postgres.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function seed() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  console.log('Seeding livekitAgentConfig...');

  const configEntries = [
    { key: 'stt_model', value: JSON.stringify('nova-3') },
    { key: 'tts_model', value: JSON.stringify('eleven_turbo_v2_5') },
    { key: 'tts_voice', value: JSON.stringify('default') },
    { key: 'llm_model', value: JSON.stringify('ollama/qwen3-8b-nsfw:latest') },
    { key: 'turn_detection_threshold', value: JSON.stringify(0.5) },
    { key: 'turn_detection_prefix_padding_ms', value: JSON.stringify(300) },
    { key: 'turn_detection_silence_duration_ms', value: JSON.stringify(200) },
  ];

  for (const entry of configEntries) {
    await db
      .insert(livekitAgentConfig)
      .values(entry)
      .onConflictDoUpdate({
        target: livekitAgentConfig.key,
        set: { value: entry.value, updatedAt: new Date().toISOString() },
      });
  }

  console.log(`  Inserted ${configEntries.length} config entries`);

  console.log('Seeding companionVoices...');

  const voices = [
    {
      id: 'voice_rachel',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      voiceName: 'Rachel',
      gender: 'female',
      ttsModel: 'eleven_turbo_v2_5',
      enabled: true,
    },
    {
      id: 'voice_drew',
      voiceId: '29vD33N1CtxCmqQRPOHJ',
      voiceName: 'Drew',
      gender: 'male',
      ttsModel: 'eleven_turbo_v2_5',
      enabled: true,
    },
    {
      id: 'voice_clyde',
      voiceId: '2EiwWnXFnvU5JabPnv8n',
      voiceName: 'Clyde',
      gender: 'male',
      ttsModel: 'eleven_turbo_v2_5',
      enabled: true,
    },
    {
      id: 'voice_domi',
      voiceId: 'AZnzlk1XvdvUeBnXmlld',
      voiceName: 'Domi',
      gender: 'female',
      ttsModel: 'eleven_turbo_v2_5',
      enabled: true,
    },
    {
      id: 'voice_bella',
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      voiceName: 'Bella',
      gender: 'female',
      ttsModel: 'eleven_turbo_v2_5',
      enabled: true,
    },
  ];

  for (const voice of voices) {
    await db
      .insert(companionVoices)
      .values(voice)
      .onConflictDoNothing();
  }

  console.log(`  Inserted ${voices.length} voice entries`);

  await pool.end();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
