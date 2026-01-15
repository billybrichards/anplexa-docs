---
sidebar_position: 13
---

# Cosmic Companion: Use Cases Layer

## Part 2: Application Layer (Use Cases)

### 2.1 Birth Chart Use Cases

#### CreateBirthChartUseCase

```typescript
// packages/cosmic-companion/src/use-cases/birth-chart/CreateBirthChartUseCase.ts

import { IBirthChartRepository } from '../../domain/repositories/IBirthChartRepository';
import { BirthChart } from '../../domain/entities/BirthChart';
import { ZodiacSign } from '../../domain/value-objects/ZodiacSign';

export interface CreateBirthChartInput {
  userId: string;
  birthDate: string; // ISO date string
  birthTime: string; // HH:MM format
  birthCity: string;
  birthCountry: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CreateBirthChartOutput {
  birthChart: BirthChartDTO;
  sunSign: string;
  moonSign: string;
  venusSign: string;
  marsSign: string;
  risingSign: string;
  dominantElement: string;
}

export interface BirthChartDTO {
  id: string;
  userId: string;
  birthDate: string;
  birthTime: string;
  birthLocation: {
    city: string;
    country: string;
  };
  placements: {
    sun: string;
    moon: string;
    venus: string;
    mars: string;
    rising: string;
    mercury: string;
  };
  createdAt: string;
}

/**
 * Use case for creating a user's birth chart
 * Requires ephemeris service for accurate planetary calculations
 */
export class CreateBirthChartUseCase {
  constructor(
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly ephemerisService: IEphemerisService
  ) {}

  async execute(input: CreateBirthChartInput): Promise<CreateBirthChartOutput> {
    // Validate input
    this.validateInput(input);

    // Check if user already has a birth chart
    const existing = await this.birthChartRepository.findByUserId(input.userId);
    if (existing) {
      throw new BirthChartExistsError(input.userId);
    }

    // Calculate planetary positions using ephemeris
    const birthDateTime = new Date(`${input.birthDate}T${input.birthTime}`);
    const positions = await this.ephemerisService.calculatePositions(
      birthDateTime,
      input.latitude,
      input.longitude,
      input.timezone
    );

    // Create birth chart entity
    const birthChart = await this.birthChartRepository.create({
      userId: input.userId,
      birthDate: new Date(input.birthDate),
      birthTime: input.birthTime,
      birthLocation: {
        latitude: input.latitude,
        longitude: input.longitude,
        city: input.birthCity,
        country: input.birthCountry,
        timezone: input.timezone
      }
    });

    // Get zodiac signs from positions
    const sunSign = ZodiacSign.fromDegree(positions.sun);
    const moonSign = ZodiacSign.fromDegree(positions.moon);
    const venusSign = ZodiacSign.fromDegree(positions.venus);
    const marsSign = ZodiacSign.fromDegree(positions.mars);
    const risingSign = ZodiacSign.fromDegree(positions.ascendant);

    return {
      birthChart: this.toDTO(birthChart),
      sunSign: sunSign.name,
      moonSign: moonSign.name,
      venusSign: venusSign.name,
      marsSign: marsSign.name,
      risingSign: risingSign.name,
      dominantElement: birthChart.getDominantElement()
    };
  }

  private validateInput(input: CreateBirthChartInput): void {
    const birthDate = new Date(input.birthDate);
    if (isNaN(birthDate.getTime())) {
      throw new ValidationError('Invalid birth date format');
    }
    if (birthDate > new Date()) {
      throw new ValidationError('Birth date cannot be in the future');
    }
    if (!/^\d{2}:\d{2}$/.test(input.birthTime)) {
      throw new ValidationError('Birth time must be in HH:MM format');
    }
    if (input.latitude < -90 || input.latitude > 90) {
      throw new ValidationError('Invalid latitude');
    }
    if (input.longitude < -180 || input.longitude > 180) {
      throw new ValidationError('Invalid longitude');
    }
  }

  private toDTO(chart: BirthChart): BirthChartDTO {
    return {
      id: chart.id,
      userId: chart.userId,
      birthDate: chart.birthDate.toISOString(),
      birthTime: chart.birthTime,
      birthLocation: {
        city: chart.birthLocation.city,
        country: chart.birthLocation.country
      },
      placements: {
        sun: chart.sunSign.name,
        moon: chart.moonSign.name,
        venus: chart.venusSign.name,
        mars: chart.marsSign.name,
        rising: chart.risingSign.name,
        mercury: chart.mercurySign.name
      },
      createdAt: chart.createdAt.toISOString()
    };
  }
}

// Port interface for ephemeris service
export interface IEphemerisService {
  calculatePositions(
    dateTime: Date,
    latitude: number,
    longitude: number,
    timezone: string
  ): Promise<PlanetaryPositions>;
}

interface PlanetaryPositions {
  sun: number;
  moon: number;
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
  uranus: number;
  neptune: number;
  pluto: number;
  ascendant: number;
  midheaven: number;
}
```

