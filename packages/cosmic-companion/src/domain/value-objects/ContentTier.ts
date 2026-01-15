/**
 * ContentTier Value Object
 *
 * Represents subscription tiers with their associated quotas and permissions.
 * Based on product spec: Free, Astrology Seeker ($14.99), Cosmic Soulmate ($24.99), Astral Intimacy ($39.99)
 */

export type TierName = 'free' | 'astrology-seeker' | 'cosmic-soulmate' | 'astral-intimacy';

export type ContentLevel = 'sfw' | 'flirty' | 'explicit' | 'fantasy';

interface TierLimits {
  name: TierName;
  displayName: string;
  priceMonthly: number;
  messagesPerDay: number | 'unlimited';
  nsfwImagesPerMonth: number;
  voiceChatHoursPerMonth: number | 'unlimited';
  maxCompanions: number;
  allowedContentLevels: ContentLevel[];
  features: {
    fullBirthChart: boolean;
    longTermMemory: boolean;
    transitAwareness: boolean;
    roleplayScenarios: boolean;
    customScenarios: boolean;
    priorityImageGeneration: boolean;
    advancedCustomization: boolean;
    humanAstrologerConsult: boolean;
  };
}

export class ContentTier {
  private static readonly TIERS: Record<TierName, TierLimits> = {
    'free': {
      name: 'free',
      displayName: 'Free Tier',
      priceMonthly: 0,
      messagesPerDay: 10,
      nsfwImagesPerMonth: 0,
      voiceChatHoursPerMonth: 0,
      maxCompanions: 1,
      allowedContentLevels: ['sfw'],
      features: {
        fullBirthChart: false,
        longTermMemory: false,
        transitAwareness: false,
        roleplayScenarios: false,
        customScenarios: false,
        priorityImageGeneration: false,
        advancedCustomization: false,
        humanAstrologerConsult: false
      }
    },
    'astrology-seeker': {
      name: 'astrology-seeker',
      displayName: 'Astrology Seeker',
      priceMonthly: 14.99,
      messagesPerDay: 'unlimited',
      nsfwImagesPerMonth: 20,
      voiceChatHoursPerMonth: 10,
      maxCompanions: 1,
      allowedContentLevels: ['sfw', 'flirty', 'explicit'],
      features: {
        fullBirthChart: true,
        longTermMemory: false,
        transitAwareness: false,
        roleplayScenarios: false,
        customScenarios: false,
        priorityImageGeneration: false,
        advancedCustomization: false,
        humanAstrologerConsult: false
      }
    },
    'cosmic-soulmate': {
      name: 'cosmic-soulmate',
      displayName: 'Cosmic Soulmate',
      priceMonthly: 24.99,
      messagesPerDay: 'unlimited',
      nsfwImagesPerMonth: 1500, // 50/day
      voiceChatHoursPerMonth: 'unlimited',
      maxCompanions: 1,
      allowedContentLevels: ['sfw', 'flirty', 'explicit', 'fantasy'],
      features: {
        fullBirthChart: true,
        longTermMemory: true,
        transitAwareness: true,
        roleplayScenarios: true,
        customScenarios: false,
        priorityImageGeneration: false,
        advancedCustomization: true,
        humanAstrologerConsult: false
      }
    },
    'astral-intimacy': {
      name: 'astral-intimacy',
      displayName: 'Astral Intimacy',
      priceMonthly: 39.99,
      messagesPerDay: 'unlimited',
      nsfwImagesPerMonth: 3000, // 100/day
      voiceChatHoursPerMonth: 'unlimited',
      maxCompanions: 3,
      allowedContentLevels: ['sfw', 'flirty', 'explicit', 'fantasy'],
      features: {
        fullBirthChart: true,
        longTermMemory: true,
        transitAwareness: true,
        roleplayScenarios: true,
        customScenarios: true,
        priorityImageGeneration: true,
        advancedCustomization: true,
        humanAstrologerConsult: true
      }
    }
  };

  private constructor(private readonly limits: TierLimits) {}

  get name(): TierName {
    return this.limits.name;
  }

  get displayName(): string {
    return this.limits.displayName;
  }

  get priceMonthly(): number {
    return this.limits.priceMonthly;
  }

  /**
   * Check if user has exceeded daily message limit
   */
  hasExceededMessageLimit(messagesUsedToday: number): boolean {
    if (this.limits.messagesPerDay === 'unlimited') {
      return false;
    }
    return messagesUsedToday >= this.limits.messagesPerDay;
  }

  /**
   * Check if user has exceeded monthly image quota
   */
  hasExceededImageQuota(imagesUsedThisMonth: number): boolean {
    return imagesUsedThisMonth >= this.limits.nsfwImagesPerMonth;
  }

  /**
   * Check if content level is allowed
   */
  allowsContentLevel(level: ContentLevel): boolean {
    return this.limits.allowedContentLevels.includes(level);
  }

  /**
   * Check if user can create additional companions
   */
  canCreateCompanion(currentCompanions: number): boolean {
    return currentCompanions < this.limits.maxCompanions;
  }

  /**
   * Get remaining images for the month
   */
  getRemainingImages(usedThisMonth: number): number {
    const limit = this.limits.nsfwImagesPerMonth;
    if (limit === 0) return 0;
    return Math.max(0, limit - usedThisMonth);
  }

  /**
   * Check if feature is enabled
   */
  hasFeature(feature: keyof TierLimits['features']): boolean {
    return this.limits.features[feature];
  }

  static fromName(name: TierName): ContentTier {
    const limits = ContentTier.TIERS[name];
    if (!limits) {
      throw new Error(`Invalid tier name: ${name}`);
    }
    return new ContentTier(limits);
  }

  static getAllTiers(): ContentTier[] {
    return Object.values(ContentTier.TIERS).map(limits => new ContentTier(limits));
  }

  toJSON(): TierLimits {
    return { ...this.limits };
  }
}
