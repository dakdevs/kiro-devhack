import { NextResponse } from 'next/server'
import { serverConfig } from '~/config/server-config'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: {
        baseURL: serverConfig.auth.baseUrl,
        hasGoogleClientId: !!serverConfig.auth.google.clientId,
        hasGoogleClientSecret: !!serverConfig.auth.google.clientSecret,
        hasSecret: !!serverConfig.auth.secret,
        expectedCallbackURL: `${serverConfig.auth.baseUrl}/api/auth/callback/google`
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}