---

### 2.2 Companion Use Cases

#### CreateCompanionUseCase

```typescript
// packages/cosmic-companion/src/use-cases/companion/CreateCompanionUseCase.ts

import { ICompanionRepository } from '../../domain/repositories/ICompanionRepository';
import { IBirthChartRepository } from '../../domain/repositories/IBirthChartRepository';
import { CompatibilityService } from '../../domain/services/CompatibilityService';
import { Companion } from '../../domain/entities/Companion';
import { ContentTier } from '../../domain/value-objects/ContentTier';

export interface CreateCompanionInput {
  userId: string;
  name: string;
  relationshipType: RelationshipType;
  customAppearance?: AppearanceOptions;
  customVoice?: VoiceOptions;
  personalityAdjustments?: PersonalityAdjustments;
}

export interface CreateCompanionOutput {
  companion: CompanionDTO;
  compatibilityScore: number;
  matchType: string;
  personalityTraits: string[];
  communicationStyle: string;
}

export class CreateCompanionUseCase {
  constructor(
    private readonly companionRepository: ICompanionRepository,
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly subscriptionService: ISubscriptionService,
    private readonly compatibilityService: CompatibilityService
  ) {}

  async execute(input: CreateCompanionInput): Promise<CreateCompanionOutput> {
    // Validate user has birth chart
    const birthChart = await this.birthChartRepository.findByUserId(input.userId);
    if (!birthChart) {
      throw new BirthChartRequiredError('Birth chart required to create companion');
    }

    // Check subscription tier limits
    const tier = await this.subscriptionService.getUserTier(input.userId);
    const currentCount = await this.companionRepository.countByUserId(input.userId);

    if (!tier.canCreateCompanion(currentCount)) {
      throw new CompanionLimitExceededError(
        `Your ${tier.tierName} plan allows ${tier.maxCompanions} companion(s)`
      );
    }

    // Generate optimal companion based on user's birth chart
    const generatedProfile = this.compatibilityService.generateOptimalCompanion(birthChart);

    // Create zodiac personality from generated profile
    const zodiacPersonality = ZodiacPersonality.create({
      sunSign: generatedProfile.sunSign,
      moonSign: generatedProfile.moonSign,
      venusSign: generatedProfile.venusSign,
      marsSign: generatedProfile.marsSign,
      risingSign: generatedProfile.risingSign
    });

    // Apply custom appearance or use zodiac defaults
    const appearanceConfig = input.customAppearance
      ? AppearanceConfig.fromOptions(input.customAppearance)
      : AppearanceConfig.fromZodiac(generatedProfile.sunSign);

    // Apply custom voice or use zodiac defaults
    const voiceConfig = input.customVoice
      ? VoiceConfig.fromOptions(input.customVoice)
      : VoiceConfig.fromZodiac(generatedProfile.sunSign);

    // Apply personality adjustments or use defaults
    const personalitySliders = input.personalityAdjustments
      ? PersonalitySliders.fromAdjustments(input.personalityAdjustments)
      : PersonalitySliders.fromZodiac(zodiacPersonality);

    // Create companion
    const companion = await this.companionRepository.create({
      userId: input.userId,
      name: input.name,
      relationshipType: input.relationshipType,
      zodiacPersonality,
      appearanceConfig,
      voiceConfig,
      personalitySliders,
      compatibilityScore: generatedProfile.compatibilityScore.overallScore
    });

    // Set as active if it's the first companion
    if (currentCount === 0) {
      await this.companionRepository.setActive(companion.id, input.userId);
    }

    return {
      companion: this.toDTO(companion),
      compatibilityScore: generatedProfile.compatibilityScore.overallScore,
      matchType: generatedProfile.compatibilityScore.matchType,
      personalityTraits: generatedProfile.personalityTraits,
      communicationStyle: generatedProfile.communicationStyle
    };
  }

  private toDTO(companion: Companion): CompanionDTO {
    return {
      id: companion.id,
      userId: companion.userId,
      name: companion.name,
      relationshipType: companion.relationshipType,
      compatibilityScore: companion.compatibilityScore,
      zodiacSigns: {
        sun: companion.zodiacPersonality.sunSign.name,
        moon: companion.zodiacPersonality.moonSign.name,
        venus: companion.zodiacPersonality.venusSign.name,
        mars: companion.zodiacPersonality.marsSign.name,
        rising: companion.zodiacPersonality.risingSign.name
      },
      isActive: companion.isActive,
      createdAt: companion.createdAt.toISOString()
    };
  }
}
```

