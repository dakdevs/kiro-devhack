# Better Profile App

A Next.js application with authentication powered by Better Auth, PostgreSQL database with pgvector support, and modern tooling.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v10.14.0 or higher) - This project uses pnpm as the package manager
- **Docker** and **Docker Compose** - For running the PostgreSQL database
- **Google OAuth App** - For authentication (see setup instructions below)

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd better-profile-app
pnpm install
```

### 2. Environment Configuration

**⚠️ CRITICAL: You must create a `.env.local` file before running the application.**

Copy the example environment file and configure it:

```bash
cp .env.local.example .env.local
```

Generate a secure secret for Better Auth:

```bash
# Generate a random 32-character base64 secret
openssl rand -base64 32
```

Copy the output and use it as your `BETTER_AUTH_SECRET` value.

Edit `.env.local` with your actual values:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-key-here"  # Generate using: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (REQUIRED - see setup instructions below)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# PostgreSQL Database Configuration (can keep defaults for local development)
POSTGRES_DB="myapp"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp"
```

### 3. Google OAuth Setup

To enable authentication, you need to create a Google OAuth application:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local` file

### 4. Start the Application

The easiest way to start everything:

```bash
pnpm dev
```

This command will:
- Start the PostgreSQL database with Docker Compose
- Run the Next.js development server with Turbopack

Alternatively, you can run components separately:

```bash
# Start only the database
pnpm run dev:db

# Start only the Next.js app (in another terminal)
pnpm run dev:app
```

### 5. Database Setup

The database will automatically start with Docker, but you may need to run migrations:

```bash
# Generate migration files (if schema changes)
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Or push schema directly (for development)
pnpm run db:push
```

**⚠️ Important**: Always use `pnpm run db:generate` to create migrations. Never create manual SQL migration files. All schema changes should be made in `src/db/schema.ts` and then generate migrations using drizzle-kit.

### 6. Access the Application

- **Application**: http://localhost:3000
- **Database Studio**: `pnpm run db:studio` (opens Drizzle Studio)

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start database and Next.js app |
| `pnpm run dev:db` | Start only PostgreSQL database |
| `pnpm run dev:app` | Start only Next.js application |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm run db:stop` | Stop the database |
| `pnpm run db:generate` | Generate database migrations |
| `pnpm run db:migrate` | Run database migrations |
| `pnpm run db:push` | Push schema to database |
| `pnpm run db:studio` | Open Drizzle Studio |

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── config/             # Configuration files
│   ├── db/                 # Database schema and utilities
│   └── lib/                # Utility libraries
├── drizzle/                # Database migrations
├── public/                 # Static assets
├── .env.local.example      # Environment variables template
└── docker-compose.yml      # PostgreSQL database setup
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Better Auth
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Development**: Turbopack, ESLint, TypeScript

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure Docker is running
2. Check if PostgreSQL container is healthy: `docker ps`
3. Verify environment variables in `.env.local`
4. Restart the database: `pnpm run db:stop && pnpm run dev:db`

### Authentication Issues

1. Verify Google OAuth credentials in `.env.local`
2. Check that redirect URIs match in Google Cloud Console
3. Ensure `BETTER_AUTH_SECRET` is set and sufficiently random

### Port Conflicts

If port 3000 or 5432 is already in use:
- For Next.js: `pnpm run dev:app -- -p 3001`
- For PostgreSQL: Modify the port mapping in `docker-compose.yml`

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | ✅ | Secret key for auth encryption | `"random-32-char-string"` |
| `BETTER_AUTH_URL` | ✅ | Base URL of your application | `"http://localhost:3000"` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID | `"123456789.apps.googleusercontent.com"` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret | `"GOCSPX-abcdef123456"` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `"postgresql://user:pass@localhost:5432/db"` |
| `POSTGRES_DB` | ⚠️ | Database name (for Docker) | `"myapp"` |
| `POSTGRES_USER` | ⚠️ | Database user (for Docker) | `"postgres"` |
| `POSTGRES_PASSWORD` | ⚠️ | Database password (for Docker) | `"password"` |

**✅ Required**: Must be set for the application to work  
**⚠️ Docker**: Used by Docker Compose, can keep defaults for local development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.
