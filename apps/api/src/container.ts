/**
 * Dependency Injection Container
 *
 * Uses Awilix for dependency injection.
 * Wires up repositories, services, and use cases from @anplexa/core.
 */

import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
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
  createAllUseCases,
  type AllUseCases,
} from '@anplexa/core';
import {
  JWTService,
  PasswordService,
  OllamaGateway,
  SimplifiedAstrologyService,
  MockTraitAnalysisService,
} from '@anplexa/services';
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
  // Database
  pool: Pool;
  db: ReturnType<typeof drizzle>;

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

  // Services
  jwtService: JWTService;
  passwordService: PasswordService;
  ollamaGateway: OllamaGateway;
  astrologyService: SimplifiedAstrologyService;
  traitAnalysisService: ITraitAnalysisService;
  emailScheduler: EmailScheduler;

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
    db: asFunction(({ pool }) => {
      return drizzle(pool, { schema });
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

    traitAnalysisService: asFunction(() => new MockTraitAnalysisService()).singleton(),

    // Use Cases - wire up all use cases using the factory
    useCases: asFunction(({
      userRepository,
      conversationRepository,
      messageRepository,
      sessionRepository,
      birthChartRepository,
      companionPersonaRepository,
      passwordService,
      jwtService,
      astrologyService,
      ollamaGateway,
      traitAnalysisService,
    }) => {
      return createAllUseCases({
        userRepository,
        conversationRepository,
        messageRepository,
        sessionRepository,
        birthChartRepository,
        companionPersonaRepository,
        passwordService,
        jwtService,
        astrologyService,
        ollamaGateway,
        traitAnalysisService,
      });
    }).singleton(),
  });

  return container;
}

/**
 * Type-safe container resolution
 */
export type Container = ReturnType<typeof configureContainer>;
