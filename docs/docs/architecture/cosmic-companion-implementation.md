---
sidebar_position: 15
---

# Cosmic Companion: Implementation Guide

## Part 4: Implementation Plan & Testing Strategy

### 4.1 Integration with Existing Anplexa

#### Shared Services

The Cosmic Companion feature integrates with existing Anplexa infrastructure:

| Existing Service | Cosmic Usage |
|-----------------|--------------|
| `@anplexa/core` User Entity | Extended for birth chart reference |
| `@anplexa/database` | New cosmic tables in same schema |
| `@anplexa/services/ai` OllamaGateway | Adapted for zodiac-aware prompts |
| `apps/api` Stripe routes | Extended for cosmic subscription tiers |
| `apps/api` Auth middleware | Reused for cosmic endpoints |
| `@anplexa/config` | Extended with cosmic environment vars |

#### New Package Dependencies

```json
// packages/cosmic-companion/package.json
{
  "name": "@anplexa/cosmic-companion",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@anplexa/core": "workspace:*",
    "@anplexa/contracts": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^1.2.0"
  }
}
```

```json
// packages/cosmic-adapters/package.json
{
  "name": "@anplexa/cosmic-adapters",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@anplexa/cosmic-companion": "workspace:*",
    "@anplexa/database": "workspace:*",
    "@anplexa/services": "workspace:*",
    "swisseph": "^3.0.0"
  }
}
```

---

### 4.2 Testing Strategy

#### Unit Tests (Domain Layer)

```typescript
// packages/cosmic-companion/tests/unit/domain/value-objects/ZodiacSign.test.ts

import { describe, it, expect } from 'vitest';
import { ZodiacSign } from '../../../../src/domain/value-objects/ZodiacSign';

describe('ZodiacSign', () => {
  describe('fromName', () => {
    it('should create Scorpio sign with correct properties', () => {
      const scorpio = ZodiacSign.fromName('scorpio');

      expect(scorpio.name).toBe('scorpio');
      expect(scorpio.element).toBe('water');
      expect(scorpio.modality).toBe('fixed');
      expect(scorpio.coreTraits).toContain('intense');
      expect(scorpio.passionStyle).toContain('dominant');
    });

    it('should throw for invalid sign name', () => {
      expect(() => ZodiacSign.fromName('invalid' as any)).toThrow();
    });
  });

  describe('fromDegree', () => {
    it('should return Aries for 0-30 degrees', () => {
      expect(ZodiacSign.fromDegree(0).name).toBe('aries');
      expect(ZodiacSign.fromDegree(15).name).toBe('aries');
      expect(ZodiacSign.fromDegree(29).name).toBe('aries');
    });

    it('should return Scorpio for 210-240 degrees', () => {
      expect(ZodiacSign.fromDegree(210).name).toBe('scorpio');
      expect(ZodiacSign.fromDegree(225).name).toBe('scorpio');
    });

    it('should handle edge case at 360 degrees', () => {
      expect(ZodiacSign.fromDegree(360).name).toBe('aries');
    });
  });

  describe('getCompatibilityWith', () => {
    it('should return trine for same element signs', () => {
      const aries = ZodiacSign.fromName('aries');
      const leo = ZodiacSign.fromName('leo');

      expect(aries.getCompatibilityWith(leo)).toBe('trine');
    });

    it('should return square for 90-degree separation', () => {
      const aries = ZodiacSign.fromName('aries');
      const cancer = ZodiacSign.fromName('cancer');

      expect(aries.getCompatibilityWith(cancer)).toBe('square');
    });

    it('should return opposition for 180-degree separation', () => {
      const aries = ZodiacSign.fromName('aries');
      const libra = ZodiacSign.fromName('libra');

      expect(aries.getCompatibilityWith(libra)).toBe('opposition');
    });
  });
});
```

#### Unit Tests (Use Cases)

