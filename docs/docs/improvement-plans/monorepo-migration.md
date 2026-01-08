---
sidebar_position: 5
---

# Monorepo Migration

This document outlines the plan to consolidate the separate Anplexa repositories into a unified monorepo structure using pnpm workspaces and Turborepo.

## Current Separate Repos Structure

The Anplexa platform currently consists of multiple independent repositories:

```
~/projects/
├── 2-terminal-companion/      # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── models/
│   ├── package.json
│   └── tsconfig.json
│
├── v0-ai-companion-prototype/ # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tsconfig.json
│
└── anplexa-funnel/            # Marketing Funnel
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### Current Issues

| Issue | Impact |
|-------|--------|
| Code duplication | Types, utilities duplicated across repos |
| Version drift | Different dependency versions cause bugs |
| No shared components | UI components duplicated |
| Deployment complexity | Multiple CI/CD pipelines |
| Cross-repo changes | Multiple PRs for related changes |
| Inconsistent tooling | Different lint/test configs |

## Target Monorepo Structure

```
anplexa/
├── apps/
│   ├── api/                    # Backend API (Express.js)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── companions/             # AI Companions Frontend (Next.js)
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   │
│   └── funnel/                 # Marketing Funnel
│       ├── src/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared/                 # Shared utilities and types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── styles/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain/                 # Shared domain logic
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/             # Type-safe API client
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── tooling/
│   ├── scripts/                # Build and deployment scripts
│   └── docker/                 # Docker configurations
│
├── docs/                       # Documentation site
│   └── ... (Docusaurus)
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turborepo configuration
├── tsconfig.base.json          # Base TypeScript config
└── .github/
    └── workflows/              # CI/CD pipelines
```

## Package Details

### packages/shared

Shared utilities, types, and constants used across all apps.

```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser extends User {
  accessToken: string;
  refreshToken: string;
}

// packages/shared/src/types/conversation.ts
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

// packages/shared/src/utils/validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
};

// packages/shared/src/constants/plans.ts
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['10 messages/day', 'Basic companion']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    features: ['Unlimited messages', 'All companions', 'Priority support']
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    features: ['Everything in Pro', 'Custom companions', 'API access']
  }
} as const;

// packages/shared/package.json
{
  "name": "@anplexa/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/",
    "test": "vitest"
  }
}
```

### packages/ui

Shared UI components based on shadcn/ui.

```typescript
// packages/ui/src/components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// packages/ui/src/components/Input.tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