---

### 2.3 Chat Use Cases

#### SendCompanionMessageUseCase

```typescript
// packages/cosmic-companion/src/use-cases/chat/SendCompanionMessageUseCase.ts

import { ICompanionRepository } from '../../domain/repositories/ICompanionRepository';
import { IMemoryRepository } from '../../domain/repositories/IMemoryRepository';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { TransitService } from '../../domain/services/TransitService';
import { Companion } from '../../domain/entities/Companion';

export interface SendCompanionMessageInput {
  userId: string;
  companionId: string;
  conversationId: string;
  content: string;
  contentMode: 'sfw' | 'flirty' | 'explicit' | 'fantasy';
}

export interface SendCompanionMessageOutput {
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
  memoryUpdates: string[];
  transitContext?: string;
}

export class SendCompanionMessageUseCase {
  constructor(
    private readonly companionRepository: ICompanionRepository,
    private readonly memoryRepository: IMemoryRepository,
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly aiService: IAIService,
    private readonly transitService: TransitService,
    private readonly ephemerisService: IEphemerisService,
    private readonly subscriptionService: ISubscriptionService,
    private readonly contentModerationService: IContentModerationService
  ) {}

  async execute(input: SendCompanionMessageInput): Promise<SendCompanionMessageOutput> {
    // Validate content mode access
    await this.validateContentModeAccess(input.userId, input.contentMode);

    // Get companion
    const companion = await this.companionRepository.findById(input.companionId);
    if (!companion || companion.userId !== input.userId) {
      throw new CompanionNotFoundError(input.companionId);
    }

    // Get conversation
    const conversation = await this.conversationRepository.getById(input.conversationId);
    if (!conversation || conversation.userId !== input.userId) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    // Content moderation check
    const moderationResult = await this.contentModerationService.check(input.content);
    if (!moderationResult.isAllowed) {
      throw new ContentViolationError(moderationResult.reason);
    }

    // Create user message
    const userMessage = await this.messageRepository.create({
      conversationId: input.conversationId,
      role: 'user',
      content: input.content
    });

    // Build context for AI
    const context = await this.buildConversationContext(
      companion,
      input.userId,
      input.conversationId,
      input.contentMode
    );

    // Get conversation history
    const previousMessages = await this.messageRepository.getByConversationId(
      input.conversationId,
      { limit: 20 }
    );

    // Generate AI response
    const systemPrompt = companion.buildSystemPrompt(context);
    const aiResponse = await this.aiService.generateResponse({
      systemPrompt,
      messages: this.formatMessages(previousMessages),
      newMessage: input.content,
      contentMode: input.contentMode,
      personality: {
        zodiacTraits: companion.zodiacPersonality,
        sliders: companion.personalitySliders
      }
    });

    // Create assistant message
    const assistantMessage = await this.messageRepository.create({
      conversationId: input.conversationId,
      role: 'assistant',
      content: aiResponse.content
    });

    // Extract and store memories
    const memoryUpdates = await this.processMemories(
      input.userId,
      input.companionId,
      input.content,
      aiResponse.content
    );

    // Update conversation timestamp
    await this.conversationRepository.update(input.conversationId, {
      updatedAt: new Date().toISOString()
    });

    return {
      userMessage: this.toMessageDTO(userMessage),
      assistantMessage: this.toMessageDTO(assistantMessage),
      memoryUpdates,
      transitContext: context.currentTransits ? 'Transit awareness active' : undefined
    };
  }

  private async validateContentModeAccess(
    userId: string,
    mode: string
  ): Promise<void> {
    const tier = await this.subscriptionService.getUserTier(userId);

    if (mode === 'explicit' || mode === 'fantasy') {
      if (!tier.canAccessNSFW()) {
        throw new ContentAccessDeniedError(
          `${mode} mode requires Astrology Seeker tier or higher`
        );
      }

      // Check age verification
      const isVerified = await this.subscriptionService.isAgeVerified(userId);
      if (!isVerified) {
        throw new AgeVerificationRequiredError(
          'Age verification required for explicit content'
        );
      }
    }
  }

  private async buildConversationContext(
    companion: Companion,
    userId: string,
    conversationId: string,
    contentMode: string
  ): Promise<ConversationContext> {
    // Get relevant memories
    const memories = await this.memoryRepository.findRelevant(
      userId,
      companion.id,
      10
    );

    const memoryContext = memories
      .map(m => m.content)
      .join('. ');

    // Get current transits if tier supports it
    const tier = await this.subscriptionService.getUserTier(userId);
    let currentTransits: string | undefined;

    if (tier.canAccessTransits()) {
      const transits = await this.ephemerisService.getCurrentTransits();
      const transitContext = this.transitService.generateTransitGreeting(
        { currentTransits: transits, currentMoonPhase: transits.moonPhase },
        await this.getBirthChart(userId)
      );
      currentTransits = transitContext;
    }

    return {
      memoryContext,
      currentTransits,
      contentMode,
      relationshipType: companion.relationshipType
    };
  }

  private async processMemories(
    userId: string,
    companionId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<string[]> {
    const updates: string[] = [];

    // Extract potential memories from conversation
    const extractedMemories = this.extractMemories(userMessage, aiResponse);

    for (const memory of extractedMemories) {
      await this.memoryRepository.create({
        userId,
        companionId,
        tier: 'short_term',
        category: memory.category,
        content: memory.content,
        importance: memory.importance
      });
      updates.push(`Remembered: ${memory.content.substring(0, 50)}...`);
    }

    // Promote eligible memories
    const promoted = await this.memoryRepository.promoteEligibleMemories(
      userId,
      companionId
    );
    if (promoted > 0) {
      updates.push(`${promoted} memories strengthened`);
    }

    return updates;
  }

  private extractMemories(userMessage: string, aiResponse: string): ExtractedMemory[] {
    const memories: ExtractedMemory[] = [];

    // Simple keyword-based extraction (production would use NLP)
    const preferenceKeywords = ['i like', 'i love', 'i prefer', 'i enjoy', 'i hate', 'i dislike'];
    const emotionalKeywords = ['i feel', 'makes me feel', 'i\'m feeling'];

    const lowerMessage = userMessage.toLowerCase();

    for (const keyword of preferenceKeywords) {
      if (lowerMessage.includes(keyword)) {
        memories.push({
          category: 'preference',
          content: userMessage,
          importance: 60
        });
        break;
      }
    }

    for (const keyword of emotionalKeywords) {
      if (lowerMessage.includes(keyword)) {
        memories.push({
          category: 'emotional_pattern',
          content: userMessage,
          importance: 70
        });
        break;
      }
    }

    return memories;
  }

  private formatMessages(messages: Message[]): ChatMessage[] {
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));
  }

  private toMessageDTO(message: Message): MessageDTO {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    };
  }
}

interface ConversationContext {
  memoryContext: string;
  currentTransits?: string;
  contentMode: string;
  relationshipType: string;
}

interface ExtractedMemory {
  category: MemoryCategory;
  content: string;
  importance: number;
}
```