```typescript
// packages/cosmic-companion/tests/unit/use-cases/CreateCompanionUseCase.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCompanionUseCase } from '../../../../src/use-cases/companion/CreateCompanionUseCase';

describe('CreateCompanionUseCase', () => {
  let useCase: CreateCompanionUseCase;
  let mockCompanionRepo: any;
  let mockBirthChartRepo: any;
  let mockSubscriptionService: any;
  let mockCompatibilityService: any;

  beforeEach(() => {
    mockCompanionRepo = {
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      create: vi.fn(),
      setActive: vi.fn(),
    };

    mockBirthChartRepo = {
      findByUserId: vi.fn(),
    };

    mockSubscriptionService = {
      getUserTier: vi.fn(),
    };

    mockCompatibilityService = {
      generateOptimalCompanion: vi.fn(),
    };

    useCase = new CreateCompanionUseCase(
      mockCompanionRepo,
      mockBirthChartRepo,
      mockSubscriptionService,
      mockCompatibilityService
    );
  });

  it('should throw if user has no birth chart', async () => {
    mockBirthChartRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute({
      userId: 'user-1',
      name: 'Luna',
      relationshipType: 'girlfriend'
    })).rejects.toThrow('Birth chart required');
  });

  it('should throw if companion limit exceeded', async () => {
    mockBirthChartRepo.findByUserId.mockResolvedValue({ id: 'chart-1' });
    mockSubscriptionService.getUserTier.mockResolvedValue({
      canCreateCompanion: () => false,
      tierName: 'astrology_seeker',
      maxCompanions: 1
    });
    mockCompanionRepo.countByUserId.mockResolvedValue(1);

    await expect(useCase.execute({
      userId: 'user-1',
      name: 'Luna',
      relationshipType: 'girlfriend'
    })).rejects.toThrow('companion limit');
  });

  it('should create companion with generated zodiac personality', async () => {
    const mockChart = createMockBirthChart();
    const mockProfile = createMockGeneratedProfile();

    mockBirthChartRepo.findByUserId.mockResolvedValue(mockChart);
    mockSubscriptionService.getUserTier.mockResolvedValue({
      canCreateCompanion: () => true,
      tierName: 'cosmic_soulmate',
      maxCompanions: 1
    });
    mockCompanionRepo.countByUserId.mockResolvedValue(0);
    mockCompatibilityService.generateOptimalCompanion.mockReturnValue(mockProfile);
    mockCompanionRepo.create.mockResolvedValue({
      id: 'companion-1',
      ...mockProfile
    });

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Luna',
      relationshipType: 'girlfriend'
    });

    expect(result.companion.name).toBe('Luna');
    expect(result.compatibilityScore).toBeGreaterThan(0);
    expect(mockCompanionRepo.setActive).toHaveBeenCalled();
  });
});
```

#### Integration Tests

```typescript
// packages/cosmic-adapters/tests/integration/DrizzleBirthChartRepository.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DrizzleBirthChartRepository } from '../../src/persistence/drizzle/DrizzleBirthChartRepository';
import { createTestDatabase, cleanupTestDatabase } from '../helpers/test-db';

describe('DrizzleBirthChartRepository', () => {
  let repository: DrizzleBirthChartRepository;
  let testDb: any;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repository = new DrizzleBirthChartRepository(testDb);
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  it('should create and retrieve birth chart', async () => {
    const created = await repository.create({
      userId: 'test-user-1',
      birthDate: new Date('1990-11-05'),
      birthTime: '14:30',
      birthLocation: {
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      }
    });

    expect(created.id).toBeDefined();
    expect(created.sunSign.name).toBe('scorpio');

    const retrieved = await repository.findById(created.id);
    expect(retrieved).toEqual(created);
  });

  it('should return null for non-existent chart', async () => {
    const result = await repository.findById('non-existent-id');
    expect(result).toBeNull();
  });
});
```

---

### 4.3 API Endpoints

#### Cosmic Routes