// packages/ui/package.json
{
  "name": "@anplexa/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

### packages/domain

Shared domain entities and value objects.

```typescript
// packages/domain/src/entities/User.ts
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';

export interface UserProps {
  id: string;
  email: Email;
  name: string;
  passwordHash: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get name() { return this.props.name; }
  get isVerified() { return this.props.isVerified; }

  async validatePassword(password: string): Promise<boolean> {
    return Password.verify(password, this.props.passwordHash);
  }

  verify(): void {
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }
}

// packages/domain/src/value-objects/Email.ts
export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!Email.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this.value = email.toLowerCase().trim();
  }

  static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### packages/api-client

Type-safe API client for frontend applications.

```typescript
// packages/api-client/src/client.ts
import type { User, Conversation, Message } from '@anplexa/shared/types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken, onUnauthorized } = config;

  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken?.();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    });

    if (response.status === 401) {
      onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  return {
    auth: {
      login: (credentials: { email: string; password: string }) =>
        request<{ user: User; tokens: { access: string; refresh: string } }>(
          '/auth/login',
          { method: 'POST', body: JSON.stringify(credentials) }
        ),

      register: (data: { email: string; password: string; name: string }) =>
        request<{ user: User; tokens: { access: string; refresh: string } }>(
          '/auth/register',
          { method: 'POST', body: JSON.stringify(data) }
        ),

      logout: () =>
        request<void>('/auth/logout', { method: 'POST' }),

      refresh: (refreshToken: string) =>
        request<{ access: string; refresh: string }>(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken }) }
        )
    },

    conversations: {
      list: () =>
        request<Conversation[]>('/conversations'),

      get: (id: string) =>
        request<Conversation>(`/conversations/${id}`),

      create: (title?: string) =>
        request<Conversation>(
          '/conversations',
          { method: 'POST', body: JSON.stringify({ title }) }
        ),

      delete: (id: string) =>
        request<void>(`/conversations/${id}`, { method: 'DELETE' }),

      getMessages: (id: string) =>
        request<Message[]>(`/conversations/${id}/messages`)
    },

    chat: {
      sendMessage: (conversationId: string, content: string) =>
        request<Message>(
          `/conversations/${conversationId}/messages`,
          { method: 'POST', body: JSON.stringify({ content }) }
        ),

      streamMessage: async function* (
        conversationId: string,
        content: string
      ): AsyncGenerator<string> {
        const token = getToken?.();

        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/messages/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify({ content })
          }
        );

        if (!response.ok || !response.body) {
          throw new Error('Stream failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value, { stream: true });
        }
      }
    }
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
```

## pnpm Workspace + Turborepo Setup

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

### Root package.json

```json
{
  "name": "anplexa",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@anplexa/config-eslint": "workspace:*",
    "@anplexa/config-typescript": "workspace:*",
    "prettier": "^3.0.0",
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "**/*.test.ts", "**/*.test.tsx"]
    },
    "clean": {
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### tsconfig.base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

### App-specific tsconfig.json (apps/companions)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@anplexa/shared": ["../../packages/shared/src"],
      "@anplexa/ui": ["../../packages/ui/src"],
      "@anplexa/api-client": ["../../packages/api-client/src"]
    },
    "plugins": [
      { "name": "next" }
    ],
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
  "references": [
    { "path": "../../packages/shared" },
    { "path": "../../packages/ui" },
    { "path": "../../packages/api-client" }
  ]
}
```

## Migration Steps

### Phase 1: Preparation (Week 1)

1. **Audit current repositories**
   ```bash
   # Document all dependencies and versions
   cd 2-terminal-companion && npm list --depth=0 > deps-api.txt
   cd ../v0-ai-companion-prototype && npm list --depth=0 > deps-companions.txt
   cd ../anplexa-funnel && npm list --depth=0 > deps-funnel.txt
   ```

2. **Identify shared code**
   - Types used across multiple repos
   - Utility functions duplicated
   - UI components that could be shared

3. **Create migration plan document**
   - Map current files to target locations
   - Identify breaking changes
   - Document environment variables

### Phase 2: Monorepo Setup (Week 2)

1. **Create new monorepo structure**
   ```bash
   mkdir anplexa
   cd anplexa
   pnpm init
   mkdir -p apps/{api,companions,funnel}
   mkdir -p packages/{shared,ui,domain,api-client,config}
   ```

2. **Configure pnpm workspaces**
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. **Set up Turborepo**
   ```bash
   pnpm add -D turbo
   ```

4. **Create base configurations**
   - tsconfig.base.json
   - ESLint base config
   - Prettier config

### Phase 3: Package Migration (Week 3)

1. **Create packages/shared**
   - Extract common types
   - Extract common utilities
   - Extract constants

2. **Create packages/ui**
   - Move shadcn components
   - Create component index
   - Set up Storybook (optional)

3. **Create packages/domain**
   - Move domain entities
   - Move value objects
   - Move domain errors

4. **Create packages/api-client**
   - Build type-safe API client
   - Generate from OpenAPI spec (if available)

### Phase 4: App Migration (Week 4-5)

1. **Migrate apps/api**
   ```bash
   # Copy backend code
   cp -r ../2-terminal-companion/src apps/api/
   cp ../2-terminal-companion/package.json apps/api/

   # Update imports to use workspace packages
   # @anplexa/shared, @anplexa/domain
   ```

2. **Migrate apps/companions**
   ```bash
   # Copy frontend code
   cp -r ../v0-ai-companion-prototype/* apps/companions/

   # Update imports to use workspace packages
   # @anplexa/shared, @anplexa/ui, @anplexa/api-client
   ```

3. **Migrate apps/funnel**
   ```bash
   # Copy funnel code
   cp -r ../anplexa-funnel/* apps/funnel/

   # Update imports
   ```

### Phase 5: CI/CD Setup (Week 6)

1. **Create GitHub Actions workflows**
   ```yaml
   # .github/workflows/ci.yml
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v3
           with:
             version: 9
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: 'pnpm'
         - run: pnpm install
         - run: pnpm turbo build lint test
   ```

2. **Set up Turborepo Remote Caching**
   ```bash
   npx turbo login
   npx turbo link
   ```

3. **Configure deployment pipelines**
   - API: Docker + Railway/Render
   - Companions: Vercel
   - Funnel: Vercel/Netlify

### Phase 6: Validation (Week 7)

1. **Run full test suite**
2. **Test local development workflow**
3. **Test deployment pipelines**
4. **Archive old repositories**

## Development Workflow

### Starting Development

```bash
# Clone and install
git clone https://github.com/anplexa/anplexa.git
cd anplexa
pnpm install

# Start all apps in development
pnpm dev

# Start specific app
pnpm --filter @anplexa/companions dev
pnpm --filter @anplexa/api dev
```

### Adding Dependencies

```bash
# Add to specific app
pnpm --filter @anplexa/companions add lodash

# Add to specific package
pnpm --filter @anplexa/shared add zod

# Add dev dependency to root
pnpm add -D -w prettier
```

### Building

```bash
# Build all
pnpm build

# Build specific app with dependencies
pnpm turbo build --filter=@anplexa/companions...

# Build only packages
pnpm turbo build --filter="./packages/*"
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for changed packages
pnpm turbo test --filter=[origin/main]

# Run specific package tests
pnpm --filter @anplexa/shared test
```

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Number of repositories | 3 | 1 |
| Shared code duplication | High | None |
| Dependency version conflicts | Frequent | None |
| CI/CD pipelines | 3 | 1 |
| Cross-repo changes | Multiple PRs | Single PR |
| Build time (with cache) | N/A | < 30s |

## Related Documentation

- [Improvement Roadmap](./roadmap.md)
- [Backend Improvements](./backend-improvements.md)
- [Frontend Improvements](./frontend-improvements.md)
- [Funnel Improvements](./funnel-improvements.md)