---

### 2.4 Image Generation Use Cases

#### GenerateCompanionImageUseCase

```typescript
// packages/cosmic-companion/src/use-cases/image/GenerateCompanionImageUseCase.ts

import { ICompanionRepository } from '../../domain/repositories/ICompanionRepository';
import { IGeneratedImageRepository } from '../../domain/repositories/IGeneratedImageRepository';
import { IAgeVerificationRepository } from '../../domain/repositories/IAgeVerificationRepository';

export interface GenerateImageInput {
  userId: string;
  companionId: string;
  style: ImageStyle;
  isNSFW: boolean;
  customPrompt?: string;
  scenarioType?: string;
}

export interface GenerateImageOutput {
  image: GeneratedImageDTO;
  remainingQuota: number;
  processingTime: number;
}

export class GenerateCompanionImageUseCase {
  constructor(
    private readonly companionRepository: ICompanionRepository,
    private readonly imageRepository: IGeneratedImageRepository,
    private readonly ageVerificationRepository: IAgeVerificationRepository,
    private readonly subscriptionService: ISubscriptionService,
    private readonly imageGenerationService: IImageGenerationService,
    private readonly contentModerationService: IContentModerationService
  ) {}

  async execute(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const startTime = Date.now();

    // Get companion
    const companion = await this.companionRepository.findById(input.companionId);
    if (!companion || companion.userId !== input.userId) {
      throw new CompanionNotFoundError(input.companionId);
    }

    // Validate NSFW access
    if (input.isNSFW) {
      await this.validateNSFWAccess(input.userId);
    }

    // Check quota
    const tier = await this.subscriptionService.getUserTier(input.userId);
    const usedThisMonth = await this.imageRepository.countByUserInPeriod(
      input.userId,
      this.getMonthStart(),
      new Date()
    );

    if (tier.nsfwImagesPerMonth !== -1 && usedThisMonth >= tier.nsfwImagesPerMonth) {
      throw new ImageQuotaExceededError(
        `Monthly image limit (${tier.nsfwImagesPerMonth}) reached`
      );
    }

    // Build prompt based on companion's zodiac aesthetics
    const prompt = this.buildImagePrompt(companion, input);

    // Moderate custom prompt if provided
    if (input.customPrompt) {
      const modResult = await this.contentModerationService.checkImagePrompt(
        input.customPrompt
      );
      if (!modResult.isAllowed) {
        throw new ContentViolationError(modResult.reason);
      }
    }

    // Generate image
    const generationResult = await this.imageGenerationService.generate({
      prompt: prompt.positive,
      negativePrompt: prompt.negative,
      isNSFW: input.isNSFW,
      style: input.style,
      priority: tier.hasPriorityGeneration
    });

    // Store image record
    const image = await this.imageRepository.create({
      userId: input.userId,
      companionId: input.companionId,
      promptUsed: prompt.positive,
      imageUrl: generationResult.imageUrl,
      thumbnailUrl: generationResult.thumbnailUrl,
      isNSFW: input.isNSFW,
      zodiacAesthetic: companion.zodiacPersonality.sunSign.name,
      style: input.style
    });

    const processingTime = Date.now() - startTime;
    const remainingQuota = tier.nsfwImagesPerMonth === -1
      ? -1
      : tier.nsfwImagesPerMonth - usedThisMonth - 1;

    return {
      image: this.toDTO(image),
      remainingQuota,
      processingTime
    };
  }

  private async validateNSFWAccess(userId: string): Promise<void> {
    const tier = await this.subscriptionService.getUserTier(userId);
    if (!tier.canAccessNSFW()) {
      throw new ContentAccessDeniedError('NSFW images require paid subscription');
    }

    const hasVerification = await this.ageVerificationRepository.hasValidVerification(userId);
    if (!hasVerification) {
      throw new AgeVerificationRequiredError('Age verification required for NSFW images');
    }
  }

  private buildImagePrompt(
    companion: Companion,
    input: GenerateImageInput
  ): { positive: string; negative: string } {
    const aesthetics = companion.zodiacPersonality.sunSign.imageAesthetics;
    const appearance = companion.appearanceConfig;

    let positive = `beautiful ${appearance.ethnicity} woman, `;
    positive += `${appearance.bodyType} body type, `;
    positive += `${appearance.hairColor} ${appearance.hairLength} hair, `;
    positive += `${aesthetics.style}, `;
    positive += `${aesthetics.mood} mood, `;
    positive += `${aesthetics.themes.join(', ')}, `;
    positive += `professional photography, 8k, detailed, realistic skin texture`;

    if (input.customPrompt) {
      positive += `, ${input.customPrompt}`;
    }

    if (input.isNSFW && input.style === 'artistic_nude') {
      positive += `, artistic nude, tasteful, elegant`;
    }

    const negative = 'cartoon, anime, unrealistic, distorted, watermark, text, ' +
      'low quality, blurry, deformed, extra limbs';

    return { positive, negative };
  }

  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private toDTO(image: GeneratedImage): GeneratedImageDTO {
    return {
      id: image.id,
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl,
      isNSFW: image.isNSFW,
      style: image.style,
      createdAt: image.createdAt.toISOString()
    };
  }
}

// Port interface for image generation service
export interface IImageGenerationService {
  generate(options: {
    prompt: string;
    negativePrompt: string;
    isNSFW: boolean;
    style: ImageStyle;
    priority: boolean;
  }): Promise<{
    imageUrl: string;
    thumbnailUrl: string;
  }>;
}
```

