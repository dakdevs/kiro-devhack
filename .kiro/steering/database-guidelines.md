# Database Guidelines

## Core Principle
**Always use drizzle-kit for database schema changes and migrations. Never create manual SQL migration files.**

## Database Management Workflow

### 1. Schema Changes
- All database schema changes should be made in `src/db/schema.ts`
- Use Drizzle ORM's schema definition syntax
- Follow consistent naming conventions (snake_case for database columns, camelCase for TypeScript)

### 2. Migration Generation
- After making schema changes, generate migrations using drizzle-kit:
  ```bash
  pnpm db:generate
  ```
- This creates migration files in the appropriate directory
- Never manually create `.sql` migration files

### 3. Migration Application
- Apply migrations to the database:
  ```bash
  pnpm db:migrate
  ```
- For development, you can also use push for rapid iteration:
  ```bash
  pnpm db:push
  ```

### 4. Database Studio
- Use Drizzle Studio to inspect and manage data:
  ```bash
  pnpm db:studio
  ```

## Schema Design Best Practices

### Table Naming
- Use snake_case for table names
- Use descriptive, plural names for tables (e.g., `job_applications`, `user_profiles`)

### Column Naming
- Use snake_case for column names in the database
- Use camelCase in TypeScript schema definitions
- Include `created_at` and `updated_at` timestamps for audit trails

### Relationships
- Always define foreign key relationships with proper cascade options
- Use `onDelete: 'cascade'` for dependent records
- Use `onDelete: 'set null'` for optional relationships

### Example Schema Pattern
```typescript
export const jobApplications = pgTable('job_applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  jobTitle: text('job_title').notNull(),
  company: text('company').notNull(),
  status: text('status').notNull().default('applied'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

## Current Schema Overview

The application includes the following main table groups:

### Authentication Tables (Better Auth)
- `user` - User accounts and basic profile information
- `session` - User sessions for authentication
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

### Job Search Tables
- `job_applications` - User's job applications with status tracking
- `interviews` - Scheduled interviews linked to applications
- `user_profiles` - Extended user profile information (resume, skills, etc.)

### Utility Tables
- `embeddings` - Vector embeddings for AI features (pgvector)

## Available Scripts

- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Apply pending migrations to the database
- `pnpm db:push` - Push schema changes directly (development only)
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:stop` - Stop the database container

## Rules

1. **Never create manual SQL migration files** - Always use `pnpm db:generate`
2. **Always review generated migrations** before applying them
3. **Use transactions for complex migrations** when needed
4. **Test migrations on development data** before production
5. **Keep schema changes atomic** - one logical change per migration
6. **Document breaking changes** in commit messages and PR descriptions

## Database Configuration

The database configuration is managed through:
- Environment variables in `.env.local`
- Server configuration in `~/config/server-config.ts`
- Docker Compose for local development database

## Troubleshooting

### Migration Issues
- If migrations fail, check the database logs
- Ensure the database is running: `pnpm dev:db`
- Reset development database if needed (data will be lost)

### Schema Conflicts
- Always pull latest changes before making schema modifications
- Coordinate with team members on schema changes
- Use feature branches for significant schema changes