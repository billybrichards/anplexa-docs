# Database Schema Reference

Complete reference for all tables, fields, and relationships in the Anplexa database schema.

## Table of Contents

1. [Core Tables](#core-tables)
2. [Communication Tables](#communication-tables)
3. [API & Integration Tables](#api--integration-tables)
4. [Authentication Tables](#authentication-tables)
5. [System Tables](#system-tables)
6. [Relations](#relations)
7. [Type Definitions](#type-definitions)

---

## Core Tables

### users
Main user account table with authentication and preference fields.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| email | text | UNIQUE, NOT NULL | User email address |
| passwordHash | text | NOT NULL | bcrypt hash |
| displayName | text | NULLABLE | User's full name |
| chatName | text | NULLABLE | Preferred name for AI to use |
| personalityMode | text | DEFAULT: 'nurturing' | 'nurturing' \| 'playful' \| 'dominant' |
| preferredGender | text | DEFAULT: 'female' | (PostgreSQL only) Companion gender preference |
| customGender | text | NULLABLE | (PostgreSQL only) Custom gender text |
| storagePreference | text | DEFAULT: 'cloud' | 'local' \| 'cloud' |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |
| updatedAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |
| isAdmin | boolean | DEFAULT: false | Admin access flag |
| subscriptionStatus | text | DEFAULT: 'not_subscribed' | 'subscribed' \| 'not_subscribed' |
| manualSubscriptionOverride | boolean | DEFAULT: false | Prevents Stripe webhook updates |
| credits | integer | DEFAULT: 5 (Postgres), 0 (SQLite) | Daily message credits |
| lastCreditRefresh | text | NULLABLE | Last daily credit reset date |
| stripeCustomerId | text | NULLABLE | Stripe customer ID |
| stripeSubscriptionId | text | NULLABLE | Stripe subscription ID |
| accountSource | text | DEFAULT: 'abionti_api' (Postgres), 'frontend' (SQLite) | Account origin |
| funnelType | text | DEFAULT: 'direct' | 'waitlist' \| 'direct' |
| persona | text | NULLABLE | 'lonely' \| 'curious' \| 'privacy' |
| stage | text | DEFAULT: 'new' | 'new' \| 'waitlist' \| 'invited' \| 'converted' \| 'dormant' |
| entrySource | text | NULLABLE | Social media or campaign source |
| usedFreeMessages | integer | DEFAULT: 0 | Free message usage counter |
| emailOpened1 | boolean | DEFAULT: false | Email sequence tracking |
| emailOpened2 | boolean | DEFAULT: false | Email sequence tracking |
| emailOpened3 | boolean | DEFAULT: false | Email sequence tracking |
| clickedUseApp | boolean | DEFAULT: false | CRM engagement tracking |
| feedbackSubmitted | boolean | DEFAULT: false | User feedback flag |
| refundRequested | boolean | DEFAULT: false | Refund request tracking |
| refundProcessed | boolean | DEFAULT: false | Refund processing flag |
| lastActivityAt | text | NULLABLE | Last user activity timestamp |
| amplexaFunnel | text | NULLABLE | Funnel profile code (A-F) |
| amplexaFunnelName | text | NULLABLE | Full funnel profile name |
| amplexaResponses | text | NULLABLE | JSON: funnel survey responses |
| amplexaPrimaryNeed | text | NULLABLE | Primary user need from funnel |
| amplexaCommunicationStyle | text | NULLABLE | Communication preference |
| amplexaPace | text | NULLABLE | Interaction pace preference |
| amplexaTags | text | NULLABLE | JSON: personality tags |
| amplexaTimestamp | text | NULLABLE | When funnel data submitted |
| sourceChannel | text | NULLABLE | 'funnel' \| 'waitlist' \| 'access_anplexa' \| 'frontend' \| 'api' \| 'auth_register' |

**Relations:**
- conversations (one-to-many)
- preferences (one-to-one → userPreferences)
- feedback (one-to-many)
- sessions (one-to-many)

---

### conversations
Conversation threads between user and companion.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Conversation owner |
| title | text | NULLABLE | Conversation title |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |
| updatedAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |

**Relations:**
- user (many-to-one → users)
- messages (one-to-many)
- context (one-to-one → conversationContext)

---

### messages
Individual messages in conversations.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| conversationId | text | FK → conversations.id, NOT NULL | Parent conversation |
| role | text | NOT NULL | 'user' \| 'assistant' \| 'system' |
| content | text | NOT NULL | Message text |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |

**Relations:**
- conversation (many-to-one → conversations)

---

### conversationContext
Memory and context summaries for long conversations.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| conversationId | text | FK → conversations.id, NOT NULL | Parent conversation |
| summary | text | NOT NULL | Context summary |
| keyFacts | text | NULLABLE | JSON: key facts array |
| updatedAt | text | DEFAULT: CURRENT_TIMESTAMP | ISO 8601 format |

**Relations:**
- conversation (many-to-one → conversations)

---

### sessions
Authentication sessions.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Session owner |
| refreshToken | text | NOT NULL | Refresh token |
| expiresAt | text | NOT NULL | Session expiration (ISO 8601) |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Session creation time |

**Relations:**
- user (many-to-one → users)

---

### userPreferences
User-specific preference overrides.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, UNIQUE, NOT NULL | Preference owner |
| gender | text | NULLABLE | 'male' \| 'female' \| 'non-binary' \| 'custom' |
| customGender | text | NULLABLE | Custom gender text |
| preferredLength | text | DEFAULT: 'moderate' | 'brief' \| 'moderate' \| 'detailed' |
| preferredStyle | text | DEFAULT: 'thoughtful' | 'casual' \| 'thoughtful' \| 'creative' |
| themeHue | integer | DEFAULT: 220 | Theme hue value (0-360) |
| useOrangeAccent | boolean | DEFAULT: false | Theme accent preference |
| updatedAt | text | DEFAULT: CURRENT_TIMESTAMP | Last update time |

**Relations:**
- user (one-to-one → users)

---

### userFeedback
User feedback and feature requests.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NULLABLE | Feedback author |
| type | text | NOT NULL | 'feedback' \| 'feature' |
| content | text | NOT NULL | Feedback content |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Submission time |

---

### companionConfig
Global companion AI configuration (single row).

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY, DEFAULT: 'default' | Always 'default' |
| name | text | NOT NULL, DEFAULT: 'Aura' | Companion name |
| defaultGender | text | DEFAULT: 'female' | 'male' \| 'female' \| 'non-binary' \| 'custom' |
| customGenderText | text | NULLABLE | Custom gender option |
| defaultLength | text | DEFAULT: 'moderate' | 'brief' \| 'moderate' \| 'detailed' |
| defaultStyle | text | DEFAULT: 'thoughtful' | 'casual' \| 'thoughtful' \| 'creative' |
| briefTokens | integer | DEFAULT: 500 | Max tokens for brief |
| moderateTokens | integer | DEFAULT: 1000 | Max tokens for moderate |
| detailedTokens | integer | DEFAULT: 2000 | Max tokens for detailed |
| briefInstruction | text | DEFAULT: '...' | Brief mode system instruction |
| moderateInstruction | text | DEFAULT: '...' | Moderate mode instruction |
| detailedInstruction | text | DEFAULT: '...' | Detailed mode instruction |
| casualInstruction | text | DEFAULT: '...' | Casual style instruction |
| thoughtfulInstruction | text | DEFAULT: '...' | Thoughtful style instruction |
| creativeInstruction | text | DEFAULT: '...' | Creative style instruction |
| systemPromptTemplate | text | NOT NULL | Main system prompt template |
| generalModel | text | DEFAULT: 'darkplanet' | Model for general responses |
| longFormModel | text | DEFAULT: 'darkplanet' | Model for long-form responses |
| temperature | double/real | DEFAULT: 0.8 | LLM temperature |
| useLongFormForDetailed | boolean | DEFAULT: true | Use long-form for detailed |
| welcomeTitle | text | DEFAULT: 'WELCOME...' | First message title |
| welcomeMessage | text | DEFAULT: 'This is...' | First message content |
| updatedAt | text | DEFAULT: CURRENT_TIMESTAMP | Configuration update time |

---

## Communication Tables

### emailQueue
Scheduled email sends.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Email recipient |
| emailTemplate | text | NOT NULL | 'W1'-'W5', 'D1'-'D4', 'refund_thanks' |
| scheduledAt | text | NOT NULL | Scheduled send time (ISO 8601) |
| sentAt | text | NULLABLE | Actual send time |
| status | text | DEFAULT: 'pending' | 'pending' \| 'sent' \| 'failed' \| 'cancelled' |
| errorMessage | text | NULLABLE | Error description if failed |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Queue creation time |

---

### emailLogs
Email delivery tracking.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Email recipient |
| emailTemplate | text | NOT NULL | Template identifier |
| subject | text | NULLABLE | Email subject |
| sentAt | text | NOT NULL | Send timestamp |
| openedAt | text | NULLABLE | Open timestamp |
| clickedAt | text | NULLABLE | Click timestamp |
| clickSource | text | NULLABLE | Which link/button clicked |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Log creation time |

---

## API & Integration Tables

### apiKeys
User API keys for external access.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| name | text | NOT NULL | Key name/label |
| keyHash | text | NOT NULL | bcrypt hash of key |
| keyPrefix | text | NOT NULL | First 8 chars for display |
| userId | text | FK → users.id, NULLABLE | Key owner |
| createdBy | text | FK → users.id, NULLABLE | Creator (could be admin) |
| isActive | boolean | DEFAULT: true | Enable/disable flag |
| lastUsedAt | text | NULLABLE | Last usage timestamp |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |

---

### apiUsage
Detailed API usage tracking.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| apiKeyId | text | FK → apiKeys.id, NULLABLE | API key used |
| userId | text | FK → users.id, NULLABLE | User making request |
| endpoint | text | NOT NULL | API endpoint |
| method | text | NOT NULL | HTTP method |
| tokensUsed | integer | DEFAULT: 0 | Tokens consumed |
| latencyMs | integer | NULLABLE | Response time (ms) |
| statusCode | integer | NULLABLE | HTTP status code |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Request time |

---

### apiUsageDaily
Aggregated daily API usage.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| apiKeyId | text | FK → apiKeys.id, NULLABLE | API key |
| userId | text | FK → users.id, NULLABLE | User |
| date | text | NOT NULL | Date (YYYY-MM-DD) |
| totalRequests | integer | DEFAULT: 0 | Request count |
| totalTokens | integer | DEFAULT: 0 | Token sum |
| avgLatencyMs | integer | NULLABLE | Average latency |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Record creation time |

---

### funnelApiKeys
External funnel integration API keys.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| name | text | NOT NULL, DEFAULT: 'Funnel API Key' | Key name |
| keyHash | text | NOT NULL | bcrypt hash |
| keyPrefix | text | NOT NULL | First 12 chars for display |
| isActive | boolean | DEFAULT: true | Enable/disable flag |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |
| lastUsedAt | text | NULLABLE | Last usage timestamp |
| notes | text | NULLABLE | Optional notes |

---

### exchangeTokens
Short-lived codes for secure redirect authentication.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Token owner |
| email | text | NOT NULL | Associated email |
| codeHash | text | NOT NULL | bcrypt hash of code |
| expiresAt | text | NOT NULL | Expiration (5 min typical) |
| usedAt | text | NULLABLE | When exchanged |
| source | text | DEFAULT: 'funnel' | 'funnel' \| 'other' |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |

---

## Authentication Tables

### sessions
See [Core Tables - sessions](#sessions)

### passwordResetTokens
Password reset tokens.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| userId | text | FK → users.id, NOT NULL | Token owner |
| tokenHash | text | NOT NULL | Hash of reset token |
| expiresAt | text | NOT NULL | Expiration timestamp |
| usedAt | text | NULLABLE | When token was used |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |

---

### magicLinkTokens
Passwordless authentication tokens.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| email | text | NOT NULL | Email for magic link |
| tokenHash | text | NOT NULL | Hash of magic link token |
| expiresAt | text | NOT NULL | Expiration timestamp |
| usedAt | text | NULLABLE | When link was used |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |

---

## System Tables

### systemPrompts
System prompt versions with audit trail.

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| name | text | NOT NULL, DEFAULT: 'default' | Prompt identifier |
| content | text | NOT NULL | Prompt content |
| version | integer | NOT NULL, DEFAULT: 1 | Version number |
| isActive | boolean | DEFAULT: false | Only one active |
| createdBy | text | FK → users.id, NULLABLE | Creator |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Creation time |
| notes | text | NULLABLE | Version notes |

---

### contactSubmissions
Master audit log of all contact submissions (append-only).

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| id | text | PRIMARY KEY | UUID format recommended |
| email | text | NOT NULL | Contact email |
| displayName | text | NULLABLE | Contact name |
| chatName | text | NULLABLE | Preferred chat name |
| sourceChannel | text | NOT NULL | 'funnel' \| 'waitlist' \| 'access_anplexa' \| etc |
| sourceDetail | text | NULLABLE | UTM params, social source, etc |
| funnelType | text | NULLABLE | 'waitlist' \| 'direct' |
| persona | text | NULLABLE | 'lonely' \| 'curious' \| 'privacy' |
| entrySource | text | NULLABLE | 'instagram' \| 'tiktok' \| etc |
| ipAddress | text | NULLABLE | Submission IP |
| userAgent | text | NULLABLE | Browser user agent |
| utmSource | text | NULLABLE | UTM source |
| utmMedium | text | NULLABLE | UTM medium |
| utmCampaign | text | NULLABLE | UTM campaign |
| rawPayload | text | NULLABLE | JSON: full request body |
| isNewUser | boolean | DEFAULT: true | Whether user account created |
| existingUserId | text | NULLABLE | If user already existed |
| createdUserId | text | NULLABLE | If new user was created |
| createdAt | text | DEFAULT: CURRENT_TIMESTAMP | Submission time |

---

## Relations

### User Relations

```
users
├── conversations (one-to-many)
├── userPreferences (one-to-one)
├── userFeedback (one-to-many)
└── sessions (one-to-many)
```

### Conversation Relations

```
conversations
├── user (many-to-one → users)
├── messages (one-to-many)
└── conversationContext (one-to-one)
```

### Message Relations

```
messages
└── conversation (many-to-one → conversations)
```

---

## Type Definitions

### Select Types (from database)

```typescript
type User = typeof users.$inferSelect;
type Conversation = typeof conversations.$inferSelect;
type Message = typeof messages.$inferSelect;
type UserPreferences = typeof userPreferences.$inferSelect;
type UserFeedback = typeof userFeedback.$inferSelect;
type ApiKey = typeof apiKeys.$inferSelect;
type ApiUsage = typeof apiUsage.$inferSelect;
type ApiUsageDaily = typeof apiUsageDaily.$inferSelect;
type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
type SystemPrompt = typeof systemPrompts.$inferSelect;
type EmailQueue = typeof emailQueue.$inferSelect;
type EmailLog = typeof emailLogs.$inferSelect;
type FunnelApiKey = typeof funnelApiKeys.$inferSelect;
type ContactSubmission = typeof contactSubmissions.$inferSelect;
type ExchangeToken = typeof exchangeTokens.$inferSelect;
type CompanionConfig = typeof companionConfig.$inferSelect;
```

### Insert Types (for creation)

```typescript
type NewUser = typeof users.$inferInsert;
type NewContactSubmission = typeof contactSubmissions.$inferInsert;
```

---

## Database-Specific Notes

### PostgreSQL

- Uses `doublePrecision` for floating-point (temperature)
- Uses native `boolean` type
- Supports advanced features like JSON operators

### SQLite

- Uses `real` for floating-point
- Uses integer with `{ mode: 'boolean' }` for boolean conversion
- Limited to synchronous operations
- Default path: `./data/companion.db`

Both dialects maintain identical type exports and table structures.
