/**
 * Dependency Injection Container
 *
 * Uses Awilix for dependency injection.
 * Wires up repositories, services, and use cases from @anplexa/core.
 */

import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { postgres as schema } from '@anplexa/database';
import {
  UserRepository,
  ConversationRepository,
  MessageRepository,
  SessionRepository,
  PasswordResetTokenRepository,
  ApiKeyRepository,
  FunnelApiKeyRepository,
  ApiUsageRepository,
  UserFeedbackRepository,
  BirthChartRepository,
  CompanionPersonaRepository,
  LettaAgentRepository,
  MediaGenerationRepository,
  WorkflowRepository,
  ActivityLogRepository,
  CompanionVoiceRepository,
  VoiceCallMetadataRepository,
  LivekitAgentConfigRepository,
  LivekitCallEventRepository,
  ChatDebugLogRepository,
  createAllUseCases,
  type AllUseCases,
} from '@anplexa/core';
import {
  JWTService,
  PasswordService,
  OllamaGateway,
  OllamaLLMService,
  ClaudeLLMService,
  SimplifiedAstrologyService,
  MockTraitAnalysisService,
  ClaudeTraitAnalysisService,
  LettaGateway,
  MediaToolService,
  ComfyUIGateway,
  WorkflowBuilder,
  NativeMediaService,
  AgentProvisioner,
  ProfileGeneratorAgent,
  RateLimitService,
  LiveKitService,
  CallEventService,
} from '@anplexa/services';
import type { ILLMService } from '@anplexa/core/domain/services/ILLMService';
import type { ITraitAnalysisService } from '@anplexa/core/domain/services/ITraitAnalysisService';

/**
 * Email Scheduler service interface
 */
export interface EmailScheduler {
  processPendingEmails(): Promise<{ sent: number; failed: number }>;
  scheduleWaitlistInvite(userId: string): Promise<void>;
  cancelPendingEmails(userId: string): Promise<void>;
  trackEmailOpen(logId: string): Promise<void>;
  trackEmailClick(logId: string, source: string): Promise<void>;
}

/**
 * Container interface defining all dependencies
 */
export interface AppContainer {
  // Database & Infrastructure
  pool: Pool;
  db: ReturnType<typeof drizzle>;
  redis: Redis | null;

  // Repositories
  userRepository: UserRepository;
  conversationRepository: ConversationRepository;
  messageRepository: MessageRepository;
  sessionRepository: SessionRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  apiKeyRepository: ApiKeyRepository;
  funnelApiKeyRepository: FunnelApiKeyRepository;
  apiUsageRepository: ApiUsageRepository;
  userFeedbackRepository: UserFeedbackRepository;
  birthChartRepository: BirthChartRepository;
  companionPersonaRepository: CompanionPersonaRepository;
  activityLogRepository: ActivityLogRepository;
  companionVoiceRepository: CompanionVoiceRepository;
  voiceCallMetadataRepository: VoiceCallMetadataRepository;
  livekitAgentConfigRepository: LivekitAgentConfigRepository;
  livekitCallEventRepository: LivekitCallEventRepository;
  chatDebugLogRepository: ChatDebugLogRepository;

  // Services
  jwtService: JWTService;
  passwordService: PasswordService;
  ollamaGateway: OllamaGateway;
  astrologyService: SimplifiedAstrologyService;
  traitAnalysisService: ITraitAnalysisService;
  lettaGateway: LettaGateway;
  mediaToolService: MediaToolService;
  comfyUIGateway: ComfyUIGateway;
  workflowBuilder: WorkflowBuilder;
  nativeMediaService: NativeMediaService;
  llmService: ILLMService;
  lettaAgentRepository: LettaAgentRepository;
  mediaGenerationRepository: MediaGenerationRepository;
  workflowRepository: WorkflowRepository;
  agentProvisioner: AgentProvisioner;
  profileGeneratorAgent: ProfileGeneratorAgent;
  emailScheduler: EmailScheduler;
  rateLimitService: RateLimitService;
  liveKitService: LiveKitService | null;
  callEventService: CallEventService;

  // Use Cases
  useCases: AllUseCases;
}

/**
 * Create and configure the DI container
 */
