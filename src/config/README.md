# Configuration

This directory contains the environment configuration for the application.

## Files

- `env.ts` - Base environment configuration using @t3-oss/env-nextjs with Zod validation
- `server-config.ts` - Hierarchical server-side configuration that pulls from env.ts
- `public-config.ts` - Hierarchical client-side configuration that pulls from env.ts
- `index.ts` - Barrel exports for easy importing

## Import Pattern

**Always use `~/` for internal imports, never `@/`**

```typescript
// ✅ Correct
import { serverConfig } from '~/config/server-config';

// ❌ Incorrect
import { serverConfig } from '@/config/server-config';
```

## Usage

### Server-side configuration
```typescript
import { serverConfig } from '~/config/server-config';

// Database
serverConfig.db.url
serverConfig.db.name

// Authentication
serverConfig.auth.secret
serverConfig.auth.google.clientId

// App
serverConfig.app.nodeEnv
```

### Client-side configuration
```typescript
import { publicConfig } from '~/config/public-config';

// Add your public config usage here
```