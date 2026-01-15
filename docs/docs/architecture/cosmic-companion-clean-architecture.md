---
sidebar_position: 10
---

# Cosmic Companion: Clean Architecture Design

> **Status**: Architecture Design Document
> **Feature**: Astrology-based NSFW AI Girlfriend Platform
> **Integration**: Anplexa Monorepo

---

## Executive Summary

This document defines the Clean Architecture for the Cosmic Companion feature - an astrology-powered intimate AI companion platform. The architecture extends the existing Anplexa monorepo while maintaining strict separation of concerns and the Dependency Rule.

### Key Architectural Goals

1. **Domain Isolation**: Astrology and companion logic independent of frameworks
2. **Testability**: 90%+ coverage on domain and use case layers
3. **Scalability**: Support for multi-tier subscriptions and high concurrency
4. **Compliance**: Built-in age verification and content moderation
5. **Integration**: Seamless connection with existing Anplexa infrastructure

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                    INFRASTRUCTURE LAYER                           |
|  (Frameworks, Drivers, External Services)                         |
|  - Next.js/Vite Apps      - PostgreSQL/Redis                     |
|  - Express API Server     - Stripe/ElevenLabs/SDXL APIs          |
|  - Swiss Ephemeris        - Age Verification (Yoti/Veriff)       |
+------------------------------------------------------------------+
|                    INTERFACE ADAPTERS LAYER                       |
|  (Controllers, Gateways, Presenters)                             |
|  - HTTP Controllers       - Repository Implementations            |
|  - WebSocket Handlers     - External Service Adapters            |
|  - GraphQL Resolvers      - Event Publishers                     |
+------------------------------------------------------------------+
|                    APPLICATION LAYER                              |
|  (Use Cases, Application Services)                               |
|  - Companion Management   - Birth Chart Analysis                 |
|  - Chat Orchestration     - Image Generation                     |
|  - Subscription Mgmt      - Memory Management                    |
|  - Age Verification       - Transit Awareness                    |
+------------------------------------------------------------------+
|                    DOMAIN LAYER                                   |
|  (Entities, Value Objects, Domain Services, Repository Interfaces)|
|  - BirthChart Entity      - Companion Entity                     |
|  - ZodiacSign VO          - Compatibility Score VO               |
|  - CompatibilityService   - TransitService                       |
|  - MemoryService          - PersonalityService                   |
+------------------------------------------------------------------+
```

---

## Part 1: Domain Layer

### 1.1 Core Entities

#### BirthChart Entity

```typescript
// packages/cosmic-companion/src/domain/entities/BirthChart.ts

import { ZodiacSign } from '../value-objects/ZodiacSign';
import { PlanetaryPosition } from '../value-objects/PlanetaryPosition';
import { HousePosition } from '../value-objects/HousePosition';

export interface BirthChartProps {
  id: string;
  userId: string;
  birthDate: Date;
  birthTime: string; // HH:MM format
  birthLocation: GeoLocation;
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  venusSign: ZodiacSign;
  marsSign: ZodiacSign;
  risingSign: ZodiacSign;
  mercurySign: ZodiacSign;
  planetaryPositions: PlanetaryPosition[];
  housePositions: HousePosition[];
  createdAt: Date;
  updatedAt: Date;
}

export class BirthChart {
  private constructor(private readonly props: BirthChartProps) {}

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get sunSign(): ZodiacSign { return this.props.sunSign; }
  get moonSign(): ZodiacSign { return this.props.moonSign; }
  get venusSign(): ZodiacSign { return this.props.venusSign; }
  get marsSign(): ZodiacSign { return this.props.marsSign; }
  get risingSign(): ZodiacSign { return this.props.risingSign; }

  /**
   * Get the dominant element (Fire, Earth, Air, Water)
   */
  getDominantElement(): Element {
    const elements = [
      this.sunSign.element,
      this.moonSign.element,
      this.venusSign.element,
      this.marsSign.element,
      this.risingSign.element
    ];

    const counts = elements.reduce((acc, el) => {
      acc[el] = (acc[el] || 0) + 1;
      return acc;
    }, {} as Record<Element, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0] as Element;
  }