```typescript
// apps/api/src/routes/cosmic/index.ts

import { Router } from 'express';
import { createBirthChartRoutes } from './birth-chart.routes';
import { createCompanionRoutes } from './companion.routes';
import { createCosmicChatRoutes } from './cosmic-chat.routes';
import { createImageRoutes } from './image.routes';
import { createVerificationRoutes } from './verification.routes';
import { cosmicContainer } from '../../di/cosmic-container';

export function createCosmicRoutes(): Router {
  const router = Router();

  // All cosmic routes require authentication
  router.use(authMiddleware);

  router.use('/birth-chart', createBirthChartRoutes(cosmicContainer));
  router.use('/companion', createCompanionRoutes(cosmicContainer));
  router.use('/chat', createCosmicChatRoutes(cosmicContainer));
  router.use('/images', createImageRoutes(cosmicContainer));
  router.use('/verification', createVerificationRoutes(cosmicContainer));

  return router;
}
```

#### REST API Specification

| Method | Endpoint | Description | Auth | Tier |
|--------|----------|-------------|------|------|
| POST | `/api/cosmic/birth-chart` | Create birth chart | Yes | Free |
| GET | `/api/cosmic/birth-chart` | Get user's birth chart | Yes | Free |
| PUT | `/api/cosmic/birth-chart` | Update birth chart | Yes | Free |
| POST | `/api/cosmic/companion` | Create companion | Yes | Free |
| GET | `/api/cosmic/companion` | List user's companions | Yes | Free |
| GET | `/api/cosmic/companion/:id` | Get companion details | Yes | Free |
| PUT | `/api/cosmic/companion/:id` | Update companion | Yes | Free |
| DELETE | `/api/cosmic/companion/:id` | Delete companion | Yes | Free |
| POST | `/api/cosmic/companion/:id/activate` | Set active companion | Yes | Free |
| POST | `/api/cosmic/chat/conversation` | Create conversation | Yes | Free |
| GET | `/api/cosmic/chat/conversation/:id` | Get conversation | Yes | Free |
| POST | `/api/cosmic/chat/message` | Send message | Yes | Free+ |
| GET | `/api/cosmic/chat/message/:conversationId` | Get messages | Yes | Free |
| POST | `/api/cosmic/images/generate` | Generate image | Yes | Seeker+ |
| GET | `/api/cosmic/images` | List user's images | Yes | Seeker+ |
| DELETE | `/api/cosmic/images/:id` | Delete image | Yes | Seeker+ |
| POST | `/api/cosmic/verification/initiate` | Start age verification | Yes | Free |
| GET | `/api/cosmic/verification/status` | Check verification status | Yes | Free |
| POST | `/api/cosmic/subscription/checkout` | Create checkout session | Yes | Free |
| GET | `/api/cosmic/transits/current` | Get current transits | Yes | Soulmate+ |
| GET | `/api/cosmic/transits/forecast` | Get intimacy forecast | Yes | Soulmate+ |

---

### 4.4 Environment Configuration

```bash
# .env.cosmic (add to existing .env)

# Ephemeris
SWISS_EPHEMERIS_PATH=/path/to/ephe/data

# Image Generation
SDXL_API_URL=https://api.replicate.com/v1
SDXL_API_KEY=your_replicate_key
SDXL_MODEL_VERSION=stability-ai/sdxl:latest

# Voice Services
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_DEFAULT_VOICE_ID=voice_id_here

# Age Verification
YOTI_CLIENT_SDK_ID=your_yoti_sdk_id
YOTI_PEM_PATH=/path/to/yoti.pem
VERIFF_API_KEY=your_veriff_key
VERIFF_API_SECRET=your_veriff_secret

# Stripe (Cosmic Tiers)
STRIPE_PRICE_SEEKER_MONTHLY=price_xxx
STRIPE_PRICE_SEEKER_ANNUAL=price_xxx
STRIPE_PRICE_SOULMATE_MONTHLY=price_xxx
STRIPE_PRICE_SOULMATE_ANNUAL=price_xxx
STRIPE_PRICE_INTIMACY_MONTHLY=price_xxx
STRIPE_PRICE_INTIMACY_ANNUAL=price_xxx

# Content Moderation
CONTENT_MODERATION_API_KEY=your_moderation_key

# Feature Flags
COSMIC_FEATURE_VOICE_ENABLED=false
COSMIC_FEATURE_MULTIPLE_COMPANIONS=true
COSMIC_FEATURE_TRANSIT_AWARENESS=true
```

