# Import Pattern Guidelines

## Core Rule
**Always use `~/` for internal imports, never `@/`**

## Examples

### ✅ Correct Import Patterns
```typescript
// Configuration imports
import { serverConfig } from '~/config/server-config';
import { publicConfig } from '~/config/public-config';

// Component imports
import { AuthForm } from '~/components/auth-form';
import { Button } from '~/components/ui/button';

// Database imports
import { db } from '~/db';
import { users } from '~/db/schema';

// Utility imports
import { cn } from '~/lib/utils';
import { auth } from '~/lib/auth';
```

### ❌ Incorrect Import Patterns
```typescript
// Don't use @/ prefix
import { serverConfig } from '@/config/server-config';
import { AuthForm } from '@/components/auth-form';
import { db } from '@/db';
```

## Rationale
- Consistent import pattern across the entire codebase
- `~/` is configured in tsconfig.json as the path alias
- Easier to distinguish between internal and external imports
- Better IDE support and autocomplete