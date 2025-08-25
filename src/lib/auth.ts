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
      redirectURI: `${serverConfig.auth.baseUrl}/api/auth/callback/google`,
    },
  },
  secret: serverConfig.auth.secret,
  baseURL: serverConfig.auth.baseUrl,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("Sign in callback:", { user: user?.email, account: account?.provider })
      return true
    },
    async redirect({ url, baseURL }) {
      console.log("Redirect callback:", { url, baseURL })
      // Redirect to dashboard after successful sign in
      if (url === baseURL || url === `${baseURL}/`) {
        return `${baseURL}/dashboard`
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseURL}${url}`
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseURL) {
        return url
      }
      return `${baseURL}/dashboard`
    },
  },
})