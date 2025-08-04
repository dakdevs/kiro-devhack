# Client Component Rules

## Core Principle
**Pages and layouts should NEVER use `"use client"` and should remain server-side by default. Only use `"use client"` when absolutely necessary and at the leaves of the component tree.**

## Rules

### 1. Pages and Layouts
- ❌ **NEVER** add `"use client"` to page components (`page.tsx`)
- ❌ **NEVER** add `"use client"` to layout components (`layout.tsx`)
- ✅ Keep pages and layouts as server components for better performance and SEO

### 2. Client Components Usage
- ✅ Only use `"use client"` when you need:
  - Browser APIs (localStorage, sessionStorage, window, document)
  - Event handlers (onClick, onChange, onSubmit)
  - React hooks (useState, useEffect, useContext)
  - Third-party libraries that require client-side execution

### 3. Component Architecture
- ✅ Push `"use client"` as far down the component tree as possible
- ✅ Create small, focused client components for interactive features
- ✅ Wrap client functionality in dedicated components
- ✅ Pass data from server components to client components via props

## Examples

### ❌ Bad - Page with "use client"
```typescript
// app/dashboard/page.tsx
"use client" // DON'T DO THIS

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <InteractiveWidget />
    </div>
  )
}
```

### ✅ Good - Server page with client leaf components
```typescript
// app/dashboard/page.tsx (Server Component)
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <InteractiveWidget /> {/* This component uses "use client" */}
    </div>
  )
}

// components/interactive-widget.tsx (Client Component)
"use client"

export function InteractiveWidget() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### ✅ Good - Composition Pattern
```typescript
// app/profile/page.tsx (Server Component)
import { getUserData } from '~/lib/user'
import { ProfileForm } from '~/components/profile-form'

export default async function ProfilePage() {
  const user = await getUserData() // Server-side data fetching
  
  return (
    <div>
      <h1>Profile</h1>
      <ProfileForm initialData={user} /> {/* Client component receives server data */}
    </div>
  )
}

// components/profile-form.tsx (Client Component)
"use client"

interface ProfileFormProps {
  initialData: User
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState(initialData)
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Interactive form elements */}
    </form>
  )
}
```

## Benefits of This Approach

1. **Better Performance**: Server components are rendered on the server, reducing client-side JavaScript bundle
2. **SEO Friendly**: Server-rendered content is immediately available to search engines
3. **Faster Initial Load**: Less JavaScript to download and execute on the client
4. **Better UX**: Content appears faster, progressive enhancement
5. **Security**: Sensitive operations stay on the server

## When to Use Client Components

- Form interactions and validation
- State management (useState, useReducer)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, geolocation)
- Real-time features (WebSocket connections)
- Third-party client-only libraries
- Animations and transitions requiring DOM manipulation

## Migration Strategy

If you have existing client components that could be server components:

1. Remove `"use client"` from the top-level component
2. Extract interactive parts into separate client components
3. Pass data down as props from server to client components
4. Test that functionality still works correctly