export function configureContainer(): ReturnType<typeof createContainer<AppContainer>> {
  const container = createContainer<AppContainer>({
    injectionMode: InjectionMode.CLASSIC,
  });

  // Database setup
  container.register({
    // PostgreSQL connection pool
    pool: asFunction(() => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      return new Pool({ connectionString });
    }).singleton(),

    // Drizzle ORM instance with PostgreSQL
    // NOTE: Resolve pool from cradle explicitly — Awilix CLASSIC mode
    // silently fails to inject destructured arrow function params.
    db: asFunction(() => {
      return drizzle(container.cradle.pool, { schema });
    }).singleton(),

    // Redis (optional — degrades gracefully if REDIS_URL not set)
    redis: asFunction(() => {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        console.warn('[DI] No REDIS_URL — rate limiting will be unavailable');
        return null;
      }
      return new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    }).singleton(),

    // Repositories
    userRepository: asClass(UserRepository).singleton(),
    conversationRepository: asClass(ConversationRepository).singleton(),
    messageRepository: asClass(MessageRepository).singleton(),
    sessionRepository: asClass(SessionRepository).singleton(),
    passwordResetTokenRepository: asClass(PasswordResetTokenRepository).singleton(),
    apiKeyRepository: asClass(ApiKeyRepository).singleton(),
    funnelApiKeyRepository: asClass(FunnelApiKeyRepository).singleton(),
    apiUsageRepository: asClass(ApiUsageRepository).singleton(),
    userFeedbackRepository: asClass(UserFeedbackRepository).singleton(),
    birthChartRepository: asClass(BirthChartRepository).singleton(),
    companionPersonaRepository: asClass(CompanionPersonaRepository).singleton(),
    activityLogRepository: asClass(ActivityLogRepository).singleton(),
    companionVoiceRepository: asClass(CompanionVoiceRepository).singleton(),
    voiceCallMetadataRepository: asClass(VoiceCallMetadataRepository).singleton(),
    livekitAgentConfigRepository: asClass(LivekitAgentConfigRepository).singleton(),
    livekitCallEventRepository: asClass(LivekitCallEventRepository).singleton(),
    chatDebugLogRepository: asClass(ChatDebugLogRepository).singleton(),

    // Services
    jwtService: asFunction(() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      return new JWTService({
        secret,
        accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
      });
    }).singleton(),

    passwordService: asClass(PasswordService).singleton(),

    ollamaGateway: asFunction(() => {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const apiKey = process.env.OLLAMA_API_KEY || '';
      return new OllamaGateway({
        baseUrl,
        apiKey,
        generalModel: process.env.OLLAMA_GENERAL_MODEL || 'llama2',
        longFormModel: process.env.OLLAMA_LONG_FORM_MODEL || 'llama2',
      });
    }).singleton(),

    astrologyService: asClass(SimplifiedAstrologyService).singleton(),

    traitAnalysisService: asFunction(() => {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        console.log('[DI] Using ClaudeTraitAnalysisService (Anthropic API)');
        return new ClaudeTraitAnalysisService(anthropicKey);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ANTHROPIC_API_KEY is required in production for trait analysis');
      }
      console.warn('[DI] WARNING: No ANTHROPIC_API_KEY — using MockTraitAnalysisService (dev only)');
      return new MockTraitAnalysisService();
    }).singleton(),

    // Migration repositories
    lettaAgentRepository: asClass(LettaAgentRepository).singleton(),
    mediaGenerationRepository: asClass(MediaGenerationRepository).singleton(),
    workflowRepository: asClass(WorkflowRepository).singleton(),

    // Agent provisioning
    agentProvisioner: asFunction(() => {
      const c = container.cradle;
      return new AgentProvisioner(c.lettaGateway, c.lettaAgentRepository, {
        chatModel: process.env.LETTA_CHAT_MODEL || 'ollama/qwen3-8b-nsfw:latest',
        embeddingModel: process.env.LETTA_EMBEDDING_MODEL || 'ollama/nomic-embed-text:latest',
      });
    }).singleton(),

    profileGeneratorAgent: asFunction(() =>
      new ProfileGeneratorAgent(container.cradle.nativeMediaService),
    ).singleton(),

    // FIX: Use ClaudeLLMService when ANTHROPIC_API_KEY is available (required for Railway
    // where Ollama is not running). Mirrors the traitAnalysisService pattern above.
    llmService: asFunction(() => {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        console.log('[DI] Using ClaudeLLMService for companion generation (Anthropic API)');
        return new ClaudeLLMService({
          apiKey: anthropicKey,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
        });
      }
      // Fallback to Ollama for local development
      console.warn('[DI] No ANTHROPIC_API_KEY — falling back to OllamaLLMService (local dev only)');
      const model = process.env.OLLAMA_LONG_FORM_MODEL || process.env.OLLAMA_GENERAL_MODEL || 'llama2';
      return new OllamaLLMService(container.cradle.ollamaGateway, model);
    }).singleton(),

    // Letta
    lettaGateway: asFunction(() => new LettaGateway({
      baseUrl: process.env.LETTA_API_URL || 'http://localhost:8283',
      apiKey: process.env.LETTA_API_KEY,
      timeout: 180000,
    })).singleton(),

    mediaToolService: asFunction(() => new MediaToolService()).singleton(),

    // ComfyUI
    comfyUIGateway: asFunction(() => new ComfyUIGateway({
      baseUrl: process.env.COMFYUI_API_URL || '',
      apiKey: process.env.COMFYUI_API_KEY || '',
    })).singleton(),

    workflowBuilder: asFunction(() =>
      new WorkflowBuilder(container.cradle.workflowRepository)
    ).singleton(),

    nativeMediaService: asFunction(() => {
      const c = container.cradle;
      return new NativeMediaService(c.comfyUIGateway, c.workflowBuilder, {
        s3Config: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          bucketName: process.env.AWS_S3_BUCKET_NAME || 'anplexa-media',
          region: process.env.AWS_REGION || 'us-east-1',
        },
      }, c.mediaGenerationRepository);
    }).singleton(),

    // Rate Limiting
    rateLimitService: asFunction(() => {
      return new RateLimitService(container.cradle.redis, {
        freeLimit: parseInt(process.env.RATE_LIMIT_FREE_DAILY || '5', 10),
      });
    }).singleton(),

    // LiveKit Voice/Video
    liveKitService: asFunction(() => {
      const url = process.env.LIVEKIT_URL;
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      if (!url || !apiKey || !apiSecret) {
        console.warn('[DI] LiveKit not configured — voice/video calls unavailable');
        return null;
      }
      return new LiveKitService({ url, apiKey, apiSecret });
    }).singleton(),

    callEventService: asFunction(() => {
      return new CallEventService(container.cradle.livekitCallEventRepository);
    }).singleton(),

    // Email Scheduler (stub for dev/testing — replace with real implementation)
    emailScheduler: asFunction(() => ({
      async processPendingEmails() { console.warn('[EmailScheduler] Stub: processPendingEmails'); return { sent: 0, failed: 0 }; },
      async scheduleWaitlistInvite(_userId: string) { console.warn('[EmailScheduler] Stub: scheduleWaitlistInvite'); },
      async cancelPendingEmails(_userId: string) { console.warn('[EmailScheduler] Stub: cancelPendingEmails'); },
      async trackEmailOpen(_logId: string) { console.warn('[EmailScheduler] Stub: trackEmailOpen'); },
      async trackEmailClick(_logId: string, _source: string) { console.warn('[EmailScheduler] Stub: trackEmailClick'); },
    } satisfies EmailScheduler)).singleton(),

    // Use Cases - wire up all use cases using the factory
    // NOTE: Resolve deps directly from container.cradle instead of relying on
    // Awilix CLASSIC mode parameter parsing, which silently fails to inject
    // destructured arrow function params beyond a certain count.
    useCases: asFunction(() => {
      const c = container.cradle;
      return createAllUseCases({
        userRepository: c.userRepository,
        conversationRepository: c.conversationRepository,
        messageRepository: c.messageRepository,
        sessionRepository: c.sessionRepository,
        birthChartRepository: c.birthChartRepository,
        companionPersonaRepository: c.companionPersonaRepository,
        passwordService: c.passwordService,
        jwtService: c.jwtService,
        astrologyService: c.astrologyService,
        ollamaGateway: c.ollamaGateway,
        traitAnalysisService: c.traitAnalysisService,
        llmService: c.llmService,
      });
    }).singleton(),
  });

  return container;
}

/**
 * Type-safe container resolution
 */
export type Container = ReturnType<typeof configureContainer>;
