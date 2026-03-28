/**
 * Voice/Video Call Routes (LiveKit)
 *
 * POST   /api/voice/token           — Generate LiveKit token, create room, dispatch agent
 * GET    /api/voice/status/:roomName — Get room status
 * GET    /api/voice/config           — Get agent pipeline config
 * PUT    /api/voice/config           — Update agent pipeline config (admin)
 * POST   /api/voice/events           — Batch call event ingestion
 * POST   /api/voice/webhooks         — LiveKit webhook receiver
 */

import { Router, type Request, type Response } from 'express';
import express from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { internalApiKeyMiddleware } from '../../middleware/internalApiKey.js';
import { LiveKitTokenRequestSchema, CallEventsRequestSchema } from '@anplexa/contracts';

export function createVoiceRoutes(container: Container): Router {
  const router = Router();
  const { authMiddleware, adminMiddleware } = createAuthMiddleware(container);

  // ──────────────────────────────────────────────────────────────────────────
  // POST /token — Generate LiveKit token + create room + dispatch agent
  // Requires JWT auth
  // ──────────────────────────────────────────────────────────────────────────

  router.post('/token', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const body = LiveKitTokenRequestSchema.parse(req.body);
      const userId = req.user!.sub;

      const { liveKitService, lettaAgentRepository, conversationRepository } = container.cradle;

      if (!liveKitService) {
        return res.status(503).json({ error: 'Voice/video calls not configured' });
      }

      // Resolve conversation and agent
      const conversation = await conversationRepository.getById(body.conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Build room name from conversation
      const roomName = `call_${body.conversationId}_${Date.now()}`;
      const hasVideo = body.hasVideo ?? false;

      // Room metadata for the agent worker
      const roomMetadata: Record<string, unknown> = {
        conversationId: body.conversationId,
        userId,
        hasVideo,
        backendUrl: process.env.API_BASE_URL || '',
      };

      // Determine agent name to dispatch
      let agentName = hasVideo ? 'anplexa-video-agent' : 'anplexa-voice-agent';

      // Include Letta agent ID in metadata if available
      if (conversation.lettaAgentId) {
        roomMetadata.lettaAgentId = conversation.lettaAgentId;
      } else {
        // Try to find from agent repo
        const agentRecord = await lettaAgentRepository.findByConversation(body.conversationId);
        if (agentRecord) {
          roomMetadata.lettaAgentId = agentRecord.lettaAgentId;
        }
      }

      // Include companion persona ID for agent configuration
      if (conversation.companionPersonaId) {
        roomMetadata.companionPersonaId = conversation.companionPersonaId;
      }

      // Create room, generate token, dispatch agent
      await liveKitService.createRoom(roomName, roomMetadata);

      const token = await liveKitService.generateToken(
        userId,
        roomName,
        { userId, conversationId: body.conversationId },
      );

      // Dispatch agent (fire-and-forget — it connects asynchronously)
      liveKitService.dispatchAgent(roomName, agentName, roomMetadata).catch((err: unknown) => {
        console.error(`[Voice] Failed to dispatch agent ${agentName}:`, err);
      });

      return res.json({
        token,
        roomName,
        wsUrl: liveKitService.wsUrl,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /status/:roomName — Get room/call status
  // Requires JWT auth
  // ──────────────────────────────────────────────────────────────────────────

  router.get('/status/:roomName', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const { roomName } = req.params;
      const { callEventService } = container.cradle;

      const events = await callEventService.getEventsByRoom(roomName);
      const lastEvent = events.length > 0 ? events[events.length - 1] : null;

      return res.json({
        roomName,
        eventCount: events.length,
        lastEvent: lastEvent
          ? {
              eventType: lastEvent.eventType,
              eventName: lastEvent.eventName,
              createdAt: lastEvent.createdAt,
            }
          : null,
      });
    } catch (error) {
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /config — Get LiveKit agent pipeline configuration
  // Requires JWT auth
  // ──────────────────────────────────────────────────────────────────────────

  router.get('/config', authMiddleware, async (_req: Request, res: Response, next) => {
    try {
      const { livekitAgentConfigRepository } = container.cradle;
      const configs = await livekitAgentConfigRepository.getAll();

      // Build response from key-value config pairs
      const configMap: Record<string, unknown> = {};
      for (const config of configs) {
        configMap[config.key] = config.value;
      }

      return res.json({
        sttModel: configMap['stt_model'] || 'deepgram',
        ttsModel: configMap['tts_model'] || 'elevenlabs',
        ttsVoice: configMap['tts_voice'] || 'default',
        llmModel: configMap['llm_model'] || 'ollama/qwen3-8b-nsfw:latest',
        turnDetection: {
          threshold: (configMap['turn_detection_threshold'] as number) || 0.5,
          prefixPaddingMs: (configMap['turn_detection_prefix_padding_ms'] as number) || 300,
          silenceDurationMs: (configMap['turn_detection_silence_duration_ms'] as number) || 500,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PUT /config — Update agent pipeline configuration
  // Requires JWT auth + admin
  // ──────────────────────────────────────────────────────────────────────────

  const configUpdateSchema = z.record(z.string(), z.unknown());

  router.put('/config', authMiddleware, adminMiddleware, async (req: Request, res: Response, next) => {
    try {
      const updates = configUpdateSchema.parse(req.body);
      const userId = req.user!.sub;

      const { livekitAgentConfigRepository } = container.cradle;

      const results: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        const updated = await livekitAgentConfigRepository.upsert(key, value, userId);
        results[key] = updated.value;
      }

      return res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // POST /events — Batch call event ingestion
  // Accepts internal API key auth (from Python agent worker)
  // ──────────────────────────────────────────────────────────────────────────

  router.post('/events', internalApiKeyMiddleware, async (req: Request, res: Response, next) => {
    try {
      const body = CallEventsRequestSchema.parse(req.body);
      const { callEventService } = container.cradle;

      await callEventService.logEvents(body.events);

      return res.status(202).json({ accepted: body.events.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // POST /webhooks — LiveKit webhook receiver
  // Validates webhook signature, then logs events
  // ──────────────────────────────────────────────────────────────────────────

  // Use express.raw() to preserve exact body bytes for webhook signature verification.
  // LiveKit signature verification requires the exact raw body — JSON.stringify(parsed)
  // may produce different output (key ordering, whitespace) and fail verification.
  router.post('/webhooks', express.raw({ type: '*/*' }), async (req: Request, res: Response, next) => {
    try {
      const { liveKitService, callEventService } = container.cradle;

      if (!liveKitService) {
        return res.status(503).json({ error: 'LiveKit not configured' });
      }

      // req.body is a Buffer from express.raw()
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const authHeader = req.headers.authorization || '';

      let event;
      try {
        event = await liveKitService.receiveWebhook(rawBody, authHeader);
      } catch (err) {
        console.warn('[Voice] Invalid webhook signature:', err);
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      // Map LiveKit webhook event to our call event format
      const webhookEvent = event as unknown as Record<string, unknown>;
      const eventType = (webhookEvent.event as string) || 'unknown';
      const room = webhookEvent.room as Record<string, unknown> | undefined;
      const roomName = (room?.name as string) || '';

      // Log the webhook event
      callEventService.logEvents([{
        roomName,
        roomSid: (room?.sid as string) || undefined,
        eventType: 'call',
        eventName: `webhook:${eventType}`,
        level: 'info',
        source: 'webhook',
        metadata: webhookEvent,
      }]).catch((err: unknown) => {
        console.error('[Voice] Failed to log webhook event:', err);
      });

      // Respond immediately
      return res.status(200).json({ received: eventType });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