---

### 2.5 Age Verification Use Cases

#### InitiateAgeVerificationUseCase

```typescript
// packages/cosmic-companion/src/use-cases/verification/InitiateAgeVerificationUseCase.ts

import { IAgeVerificationRepository } from '../../domain/repositories/IAgeVerificationRepository';
import { AgeVerification, VerificationMethod } from '../../domain/entities/AgeVerification';

export interface InitiateVerificationInput {
  userId: string;
  method: VerificationMethod;
  returnUrl: string;
}

export interface InitiateVerificationOutput {
  verificationId: string;
  verificationUrl: string;
  expiresAt: string;
}

export class InitiateAgeVerificationUseCase {
  constructor(
    private readonly verificationRepository: IAgeVerificationRepository,
    private readonly verificationProviderService: IVerificationProviderService
  ) {}

  async execute(input: InitiateVerificationInput): Promise<InitiateVerificationOutput> {
    // Check for existing verification
    const existing = await this.verificationRepository.findByUserId(input.userId);
    if (existing?.canAccessNSFW()) {
      throw new AlreadyVerifiedError('User already has valid age verification');
    }

    // Create verification record
    const verification = await this.verificationRepository.create({
      userId: input.userId,
      method: input.method
    });

    // Initiate verification with external provider
    const providerSession = await this.verificationProviderService.createSession({
      verificationId: verification.id,
      userId: input.userId,
      method: input.method,
      returnUrl: input.returnUrl,
      webhookUrl: `${process.env.API_URL}/webhooks/age-verification`
    });

    return {
      verificationId: verification.id,
      verificationUrl: providerSession.verificationUrl,
      expiresAt: providerSession.expiresAt.toISOString()
    };
  }
}

// Port interface for verification provider
export interface IVerificationProviderService {
  createSession(options: {
    verificationId: string;
    userId: string;
    method: VerificationMethod;
    returnUrl: string;
    webhookUrl: string;
  }): Promise<{
    sessionId: string;
    verificationUrl: string;
    expiresAt: Date;
  }>;

  handleWebhook(payload: unknown): Promise<{
    verificationId: string;
    status: 'verified' | 'rejected';
    externalId: string;
    reason?: string;
  }>;
}
```

