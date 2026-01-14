# Project Structure - useMessagePersistence Hook

## Directory Tree

```
apps/companions/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── hooks/                           ← Custom hooks layer
│   │   ├── __tests__/
│   │   │   ├── useGuestChat.test.ts
│   │   │   ├── useMessagePersistence.test.ts    ✨ NEW
│   │   │   ├── usePreferences.test.ts
│   │   │   └── useUpgradeModal.test.ts
│   │   ├── index.ts                    (Updated - exports new hook)
│   │   ├── README.md                   ✨ NEW (Hook documentation)
│   │   ├── useGuestChat.ts
│   │   ├── useMessagePersistence.ts    ✨ NEW (Main hook)
│   │   ├── usePreferences.ts
│   │   └── useUpgradeModal.ts
│   └── lib/                             ← Application infrastructure
│       ├── adapters/                   ← Adapter layer
│       │   ├── api/                    ✨ NEW (HTTP adapter)
│       │   │   ├── api-client.ts       ✨ NEW (API client implementation)
│       │   │   ├── index.ts            ✨ NEW (Barrel export)
│       │   │   └── README.md           ✨ NEW (API client documentation)
│       │   └── storage/                ✨ NEW (Storage adapter)
│       │       ├── storage-service.ts  ✨ NEW (Storage implementation)
│       │       ├── index.ts            ✨ NEW (Barrel export)
│       │       └── README.md           ✨ NEW (Storage documentation)
│       └── domain/                     ✨ NEW (Domain layer)
│           └── entities/               ✨ NEW
│               ├── Message.ts          ✨ NEW (Message entity)
│               └── index.ts            ✨ NEW (Barrel export)
├── EXTRACTION_SUMMARY.md               ✨ NEW (Detailed extraction summary)
├── HOOK_INTEGRATION_GUIDE.md           ✨ NEW (Integration guide)
├── QUICK_REFERENCE.md                  ✨ NEW (Quick reference)
├── PROJECT_STRUCTURE.md                ✨ NEW (This file)
├── package.json                        (No changes)
└── tsconfig.json                       (No changes)
```

## Files Created Summary

### Core Implementation (3 files)

| File | Purpose | Lines |
|------|---------|-------|
| `src/hooks/useMessagePersistence.ts` | Main hook for message persistence | 260 |
| `src/lib/adapters/api/api-client.ts` | HTTP client adapter | 200 |
| `src/lib/adapters/storage/storage-service.ts` | Storage adapter | 200 |

### Domain Layer (1 file)

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/domain/entities/Message.ts` | Message entity and helpers | 60 |

### Tests (1 file)

| File | Purpose | Test Cases |
|------|---------|-----------|
| `src/hooks/__tests__/useMessagePersistence.test.ts` | Hook tests | 20+ tests |

### Barrel Exports (4 files)

| File | Purpose |
|------|---------|
| `src/hooks/index.ts` | Hook exports (updated) |
| `src/lib/adapters/api/index.ts` | API client exports |
| `src/lib/adapters/storage/index.ts` | Storage service exports |
| `src/lib/domain/entities/index.ts` | Entity exports |

### Documentation (6 files)

| File | Purpose |
|------|---------|
| `src/hooks/README.md` | Hook API reference & usage guide |
| `src/lib/adapters/api/README.md` | API client documentation |
| `src/lib/adapters/storage/README.md` | Storage service documentation |
| `EXTRACTION_SUMMARY.md` | Complete extraction summary |
| `HOOK_INTEGRATION_GUIDE.md` | Step-by-step integration guide |
| `QUICK_REFERENCE.md` | Quick reference guide |
| `PROJECT_STRUCTURE.md` | This file |

**Total:** 19 files created/modified

## Architecture Layers

### 1. Hook Layer
```
src/hooks/
├── useMessagePersistence.ts
├── index.ts (exports)
└── __tests__/
    └── useMessagePersistence.test.ts
```

**Responsibility:** Orchestrate adapters, manage React state, provide clean API interface

**Key File:** `/src/hooks/useMessagePersistence.ts`

### 2. Adapter Layer
```
src/lib/adapters/
├── api/
│   ├── api-client.ts
│   └── index.ts
└── storage/
    ├── storage-service.ts
    └── index.ts
```

**Responsibility:** Provide abstractions over external services (HTTP, Storage)

**Key Files:**
- `/src/lib/adapters/api/api-client.ts` - HTTP client
- `/src/lib/adapters/storage/storage-service.ts` - Storage client

### 3. Domain Layer
```
src/lib/domain/
└── entities/
    ├── Message.ts
    └── index.ts
```

**Responsibility:** Define domain entities and business logic

**Key File:** `/src/lib/domain/entities/Message.ts`

## Data Flow

```
User Interaction
    ↓
ChatInterface Component
    ↓
useMessagePersistence Hook
    ├─→ saveMessage()
    │   └─→ apiClient.post()
    │       └─→ fetch() + JSON
    │
    ├─→ loadMessages()
    │   ├─→ storageService.get() (if cached)
    │   └─→ apiClient.get()
    │       └─→ fetch() + JSON
    │
    └─→ deleteMessage()
        └─→ apiClient.delete()
            └─→ fetch() + JSON
