import { env } from './env';

/**
 * Server-side configuration with hierarchical structure
 * Pulls from the main env configuration and organizes into logical groups
 */
export const serverConfig = {
    db: {
        url: env.DATABASE_URL,
        name: env.POSTGRES_DB,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
    },
    auth: {
        secret: env.BETTER_AUTH_SECRET,
        baseUrl: env.BETTER_AUTH_URL,
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    app: {
        nodeEnv: env.NODE_ENV,
    },
    ai: {
        openRouterApiKey: env.OPENROUTER_API_KEY,
    },
    cal: {
        apiKey: env.CAL_API_KEY,
    },
} as const;