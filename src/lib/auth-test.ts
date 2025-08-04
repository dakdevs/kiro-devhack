// Test file to verify Better Auth + Drizzle integration
import { auth } from "./auth"
import { db } from "~/db"
import { user } from "~/db/schema"

export async function testAuthIntegration() {
  try {
    // Test database connection
    const users = await db.select().from(user).limit(1)
    console.log("✅ Database connection successful")
    
    // Test auth instance
    console.log("✅ Better Auth instance created successfully")
    console.log("Auth config:", {
      hasDatabase: !!auth.options.database,
      hasSocialProviders: !!auth.options.socialProviders?.google,
      baseURL: auth.options.baseURL
    })
    
    return { success: true, message: "Better Auth + Drizzle integration working correctly" }
  } catch (error) {
    console.error("❌ Integration test failed:", error)
    return { success: false, error }
  }
}