---

### 2.6 Subscription Use Cases

#### CreateCosmicCheckoutUseCase

```typescript
// packages/cosmic-companion/src/use-cases/subscription/CreateCosmicCheckoutUseCase.ts

import { ContentTier, TierName } from '../../domain/value-objects/ContentTier';

export interface CreateCheckoutInput {
  userId: string;
  tierName: TierName;
  isAnnual: boolean;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutOutput {
  checkoutUrl: string;
  sessionId: string;
  tier: {
    name: string;
    price: number;
    features: string[];
  };
}

export class CreateCosmicCheckoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly stripeService: IStripeService
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    // Get user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // Validate tier
    const tier = ContentTier.fromName(input.tierName);
    if (tier.tierName === 'free') {
      throw new ValidationError('Cannot checkout for free tier');
    }

    // Calculate price with annual discount
    const monthlyPrice = tier.price;
    const finalPrice = input.isAnnual
      ? monthlyPrice * 12 * 0.8 // 20% annual discount
      : monthlyPrice;

    // Create Stripe checkout session
    const session = await this.stripeService.createCheckoutSession({
      customerId: user.stripeCustomerId,
      email: user.email,
      priceId: this.getPriceId(input.tierName, input.isAnnual),
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        userId: input.userId,
        tier: input.tierName,
        isAnnual: input.isAnnual.toString()
      }
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      tier: {
        name: tier.tierName,
        price: finalPrice,
        features: this.getTierFeatures(tier)
      }
    };
  }

  private getPriceId(tier: TierName, isAnnual: boolean): string {
    const priceIds: Record<string, string> = {
      'astrology_seeker_monthly': process.env.STRIPE_PRICE_SEEKER_MONTHLY!,
      'astrology_seeker_annual': process.env.STRIPE_PRICE_SEEKER_ANNUAL!,
      'cosmic_soulmate_monthly': process.env.STRIPE_PRICE_SOULMATE_MONTHLY!,
      'cosmic_soulmate_annual': process.env.STRIPE_PRICE_SOULMATE_ANNUAL!,
      'astral_intimacy_monthly': process.env.STRIPE_PRICE_INTIMACY_MONTHLY!,
      'astral_intimacy_annual': process.env.STRIPE_PRICE_INTIMACY_ANNUAL!
    };

    const key = `${tier}_${isAnnual ? 'annual' : 'monthly'}`;
    return priceIds[key];
  }

  private getTierFeatures(tier: ContentTier): string[] {
    const features: string[] = [];

    if (tier.hasUnlimitedMessages()) features.push('Unlimited messages');
    if (tier.canAccessNSFW()) features.push('NSFW content access');
    if (tier.canAccessVoice()) features.push('Voice chat');
    if (tier.canAccessTransits()) features.push('Transit awareness');
    if (tier.maxCompanions > 1) features.push(`Up to ${tier.maxCompanions} companions`);

    return features;
  }
}
```
