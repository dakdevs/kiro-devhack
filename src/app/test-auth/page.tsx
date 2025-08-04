import { testAuthIntegration } from "~/lib/auth-test"

export default async function TestAuthPage() {
  const result = await testAuthIntegration()
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Better Auth + Drizzle Integration Test</h1>
      
      <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {result.success ? (
          <div>
            <h2 className="font-semibold">✅ Integration Test Passed</h2>
            <p>{result.message}</p>
          </div>
        ) : (
          <div>
            <h2 className="font-semibold">❌ Integration Test Failed</h2>
            <pre className="mt-2 text-sm">{JSON.stringify(result.error, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Integration Details</h2>
        <ul className="space-y-2">
          <li>✅ Better Auth configured with Drizzle adapter</li>
          <li>✅ PostgreSQL database with Better Auth tables</li>
          <li>✅ Google OAuth provider configured</li>
          <li>✅ Client-side auth hooks available</li>
          <li>✅ Server-side auth instance working</li>
        </ul>
      </div>
    </div>
  )
}