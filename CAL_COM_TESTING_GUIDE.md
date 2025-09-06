# Cal.com API Testing Guide

## Issue Fixed

The main issue was that the `auth()` function from better-auth was being called incorrectly in API routes. The correct way to get a session in API routes is:

```typescript
// ❌ Wrong (causes "auth is not a function" error)
const session = await auth();

// ✅ Correct
const session = await auth.api.getSession({
  headers: request.headers,
});
```

## Fixed Files

The following files have been updated with the correct auth pattern:
- `src/app/api/cal_com_api/connect/route.ts`
- `src/app/api/cal_com_api/sync-event-types/route.ts`
- `src/app/api/availability/[id]/route.ts`

## Testing Strategy

### 1. Quick Cal.com API Key Test

Test if your Cal.com API key works:

```bash
pnpm test:cal-quick
```

This will:
- Verify your API key is in `.env.local`
- Test basic Cal.com API connectivity
- Show your user info, event types, and schedules

### 2. Comprehensive Cal.com API Test

Test all Cal.com API endpoints systematically:

```bash
pnpm test:cal-api
```

This will test:
- User endpoints (`/me`)
- Event types (`/event-types`)
- Schedules (`/schedules`)
- Availability (`/availability`)
- Bookings (`/bookings`)
- Teams (`/teams`)
- Webhooks (`/webhooks`)

### 3. Local API Endpoints Test

Test your local Next.js API routes:

```bash
# Make sure your app is running first
pnpm dev

# Then in another terminal
pnpm test:local-apis
```

This will test:
- Health endpoint
- Auth-protected endpoints (should return 401)
- Cal.com integration endpoints
- Chat endpoint

### 4. Test Specific Endpoint

Test a specific Cal.com API endpoint:

```bash
pnpm test:cal-api endpoint /me GET
pnpm test:cal-api endpoint /event-types GET
```

## Environment Setup

Make sure your `.env.local` file contains:

```env
CAL_COM_API_KEY=your_cal_com_api_key_here
```

To get your Cal.com API key:
1. Go to [Cal.com](https://cal.com)
2. Sign in to your account
3. Go to Settings → Developer → API Keys
4. Generate a new API key
5. Copy it to your `.env.local` file

## Expected Results

### Cal.com API Tests
- ✅ All endpoints should return 200 status codes
- ✅ User info should show your Cal.com profile
- ✅ Event types should list your available meeting types
- ✅ Schedules should show your availability schedules

### Local API Tests
- ✅ Health endpoint should return 200
- 🔒 Auth-protected endpoints should return 401 (expected)
- ❌ Any 500 errors indicate server issues that need fixing

## Troubleshooting

### "auth is not a function" Error
This has been fixed in the updated files. The issue was using `auth()` instead of `auth.api.getSession()`.

### Invalid Cal.com API Key
- Verify the API key is correct in `.env.local`
- Make sure there are no extra spaces or quotes
- Generate a new API key if needed

### Network Errors
- Check your internet connection
- Verify Cal.com API is accessible
- Check if you're behind a firewall

### Local API Errors
- Make sure your Next.js app is running (`pnpm dev`)
- Check the console for detailed error messages
- Verify database is running (`pnpm dev:db`)

## Next Steps

After running the tests:

1. **If Cal.com tests pass**: Your API key is working correctly
2. **If local API tests show auth errors**: This is expected for protected routes
3. **If you see 500 errors**: Check the console logs for detailed error messages

The Cal.com integration should now work correctly in your application. You can test the actual integration by:

1. Starting your app: `pnpm dev`
2. Going to the interview scheduling page
3. Clicking "Connect Your Cal.com Account"
4. The API key should be read from your `.env.local` file automatically

## Files Created

- `scripts/test-cal-com-apis.ts` - Comprehensive Cal.com API tester
- `scripts/quick-cal-test.ts` - Quick Cal.com API key verification
- `scripts/test-local-apis.ts` - Local API endpoint tester
- `src/app/api/health/route.ts` - Health check endpoint
- `CAL_COM_TESTING_GUIDE.md` - This guide