  /**
   * Get the dominant modality (Cardinal, Fixed, Mutable)
   */
  getDominantModality(): Modality {
    const modalities = [
      this.sunSign.modality,
      this.moonSign.modality,
      this.venusSign.modality,
      this.marsSign.modality,
      this.risingSign.modality
    ];

    const counts = modalities.reduce((acc, mod) => {
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {} as Record<Modality, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0] as Modality;
  }

  static create(props: BirthChartProps): BirthChart {
    // Validation
    if (!props.birthDate || props.birthDate > new Date()) {
      throw new InvalidBirthDataError('Birth date must be in the past');
    }
    return new BirthChart(props);
  }
}
```

#### Companion Entity

```typescript
// packages/cosmic-companion/src/domain/entities/Companion.ts

import { ZodiacPersonality } from '../value-objects/ZodiacPersonality';
import { AppearanceConfig } from '../value-objects/AppearanceConfig';
import { VoiceConfig } from '../value-objects/VoiceConfig';
import { PersonalitySliders } from '../value-objects/PersonalitySliders';

export interface CompanionProps {
  id: string;
  userId: string;
  name: string;
  relationshipType: RelationshipType;
  zodiacPersonality: ZodiacPersonality;
  appearanceConfig: AppearanceConfig;
  voiceConfig: VoiceConfig;
  personalitySliders: PersonalitySliders;
  compatibilityScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType =
  | 'girlfriend'
  | 'companion'
  | 'soulmate'
  | 'friend_with_benefits'
  | 'muse';

export class Companion {
  private constructor(private readonly props: CompanionProps) {}

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get zodiacPersonality(): ZodiacPersonality { return this.props.zodiacPersonality; }
  get compatibilityScore(): number { return this.props.compatibilityScore; }

  /**
   * Get the system prompt for this companion based on zodiac personality
   */
  buildSystemPrompt(context: ConversationContext): string {
    const { sunSign, moonSign, venusSign, marsSign } = this.zodiacPersonality;

    return `You are ${this.name}, an AI companion with the following astrological personality:
- Sun in ${sunSign.name}: ${sunSign.coreTraits.join(', ')}
- Moon in ${moonSign.name}: ${moonSign.emotionalStyle}
- Venus in ${venusSign.name}: ${venusSign.loveLanguage}
- Mars in ${marsSign.name}: ${marsSign.passionStyle}

Relationship type: ${this.props.relationshipType}
Communication style: ${this.getCommStyle()}
Intimacy approach: ${this.getIntimacyApproach()}

${context.currentTransits ? `Current astrological context: ${context.currentTransits}` : ''}
${context.memoryContext ? `Remember: ${context.memoryContext}` : ''}`;
  }

  private getCommStyle(): string {
    const element = this.zodiacPersonality.sunSign.element;
    switch (element) {
      case 'fire': return 'Bold, confident, energetic, direct';
      case 'earth': return 'Grounded, sensual, attentive, loyal';
      case 'air': return 'Intellectual, playful, communicative, versatile';
      case 'water': return 'Emotional, intuitive, mysterious, deep';
    }
  }

  private getIntimacyApproach(): string {
    const marsElement = this.zodiacPersonality.marsSign.element;
    switch (marsElement) {
      case 'fire': return 'Dominant, assertive, adventurous';
      case 'earth': return 'Slow-building, sensory-focused, endurance';
      case 'air': return 'Experimental, verbal, variety-seeking';
      case 'water': return 'Emotional connection first, intense passion';
    }
  }

  /**
   * Update companion name
   */
  updateName(newName: string): Companion {
    if (!newName || newName.trim().length === 0) {
      throw new ValidationError('Companion name cannot be empty');
    }
    return new Companion({
      ...this.props,
      name: newName.trim(),
      updatedAt: new Date()
    });
  }

