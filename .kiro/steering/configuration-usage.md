# Configuration Usage Guidelines

## Configuration Structure

The application uses a hierarchical configuration system with environment validation.

## Configuration Files

- `~/config/env.ts` - Base environment configuration using @t3-oss/env-nextjs with Zod validation
- `~/config/server-config.ts` - Hierarchical server-side configuration
- `~/config/public-config.ts` - Hierarchical client-side configuration  
- `~/config/index.ts` - Barrel exports for easy importing

## Usage Patterns

### Server-Side Configuration
Use `serverConfig` for server-only values (secrets, database URLs, etc.):

```typescript
import { serverConfig } from '~/config/server-config';

// Database configuration
const dbUrl = serverConfig.db.url;
const dbName = serverConfig.db.name;

// Authentication secrets
const authSecret = serverConfig.auth.secret;
const googleClientId = serverConfig.auth.google.clientId;
const googleClientSecret = serverConfig.auth.google.clientSecret;

// App environment
const nodeEnv = serverConfig.app.nodeEnv;
```

### Client-Side Configuration
Use `publicConfig` for client-safe values only:

```typescript
import { publicConfig } from '~/config/public-config';

// Only use for values that are safe to expose to the client
// Never include secrets, API keys, or sensitive data
```

## Rules

1. **Never import `serverConfig` in client components** - This will cause build errors
2. **Only put public-safe values in `publicConfig`** - No secrets or sensitive data
3. **Use the hierarchical structure** - Access nested properties like `serverConfig.db.url`
4. **Import from the specific config file** - Don't import from the barrel export unless needed
5. **Validate all environment variables** - Use Zod schemas in `env.ts`

## Environment Variable Naming

Follow this pattern for environment variables:
- Database: `DATABASE_URL`, `POSTGRES_*`
- Authentication: `BETTER_AUTH_*`, `GOOGLE_*`
- App: `NODE_ENV`, `NEXT_PUBLIC_*` (for client-side)