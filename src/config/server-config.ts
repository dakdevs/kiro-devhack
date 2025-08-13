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
    embeddings: {
        dashscope: {
            apiKey: env.DASHSCOPE_API_KEY,
            baseUrl: env.DASHSCOPE_BASE_URL,
            modelName: env.QWEN_MODEL_NAME,
        },
    },
    app: {
        nodeEnv: env.NODE_ENV,
    },
} as const;