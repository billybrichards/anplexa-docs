# @anplexa/ui

A shared component library for the Anplexa monorepo providing reusable React UI components built with shadcn/ui patterns, Radix UI primitives, and Tailwind CSS.

## Overview

This package contains essential UI components used across all Anplexa applications:
- **Companions App** - AI companion interface
- **Funnel App** - Marketing/conversion funnel UI
- **Docs App** - Documentation site components
- **Admin Dashboard** - Internal administration interface

## Features

- Built on proven patterns from shadcn/ui
- Radix UI primitives for accessible components
- TypeScript first with full type safety
- Tailwind CSS for styling
- Class variance authority for component variants
- Zero external icon library dependencies (lightweight)

## Components

### Form Components
- **Button** - Customizable button with multiple variants
- **Input** - Text input with validation states
- **Textarea** - Multi-line text input

### Layout Components
- **Card** - Container component with header, content, and footer
  - CardHeader - Card title section
  - CardTitle - Heading within card
  - CardDescription - Descriptive text within card
  - CardContent - Main content area
  - CardFooter - Footer section with actions

### Dialog Components
- **Dialog** - Modal dialog with overlay
- **DialogContent** - Dialog container with animations
- **DialogHeader** - Dialog title section
- **DialogFooter** - Dialog action buttons
- **DialogTitle** - Dialog heading
- **DialogDescription** - Dialog description text

### Menu Components
- **DropdownMenu** - Dropdown menu with submenus
- **DropdownMenuTrigger** - Menu trigger button
- **DropdownMenuContent** - Menu items container
- **DropdownMenuItem** - Individual menu item
- **DropdownMenuCheckboxItem** - Checkbox menu item
- **DropdownMenuRadioItem** - Radio menu item
- **DropdownMenuLabel** - Menu section label
- **DropdownMenuSeparator** - Menu divider
- **DropdownMenuGroup** - Grouped menu items

## Utilities

### `cn()`
Utility function for merging Tailwind CSS classes with proper precedence:

```typescript
import { cn } from '@anplexa/ui'

const className = cn(
  'bg-slate-100',
  'hover:bg-slate-200',
  condition && 'text-bold'
)
```

## Installation

The package is part of the monorepo workspace and is automatically available to all apps.

### In an app's package.json:

```json
{
  "dependencies": {
    "@anplexa/ui": "workspace:*"
  }
}
```

### Or using the CLI:

```bash
pnpm add @anplexa/ui
```

## Usage

### Basic Component Usage

```typescript
import { Button, Card, CardHeader, CardTitle, Input } from '@anplexa/ui'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Form</CardTitle>
      </CardHeader>
      <form>
        <Input placeholder="Enter text..." />
        <Button type="submit">Submit</Button>
      </form>
    </Card>
  )
}
```

### Using Component Variants

```typescript
import { Button } from '@anplexa/ui'

export function ButtonShowcase() {
  return (
    <>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Link</Button>
    </>
  )
}
```

### Dialog Usage

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@anplexa/ui'
import { useState } from 'react'

export function DialogExample() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p>Are you sure?</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Dropdown Menu Usage

```typescript
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '@anplexa/ui'

export function MenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Styling

### Tailwind CSS Configuration

Components use Tailwind CSS classes. Ensure your app has Tailwind CSS configured.

Required in `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './node_modules/@anplexa/ui/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          // Default Tailwind slate colors are used
        }
      }
    }
  }
}
```

### Customization

Components use CSS variables for theming (future enhancement):

```css
:root {
  --primary: #09090b;
  --primary-foreground: #fafafa;
  --secondary: #f3f4f6;
  --secondary-foreground: #09090b;
  /* ... more color variables */
}
```

## Dark Mode

All components include dark mode support via Tailwind's `dark:` prefix classes.

```tsx
// Components automatically adapt to dark mode
<div className="dark">
  <Button>Automatically dark themed</Button>
</div>
```

## TypeScript

Full TypeScript support with exported prop interfaces:

```typescript
import { Button, type ButtonProps } from '@anplexa/ui'

function MyButton(props: ButtonProps) {
  return <Button {...props}>Click me</Button>
}
```

## Dependencies

### Peer Dependencies
- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0

### Dependencies
- `@radix-ui/react-dialog` ^1.1.1 - Dialog primitives
- `@radix-ui/react-dropdown-menu` ^2.0.6 - Dropdown menu primitives
- `class-variance-authority` ^0.7.0 - Component variants
- `clsx` ^2.1.1 - Class name utilities
- `tailwind-merge` ^2.6.0 - Tailwind class merging

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Watch Mode

```bash
pnpm dev
```

## File Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── index.ts (barrel export)
│   ├── lib/
│   │   └── utils.ts (cn() utility)
│   └── index.ts (main barrel export)
├── dist/ (generated)
├── tsconfig.json
├── package.json
└── README.md
```

## Export Patterns

### Single Component
```typescript
import { Button } from '@anplexa/ui'
```

### Multiple Components
```typescript
import { Button, Card, Input } from '@anplexa/ui'
```

### With Utility
```typescript
import { Button, cn } from '@anplexa/ui'

const className = cn('bg-blue-500', 'hover:bg-blue-600')
```

### Specific Exports
```typescript
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@anplexa/ui'
```

## Future Enhancements

- [ ] Add Badge component
- [ ] Add Tabs component
- [ ] Add Accordion component
- [ ] Add Toast/Alert system
- [ ] Add Popover component
- [ ] Add Select component
- [ ] Add Checkbox component
- [ ] Add Radio component
- [ ] Add Switch component
- [ ] Add Table component
- [ ] CSS variable theme customization
- [ ] Component Storybook documentation

## Architecture Notes

**Phase 4 Component Library Initiative**: This package was created as part of Phase 4 of the Clean Architecture refactoring. It centralizes UI components that were previously duplicated across applications, improving maintainability and consistency.

## License

Part of the Anplexa monorepo - see root LICENSE file.
