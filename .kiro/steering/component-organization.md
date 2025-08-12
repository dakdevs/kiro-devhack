# Component Organization Guidelines

## Core Principle
**Keep module-specific components local to their usage in `_modules` folders. Only truly reusable components should live in `src/components`.**

## Directory Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── _modules/
│   │   │   ├── dashboard-header.tsx      # Dashboard-specific component
│   │   │   ├── stats-card.tsx           # Dashboard-specific component
│   │   │   └── recent-activity.tsx      # Dashboard-specific component
│   │   └── page.tsx
│   ├── profile/
│   │   ├── _modules/
│   │   │   ├── profile-avatar.tsx       # Profile-specific component
│   │   │   └── profile-settings.tsx     # Profile-specific component
│   │   └── page.tsx
│   └── auth/
│       ├── _modules/
│       │   ├── login-form.tsx           # Auth-specific component
│       │   └── signup-form.tsx          # Auth-specific component
│       └── page.tsx
└── components/
    ├── ui/
    │   ├── button.tsx                   # Truly reusable UI component
    │   ├── input.tsx                    # Truly reusable UI component
    │   └── modal.tsx                    # Truly reusable UI component
    └── layout/
        ├── header.tsx                   # App-wide layout component
        └── footer.tsx                   # App-wide layout component
```

## Rules

### 1. Module-Specific Components (`_modules` folders)
- **Location**: `src/app/[route]/_modules/`
- **Purpose**: Components that are specific to a particular page or feature
- **Naming**: Use descriptive names that indicate their specific purpose
- **Examples**:
  - `dashboard-stats.tsx` (only used in dashboard)
  - `profile-edit-form.tsx` (only used in profile editing)
  - `auth-login-form.tsx` (only used in login page)

### 2. Reusable Components (`src/components`)
- **Location**: `src/components/`
- **Purpose**: Components used across multiple pages or features
- **Categories**:
  - `ui/` - Basic UI primitives (Button, Input, Modal, etc.)
  - `layout/` - Layout components (Header, Footer, Sidebar)
  - `forms/` - Reusable form components
- **Test**: If a component is used in 2+ different routes/features, it belongs here

## Examples

### ✅ Correct Organization

```typescript
// src/app/dashboard/_modules/stats-card.tsx
"use client"

interface StatsCardProps {
  title: string;
  value: number;
  trend: "up" | "down";
}

export function StatsCard({ title, value, trend }: StatsCardProps) {
  // Dashboard-specific stats card implementation
}

// src/app/dashboard/page.tsx
import { StatsCard } from "./_modules/stats-card";
import { Button } from "~/components/ui/button";

export default function DashboardPage() {
  return (
    <div>
      <StatsCard title="Users" value={1234} trend="up" />
      <Button>Refresh</Button>
    </div>
  );
}
```

### ❌ Incorrect Organization

```typescript
// Don't put page-specific components in src/components
// src/components/dashboard-stats-card.tsx ❌

// Don't put reusable components in _modules
// src/app/dashboard/_modules/button.tsx ❌
```

## Migration Strategy

When refactoring existing components:

1. **Identify usage**: Check how many different routes/features use the component
2. **Single usage**: Move to appropriate `_modules` folder
3. **Multiple usage**: Keep in or move to `src/components`
4. **Update imports**: Use `~/` prefix for all internal imports

## Benefits

1. **Locality**: Related components are close to where they're used
2. **Discoverability**: Easy to find components specific to a feature
3. **Reusability**: Clear distinction between reusable and specific components
4. **Maintainability**: Changes to module-specific components don't affect other areas
5. **Bundle optimization**: Better code splitting and tree shaking