  static create(props: CompanionProps): Companion {
    if (props.compatibilityScore < 0 || props.compatibilityScore > 100) {
      throw new ValidationError('Compatibility score must be between 0 and 100');
    }
    return new Companion(props);
  }
}
```

#### Memory Entity

```typescript
// packages/cosmic-companion/src/domain/entities/Memory.ts

export type MemoryTier = 'short_term' | 'medium_term' | 'long_term';
export type MemoryCategory =
  | 'preference'
  | 'relationship_milestone'
  | 'emotional_pattern'
  | 'topic_interest'
  | 'intimacy_preference'
  | 'astrological_event';

export interface MemoryProps {
  id: string;
  userId: string;
  companionId: string;
  tier: MemoryTier;
  category: MemoryCategory;
  content: string;
  importance: number; // 0-100
  lastAccessed: Date;
  accessCount: number;
  expiresAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class Memory {
  private constructor(private readonly props: MemoryProps) {}

  get id(): string { return this.props.id; }
  get tier(): MemoryTier { return this.props.tier; }
  get category(): MemoryCategory { return this.props.category; }
  get content(): string { return this.props.content; }
  get importance(): number { return this.props.importance; }

  /**
   * Check if memory has expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  /**
   * Calculate relevance score based on recency and importance
   */
  calculateRelevance(): number {
    const recencyFactor = this.calculateRecencyFactor();
    const importanceFactor = this.props.importance / 100;
    const accessFactor = Math.min(this.props.accessCount / 10, 1);

    return (recencyFactor * 0.4) + (importanceFactor * 0.4) + (accessFactor * 0.2);
  }

  private calculateRecencyFactor(): number {
    const hoursSinceAccess =
      (Date.now() - this.props.lastAccessed.getTime()) / (1000 * 60 * 60);

    switch (this.props.tier) {
      case 'short_term':
        return Math.max(0, 1 - (hoursSinceAccess / 24)); // Decays over 24 hours
      case 'medium_term':
        return Math.max(0, 1 - (hoursSinceAccess / (24 * 30))); // Decays over 30 days
      case 'long_term':
        return 1; // Never decays
    }
  }

  /**
   * Record an access to this memory
   */
  recordAccess(): Memory {
    return new Memory({
      ...this.props,
      lastAccessed: new Date(),
      accessCount: this.props.accessCount + 1
    });
  }

  /**
   * Promote memory to a higher tier
   */
  promote(): Memory {
    const nextTier: Record<MemoryTier, MemoryTier> = {
      'short_term': 'medium_term',
      'medium_term': 'long_term',
      'long_term': 'long_term'
    };

    return new Memory({
      ...this.props,
      tier: nextTier[this.props.tier],
      expiresAt: this.calculateExpiryForTier(nextTier[this.props.tier])
    });
  }

  private calculateExpiryForTier(tier: MemoryTier): Date | null {
    switch (tier) {
      case 'short_term':
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      case 'medium_term':
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      case 'long_term':
        return null; // Never expires
    }
  }

  static create(props: MemoryProps): Memory {
    return new Memory(props);
  }
}
```

#### AgeVerification Entity

```typescript
// packages/cosmic-companion/src/domain/entities/AgeVerification.ts

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export type VerificationMethod =
  | 'government_id'
  | 'credit_card'
  | 'third_party_yoti'
  | 'third_party_veriff';

export interface AgeVerificationProps {
  id: string;
  userId: string;
  status: VerificationStatus;
  method: VerificationMethod;
  verifiedAt: Date | null;
  expiresAt: Date | null;
  externalVerificationId: string | null;
  metadata: {
    ageConfirmed: boolean;
    countryCode?: string;
    documentType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class AgeVerification {
  private constructor(private readonly props: AgeVerificationProps) {}

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get status(): VerificationStatus { return this.props.status; }
  get isVerified(): boolean { return this.props.status === 'verified'; }

  /**
   * Check if verification allows NSFW content access
   */
  canAccessNSFW(): boolean {
    if (this.props.status !== 'verified') return false;
    if (this.props.expiresAt && new Date() > this.props.expiresAt) return false;
    return this.props.metadata.ageConfirmed;
  }

  /**
   * Mark verification as complete
   */
  markVerified(externalId: string): AgeVerification {
    return new AgeVerification({
      ...this.props,
      status: 'verified',
      verifiedAt: new Date(),
      externalVerificationId: externalId,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: { ...this.props.metadata, ageConfirmed: true },
      updatedAt: new Date()
    });
  }

  /**
   * Mark verification as rejected
   */
  markRejected(reason: string): AgeVerification {
    return new AgeVerification({
      ...this.props,
      status: 'rejected',
      metadata: { ...this.props.metadata, rejectionReason: reason },
      updatedAt: new Date()
    });
  }

  static create(props: AgeVerificationProps): AgeVerification {
    return new AgeVerification(props);
  }
}
```

---

## Document Navigation

This is Part 1 of the Cosmic Companion Clean Architecture documentation. Continue reading:

- **Part 1** (This document): Core Entities
- **[Part 2: Value Objects](./cosmic-companion-value-objects.md)**: ZodiacSign, CompatibilityScore, ContentTier
- **[Part 3: Domain Services & Repositories](./cosmic-companion-domain-services.md)**: CompatibilityService, TransitService, Repository Interfaces
- **[Part 4: Use Cases](./cosmic-companion-use-cases.md)**: All application layer use cases
- **[Part 5: Structure & Data Flow](./cosmic-companion-structure.md)**: Folder structure, database schema, data flow diagrams
- **[Part 6: Implementation Guide](./cosmic-companion-implementation.md)**: Testing strategy, API endpoints, implementation phases
