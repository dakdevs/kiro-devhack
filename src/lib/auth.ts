import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "~/db"
import { serverConfig } from "~/config/server-config"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: serverConfig.auth.google.clientId,
      clientSecret: serverConfig.auth.google.clientSecret,
    },
  },
  secret: serverConfig.auth.secret,
  baseURL: serverConfig.auth.baseUrl,
})