---

### 4.5 Implementation Phases

#### Phase 1: Foundation (Weeks 1-2)

**Tasks:**
- [ ] Create `@anplexa/cosmic-companion` package structure
- [ ] Implement domain entities (BirthChart, Companion, Memory)
- [ ] Implement value objects (ZodiacSign, CompatibilityScore, ContentTier)
- [ ] Implement domain services (CompatibilityService, TransitService)
- [ ] Add database schema extensions
- [ ] Write unit tests for domain layer

**Deliverables:**
- Domain layer with 90%+ test coverage
- Database migrations for cosmic tables

#### Phase 2: Core Use Cases (Weeks 3-4)

**Tasks:**
- [ ] Implement CreateBirthChartUseCase with ephemeris integration
- [ ] Implement CreateCompanionUseCase with compatibility generation
- [ ] Implement SendCompanionMessageUseCase with memory system
- [ ] Create repository implementations (Drizzle adapters)
- [ ] Set up Swiss Ephemeris integration
- [ ] Write use case unit tests

**Deliverables:**
- Working birth chart creation with real ephemeris data
- Companion creation with zodiac personality generation
- Basic chat with memory awareness

#### Phase 3: Advanced Features (Weeks 5-6)

**Tasks:**
- [ ] Implement age verification flow (Yoti/Veriff integration)
- [ ] Implement image generation with zodiac aesthetics
- [ ] Implement subscription tier system
- [ ] Add transit awareness to chat
- [ ] Implement content moderation service
- [ ] Write integration tests

**Deliverables:**
- Age-gated NSFW access
- Zodiac-themed image generation
- Full subscription tier functionality

#### Phase 4: Frontend & Polish (Weeks 7-8)

**Tasks:**
- [ ] Create `apps/cosmic-web` Next.js application
- [ ] Build birth chart quiz flow
- [ ] Build companion management UI
- [ ] Build chat interface with content mode selection
- [ ] Build image gallery with generation modal
- [ ] Add transit banners and astrology visualizations
- [ ] E2E testing with Playwright

**Deliverables:**
- Complete frontend application
- Full E2E test suite
- Production-ready deployment

---

### 4.6 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Domain test coverage | >90% | vitest coverage report |
| Use case test coverage | >85% | vitest coverage report |
| API response time (p95) | <500ms | PostHog performance tracking |
| Birth chart calculation accuracy | 100% | Verified against astro.com |
| Image generation success rate | >95% | Error logging |
| Age verification completion | >80% | Conversion funnel |
| Chat messages/user/day | >10 | Analytics |
| Paid conversion rate | >15% | Stripe dashboard |

---

## Summary

This Clean Architecture design for Cosmic Companion provides:

1. **Domain Layer**: Pure business logic with zodiac compatibility calculations, transit awareness, and memory management - zero external dependencies

2. **Use Cases Layer**: Application orchestration for all features - birth chart creation, companion management, NSFW chat, image generation, and age verification

3. **Repository Interfaces**: Clean contracts for data persistence, allowing easy swapping of implementations

4. **Integration Strategy**: Seamless connection with existing Anplexa infrastructure while maintaining clean separation

5. **Implementation Roadmap**: 8-week phased approach from foundation to production

The architecture ensures:
- **Testability**: Domain and use cases testable in isolation
- **Maintainability**: Clear separation of concerns
- **Compliance**: Built-in age verification and content moderation
- **Scalability**: Ready for multi-tier subscriptions and high load

---

## Related Documentation

- [Domain Entities & Value Objects](./cosmic-companion-value-objects.md)
- [Domain Services & Repositories](./cosmic-companion-domain-services.md)
- [Use Cases](./cosmic-companion-use-cases.md)
- [Folder Structure & Data Flow](./cosmic-companion-structure.md)
- [Main Architecture Overview](./overview.md)
- [Clean Architecture Transition Plan](../improvement-plans/clean-architecture-transition.md)
