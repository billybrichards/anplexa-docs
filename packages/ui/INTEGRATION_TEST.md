# @anplexa/ui Integration Test Guide

This document provides quick tests to verify the UI package is correctly integrated and working.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Monorepo properly installed with `pnpm install`

## Test 1: Package Installation

Verify the package is properly installed in your app:

```bash
cd /home/billyrichards/bbrdev1/anplexa/apps/companions
pnpm ls @anplexa/ui
```

**Expected Output**:
```
@anplexa/companions@0.0.0 /home/billyrichards/bbrdev1/anplexa/apps/companions

dependencies:
@anplexa/ui@0.0.0 -> ../../packages/ui
```

## Test 2: Component Import Test

Create a test file in your app to verify imports work:

```typescript
// apps/companions/src/app/test-imports.tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Textarea,
  Dialog,
  DropdownMenu,
  cn,
} from '@anplexa/ui'

export function TestImports() {
  return (
    <div className={cn('p-4', 'bg-slate-50')}>
      <Card>
        <CardHeader>
          <CardTitle>Import Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>All components imported successfully!</p>
          <Button>Test Button</Button>
          <Input placeholder="Test Input" />
          <Textarea placeholder="Test Textarea" />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Expected Result**: No TypeScript errors, all imports resolve

## Test 3: TypeScript Compilation

Verify TypeScript compilation includes the UI package:

```bash
cd /home/billyrichards/bbrdev1/anplexa/apps/companions
pnpm typecheck
```

**Expected Result**: No type errors related to @anplexa/ui

## Test 4: Build Test

Test that the app builds with the UI package:

```bash
cd /home/billyrichards/bbrdev1/anplexa
pnpm build
```

Or for just the UI package:

```bash
cd /home/billyrichards/bbrdev1/anplexa/packages/ui
pnpm build
```

**Expected Result**: Build succeeds with no errors

## Test 5: Component Rendering

Test component rendering in a Next.js page:

```typescript
// apps/companions/src/app/page.tsx
'use client'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anplexa/ui'
import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <main className="p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Component Test</CardTitle>
          <CardDescription>Testing @anplexa/ui components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setCount(count + 1)}>
            Clicked {count} times
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>
    </main>
  )
}
```

**Expected Result**: Page renders with interactive buttons

## Test 6: Variant Testing

Verify component variants work correctly:

```typescript
import { Button } from '@anplexa/ui'

export function VariantTest() {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>

      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">I</Button>
    </div>
  )
}
```

**Expected Result**: All variants render with correct styling

## Test 7: Dark Mode Test

Verify dark mode support:

```typescript
import { Button, cn } from '@anplexa/ui'

export function DarkModeTest() {
  return (
    <div className={cn('p-8 space-y-4')}>
      <div className="bg-white dark:bg-slate-950 p-4 rounded">
        <Button variant="outline">Light/Dark Button</Button>
        <p className="text-slate-950 dark:text-slate-50">
          Text should adapt to dark mode
        </p>
      </div>
    </div>
  )
}
```

**Expected Result**: Component colors adapt with dark mode

## Test 8: Utility Function Test

Verify the `cn()` utility works:

```typescript
import { cn } from '@anplexa/ui'

export function UtilityTest() {
  const className = cn(
    'bg-blue-500',
    'hover:bg-blue-600',
    true && 'rounded-lg',
    false && 'shadow-lg',
    {
      'p-4': true,
      'text-white': true,
    }
  )

  return <div className={className}>cn() utility test</div>
}
```

**Expected Result**: Class merging works, produces valid Tailwind classes

## Quick Check Commands

Run these commands to verify the installation:

```bash
# Check if package.json exists and has @anplexa/ui
grep "@anplexa/ui" /home/billyrichards/bbrdev1/anplexa/apps/companions/package.json

# Verify dist build exists
ls -la /home/billyrichards/bbrdev1/anplexa/packages/ui/dist/

# Check TypeScript definitions
cat /home/billyrichards/bbrdev1/anplexa/packages/ui/dist/index.d.ts

# Verify package in node_modules
ls -la /home/billyrichards/bbrdev1/anplexa/node_modules/@anplexa/ui/
```

## Troubleshooting

### Issue: Module not found '@anplexa/ui'

**Solution**:
```bash
cd /home/billyrichards/bbrdev1/anplexa
pnpm install
```

### Issue: TypeScript cannot find module

**Solution**:
```bash
# Rebuild the UI package
cd packages/ui
pnpm build

# Clear TypeScript cache
cd apps/companions
rm -rf node_modules/.vite
pnpm typecheck
```

### Issue: Components not styled

**Solution**: Ensure Tailwind CSS is configured in your app's `globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

And `tailwind.config.js` includes:
```javascript
content: [
  './node_modules/@anplexa/ui/dist/**/*.{js,ts,jsx,tsx}'
]
```

## Verification Checklist

- [ ] Package installs without errors
- [ ] All imports resolve correctly
- [ ] TypeScript compilation passes
- [ ] App builds successfully
- [ ] Components render in browser
- [ ] Component variants work
- [ ] Dark mode works
- [ ] Utility functions work
- [ ] No console errors

## Success Criteria

All tests pass when:
✅ No TypeScript errors
✅ No import errors
✅ Components render correctly
✅ Styling applies properly
✅ Interactive features work

---

**For more information**, see `/home/billyrichards/bbrdev1/anplexa/packages/ui/README.md`