```

## Import Paths

### From Components

```typescript
// Hooks
import { useMessagePersistence } from '@/hooks';
import type { UseMessagePersistenceOptions } from '@/hooks';

// Entities
import { createUserMessage } from '@/lib/domain/entities';
import type { Message } from '@/lib/domain/entities';

// Adapters (use through hooks, rarely directly)
import { apiClient } from '@/lib/adapters/api';
import { storageService } from '@/lib/adapters/storage';
```

## Code Organization Principles

### ✅ Clean Architecture

- **Domain Layer** (`lib/domain/`): Business entities, no dependencies
- **Adapter Layer** (`lib/adapters/`): Infrastructure abstractions
- **Hook Layer** (`hooks/`): React integration, orchestration

### ✅ Single Responsibility

- `useMessagePersistence`: State management & orchestration
- `apiClient`: HTTP communication only
- `storageService`: Storage operations only
- `Message`: Data structure only

### ✅ Dependency Inversion

Hooks depend on interfaces (apiClient, storageService), not concrete implementations.
Easy to swap implementations for testing.

### ✅ Type Safety

No `any` types. Full TypeScript support with generics.

## Testing Structure

```
src/hooks/__tests__/
├── useMessagePersistence.test.ts    ✨ NEW
│   ├── saveMessage tests
│   ├── loadMessages tests
│   ├── deleteMessage tests
│   ├── Error handling tests
│   ├── Loading state tests
│   └── Caching tests
```

**Framework:** Vitest + @testing-library/react

**Mocking:** Fully mocked adapters (apiClient, storageService)

## Configuration Files

### tsconfig.json
No changes needed. Uses existing path aliases:
- `@/` → `src/`

### package.json
No changes needed. Contains:
- `vitest` for testing
- `@testing-library/react` for hook testing
- `typescript` for type checking

## Documentation Structure

```
docs/
├── Hook API
│   └── src/hooks/README.md
├── Adapters
│   ├── src/lib/adapters/api/README.md
│   └── src/lib/adapters/storage/README.md
├── Guides
│   ├── HOOK_INTEGRATION_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   └── EXTRACTION_SUMMARY.md
└── This File
    └── PROJECT_STRUCTURE.md
```

## Quick Navigation

| Need | File |
|------|------|
| Use the hook | `src/hooks/useMessagePersistence.ts` |
| Understand hook API | `src/hooks/README.md` |
| Integrate into component | `HOOK_INTEGRATION_GUIDE.md` |
| Quick syntax reference | `QUICK_REFERENCE.md` |
| API client usage | `src/lib/adapters/api/README.md` |
| Storage service usage | `src/lib/adapters/storage/README.md` |
| Complete summary | `EXTRACTION_SUMMARY.md` |

## Next Steps

1. **Review Integration Guide**
   - Read: `HOOK_INTEGRATION_GUIDE.md`

2. **Integrate into ChatInterface**
   - Component: `apps/companions/components/chat-interface.tsx`
   - Replace fetch() calls with hook methods
   - Remove manual state management

3. **Run Tests**
   ```bash
   pnpm test useMessagePersistence
   ```

4. **Test with API**
   - Update environment variables if needed
   - Test with real backend endpoints

5. **Enable Caching** (optional)
   - Set `enableLocalCache: true` in hook options
   - Provide `cacheKey` for conversation

## File Statistics

```
TypeScript Code:     ~700 LOC
- Hook:             260 LOC
- API Client:       200 LOC
- Storage Service:  200 LOC
- Entities:         60 LOC

Tests:              350+ LOC
- useMessagePersistence.test.ts

Documentation:      2500+ words
- 6 markdown files
- Comprehensive examples
- API references
```

## Key Design Patterns

### 1. Adapter Pattern
Adapters (apiClient, storageService) abstract external dependencies.

### 2. Dependency Injection
Hook receives configuration via options, doesn't create dependencies.

### 3. Factory Functions
Entity creation via helper functions (`createUserMessage`, etc.).

### 4. Custom Hooks
Standard React hook pattern for state management.

### 5. Barrel Exports
Index files export public API of modules.

## Standards Followed

- ✅ **Clean Architecture**: Layered structure with clear dependencies
- ✅ **TypeScript**: Full type safety, no `any` types
- ✅ **Test-Driven**: Comprehensive test suite included
- ✅ **Documentation**: Extensive docs with examples
- ✅ **Error Handling**: Proper error types and handling
- ✅ **Performance**: Request cancellation, optional caching
- ✅ **Accessibility**: Clean API, easy to use and test

## Backward Compatibility

✅ No breaking changes. Existing code unaffected:
- Other hooks untouched
- ChatInterface can be updated gradually
- Old fetch() patterns still work (but discouraged)

## Future Enhancements

Potential additions (not included in initial extraction):
- Retry logic for failed requests
- Request/response interceptors
- Offline support via IndexedDB
- Pagination helpers
- Real-time updates via WebSockets
- Conflict resolution for concurrent edits

---

**Created:** January 14, 2025
**Status:** Complete and ready for integration
