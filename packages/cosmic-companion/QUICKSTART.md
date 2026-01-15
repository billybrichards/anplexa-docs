# Cosmic Companion - Quick Start Guide

## What's Been Built

The Cosmic Companion feature has been implemented following **Clean Architecture** principles with a complete domain layer, core use cases, and database schema.

**✅ Complete (60%)**:
- Full domain layer with zodiac compatibility logic
- Core use cases (birth chart creation, companion generation, chat)
- Complete database schema (8 tables)
- Example repository implementation

**🚧 In Progress**:
- Adapter implementations
- API routes
- Frontend pages

---

## Project Structure

```
packages/
├── cosmic-companion/           # Domain + Use Cases (COMPLETE ✅)
│   ├── src/domain/
│   │   ├── entities/          # BirthChart, Companion, Memory, AgeVerification
│   │   ├── value-objects/     # ZodiacSign, CompatibilityScore, ContentTier, etc.
│   │   ├── services/          # CompatibilityService, TransitService
│   │   ├── repositories/      # Repository interfaces
│   │   └── errors/            # Domain errors
│   ├── src/use-cases/
│   │   ├── birth-chart/       # CreateBirthChartUseCase ✅
│   │   ├── companion/         # CreateCompanionUseCase ✅
│   │   ├── chat/              # SendCosmicMessageUseCase ✅
│   │   └── ports/             # External service interfaces ✅
│   └── IMPLEMENTATION-STATUS.md
│
├── cosmic-adapters/            # Infrastructure (PARTIAL ⚠️)
│   └── src/
│       ├── persistence/drizzle/  # Repository implementations
│       └── external/             # External service adapters
│
└── database/
    └── src/schema/
        └── cosmic-postgres.ts  # 8 tables for Cosmic Companion ✅
```

---

## How to Continue Implementation

### Step 1: Complete Repository Adapters

Follow the pattern from `DrizzleBirthChartRepository.ts`:

```typescript
// packages/cosmic-adapters/src/persistence/drizzle/DrizzleCompanionRepository.ts
import { ICompanionRepository } from '@anplexa/cosmic-companion/domain/repositories';
import { Companion } from '@anplexa/cosmic-companion/domain/entities';
// ... implement save(), findById(), findByUserId(), delete(), countByUserId()
```

**Files to create**:
- `DrizzleCompanionRepository.ts`
- `DrizzleMemoryRepository.ts`
- `DrizzleAgeVerificationRepository.ts`

### Step 2: Implement External Service Adapters

Create adapters for external services:

```typescript
// packages/cosmic-adapters/src/external/ephemeris/AstrologyApiAdapter.ts
import { IEphemerisService } from '@anplexa/cosmic-companion/use-cases/ports';

export class AstrologyApiAdapter implements IEphemerisService {
  async calculateChart(birthDate, birthTime, location) {
    // Call Swiss Ephemeris or astrology API
    // Return ChartCalculationResult
  }

  async getCurrentTransits() {
    // Get current planetary positions
  }
}
```

**Files to create**:
- `AstrologyApiAdapter.ts` - Birth chart calculations
- `CosmicOllamaGateway.ts` - Extends OllamaGateway with zodiac prompts
- `ReplicateAdapter.ts` - NSFW image generation
- `MockVerificationAdapter.ts` - Age verification

### Step 3: Create API Routes

Create REST endpoints under `/api/cosmic`:

```typescript
// apps/api/src/routes/cosmic/birth-chart.routes.ts
import { Router } from 'express';
import { CreateBirthChartUseCase } from '@anplexa/cosmic-companion/use-cases';

const router = Router();

router.post('/birth-chart', async (req, res) => {
  const useCase = new CreateBirthChartUseCase(
    birthChartRepo,
    ephemerisService
  );

  const result = await useCase.execute({
    userId: req.user.id,
    birthDate: new Date(req.body.birthDate),
    birthTime: req.body.birthTime,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    timezone: req.body.timezone
  });

  res.json(result.birthChart.toJSON());
});

export default router;
```

**Routes to create**:
- `/api/cosmic/birth-chart` - POST/GET
- `/api/cosmic/companion` - POST/GET/PATCH/DELETE
- `/api/cosmic/chat` - POST (send message), GET (history)
- `/api/cosmic/images` - POST (generate), GET (list)
- `/api/cosmic/verification` - POST (initiate), GET (status)
- `/api/cosmic/subscription` - POST (checkout), GET (tier info)

### Step 4: Build Frontend Pages

Create Next.js pages under `/cosmic`:

```tsx
// apps/companions/src/app/cosmic/quiz/page.tsx
'use client';

import { useState } from 'react';

export default function CosmicQuizPage() {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  // ... collect birth data

  const handleSubmit = async () => {
    const response = await fetch('/api/cosmic/birth-chart', {
      method: 'POST',
      body: JSON.stringify({ birthDate, birthTime, ... })
    });
    // Navigate to companion creation
  };

  return (
    <div>
      <h1>Discover Your Cosmic Match</h1>
      {/* Birth date/time/location form */}
    </div>
  );
}
```

