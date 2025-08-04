import { env } from './env';

/**
 * Public/Client-side configuration with hierarchical structure
 * Pulls from the main env configuration and organizes into logical groups
 * These variables are available on both server and client-side
 */
export const publicConfig = {
  app: {
    // Add your public configuration here
    // Example:
    // url: env.NEXT_PUBLIC_APP_URL,
    // apiUrl: env.NEXT_PUBLIC_API_URL,
  },
} as const;