**Pages to create**:
- `/cosmic` - Landing page with quiz CTA
- `/cosmic/quiz` - Birth chart data collection
- `/cosmic/companion` - Chat interface
- `/cosmic/pricing` - Subscription tiers
- `/cosmic/dashboard` - User dashboard

---

## Running Database Migrations

After creating the schema, run migrations:

```bash
cd packages/database

# Generate migration
pnpm drizzle-kit generate:pg

# Run migration
pnpm drizzle-kit push:pg
```

---

## Testing the Implementation

### Unit Tests (Domain Layer)

```typescript
// packages/cosmic-companion/src/domain/value-objects/ZodiacSign.test.ts
import { describe, it, expect } from 'vitest';
import { ZodiacSign } from './ZodiacSign';

describe('ZodiacSign', () => {
  it('should calculate compatibility correctly', () => {
    const aries = ZodiacSign.fromName('aries');
    const libra = ZodiacSign.fromName('libra');

    const aspect = aries.getAspectWith(libra);
    expect(aspect).toBe('opposition'); // 180 degrees apart
  });
});
```

### Integration Tests (Use Cases)

```typescript
// packages/cosmic-companion/src/use-cases/birth-chart/CreateBirthChartUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateBirthChartUseCase } from './CreateBirthChartUseCase';

describe('CreateBirthChartUseCase', () => {
  let useCase: CreateBirthChartUseCase;
  let mockRepo: IBirthChartRepository;
  let mockEphemeris: IEphemerisService;

  beforeEach(() => {
    // Set up mocks
    useCase = new CreateBirthChartUseCase(mockRepo, mockEphemeris);
  });

  it('should create birth chart from user data', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      birthDate: new Date('1990-03-21'),
      birthTime: '10:30',
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York'
    });

    expect(result.birthChart.sunSign.name).toBe('aries');
  });
});
```

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Astrology API
ASTROLOGY_API_KEY=your_key_here
ASTROLOGY_API_URL=https://api.astrology-service.com

# Image Generation
REPLICATE_API_KEY=your_replicate_key

# Age Verification (optional for development)
VERIFICATION_PROVIDER=mock # or 'yoti', 'veriff'
VERIFICATION_API_KEY=your_key_here

# Cosmic Companion
COSMIC_ENABLED=true
```

---

## Key Concepts

### Zodiac Compatibility

The `CompatibilityService` generates companions with complementary zodiac placements:

```typescript
const compatibilityService = new CompatibilityService();

// User has Scorpio Sun, Cancer Moon
const userChart = await birthChartRepo.findByUserId(userId);

// Service generates optimal companion:
// - Taurus Sun (earth complements water)
// - Pisces Moon (water matches Cancer)
// - Libra Venus (air for romance)
// - Leo Mars (fire for passion)
const companion = compatibilityService.generateOptimalCompanion(userChart);

console.log(companion.compatibilityScore.overall); // 87%
console.log(companion.explanation);
// "Your companion's Taurus Sun complements your Scorpio nature..."
```

### Memory System

Three-tier memory with automatic promotion:

```typescript
// Short-term memory (expires in 24 hours)
const memory = Memory.create(
  id, companionId, userId,
  'short-term',
  'preference',
  'User likes romantic conversations',
  60 // Importance
);

// If referenced multiple times, importance increases
memory.reinforceImportance(20); // Now 80

// Automatically promotes to long-term
if (memory.importance >= 80) {
  memory.promoteToLongTerm(); // Never expires
}
```

### Transit Awareness

AI companions reference current astrological events:

```typescript
const transitService = new TransitService();
const transits = await ephemerisService.getCurrentTransits();

const influences = transitService.getTransitContext(
  transits,
  userSunSign
);

// AI receives: "With Mercury retrograde, communication may feel challenging..."
```

---

## Next Implementation Tasks (Priority Order)

1. ✅ `DrizzleCompanionRepository` - Highest priority for core functionality
2. ✅ `CosmicOllamaGateway` - Extend existing AI service
3. ✅ `AstrologyApiAdapter` - Choose & integrate ephemeris service
4. ✅ API routes for birth chart & companion creation
5. ✅ Frontend quiz page
6. ✅ Frontend chat interface
7. Complete remaining adapters & use cases

---

## Resources

- **Product Spec**: `/home/billyrichards/bbrdev1/anplexa/competitor-research-seo/PRODUCT-FEATURES-SPEC.md`
- **Architecture Docs**: `/home/billyrichards/bbrdev1/anplexa/docs/docs/architecture/cosmic-companion-*.md`
- **Implementation Status**: `packages/cosmic-companion/IMPLEMENTATION-STATUS.md`

---

## Support & Questions

For questions about the implementation:
1. Check `IMPLEMENTATION-STATUS.md` for what's complete
2. Review architecture docs in `/docs/docs/architecture/`
3. Look at `DrizzleBirthChartRepository.ts` for adapter pattern example
4. Reference existing Anplexa code for integration patterns

---

**Ready to implement? Start with repository adapters!**
