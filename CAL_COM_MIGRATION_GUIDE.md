# Cal.com Migration Guide

## Overview

This document outlines the completed migration from the custom availability system to Cal.com integration. The migration simplifies scheduling by leveraging Cal.com's robust platform while maintaining a seamless user experience.

## What Changed

### For Candidates (Setting Availability)
- **Before**: Complex in-app availability management with custom calendar components
- **After**: Simple redirect to Cal.com for professional availability management

### For Recruiters (Booking Interviews)
- **Before**: Custom calendar view with manual slot selection
- **After**: Embedded Cal.com booking interface with candidate selection

## New File Structure

### Added Files
```
src/
├── app/
│   ├── api/cal/
│   │   ├── event-types/route.ts          # Proxy for Cal.com event types API
│   │   └── bookings/route.ts             # Proxy for Cal.com bookings API
│   └── recruiter/calendar/_modules/
│       ├── recruiter-booking-view.tsx    # Cal.com embed component
│       └── candidate-selector.tsx        # Candidate selection interface
├── services/
│   └── cal-integration.ts                # Cal.com service utilities
└── CAL_COM_MIGRATION_GUIDE.md           # This guide
```

### Modified Files
```
src/
├── app/
│   ├── dashboard/_modules/
│   │   └── availability-management-page.tsx  # Simplified to redirect to Cal.com
│   └── recruiter/calendar/
│       └── page.tsx                          # Updated to use new components
├── .env.example                              # Added CAL_API_KEY
└── .env.local                               # Added CAL_API_KEY
```

### Files Ready for Cleanup
```
src/
├── components/
│   ├── availability-calendar.tsx        # Can be removed
│   ├── availability-list.tsx           # Can be removed
│   └── availability-slot-form.tsx      # Can be removed
└── app/recruiter/calendar/_modules/
    ├── availability-selector.tsx       # Can be removed
    ├── calendar-integration.tsx        # Can be removed
    └── calendar-view.tsx              # Can be removed
```

## Setup Instructions

### 1. Cal.com Account Setup
1. Create a Cal.com account at https://cal.com
2. Connect your calendar (Google, Outlook, etc.)
3. Create event types for different interview durations
4. Get your API key from Settings → Developer → API Keys

### 2. Environment Configuration
Add your Cal.com API key to your environment files:

```bash
# .env.local
CAL_API_KEY=your_cal_api_key_here
```

### 3. User Migration Process
1. **Candidates**: Direct them to the new availability page which guides them to Cal.com
2. **Recruiters**: Update their workflow to use the new booking interface

## Features

### Candidate Experience
- Professional Cal.com interface for availability management
- Automatic calendar synchronization
- Smart timezone handling
- Buffer times and availability rules
- Email notifications

### Recruiter Experience
- Embedded Cal.com booking interface
- Candidate selection from existing database
- Real-time availability viewing
- Automatic calendar invitations
- Booking confirmation system

## API Integration

### Event Types Endpoint
```typescript
GET /api/cal/event-types?username={calUsername}
```
Fetches available event types for a Cal.com user.

### Bookings Endpoint
```typescript
GET /api/cal/bookings?userId={userId}
POST /api/cal/bookings
```
Manages bookings through Cal.com API.

### Service Layer
The `calIntegration` service provides:
- Event type fetching
- Booking creation and management
- URL generation for embeds
- Time formatting utilities
- Username validation

## Security Considerations

- Cal.com API key is stored server-side only
- All Cal.com API calls are proxied through Next.js API routes
- No sensitive data exposed to client-side
- Proper error handling and validation

## Benefits of Migration

1. **Reduced Complexity**: Eliminated ~1000+ lines of custom calendar code
2. **Better UX**: Professional, battle-tested booking interface
3. **Reliability**: Leverages Cal.com's robust infrastructure
4. **Features**: Advanced scheduling features out of the box
5. **Maintenance**: Reduced maintenance burden on custom code

## Testing

### Manual Testing Steps
1. Visit `/dashboard/availability` - should show Cal.com redirect page
2. Visit `/recruiter/calendar` - should show new booking interface
3. Test candidate selection functionality
4. Verify Cal.com embed loads correctly
5. Test API endpoints with valid Cal.com credentials

### Integration Testing
- Verify API routes work with Cal.com API
- Test error handling for invalid credentials
- Confirm proper data flow between components

## Rollback Plan

If issues arise, the old components are preserved and can be restored by:
1. Reverting the modified files to their previous versions
2. Removing the new Cal.com integration files
3. Updating imports to use the old components

## Next Steps

1. **Production Deployment**: Deploy with Cal.com API key configured
2. **User Communication**: Notify users about the new scheduling system
3. **Cleanup**: Remove old components after successful migration
4. **Monitoring**: Monitor Cal.com integration for any issues
5. **Documentation**: Update user guides and help documentation

## Support

For issues with:
- **Cal.com Integration**: Check API key configuration and network connectivity
- **Embed Loading**: Verify Cal.com service status and embed URLs
- **User Migration**: Provide Cal.com setup guides and support

## Dependencies Added

```json
{
  "@calcom/embed-react": "^1.5.3"
}
```

This migration significantly simplifies the codebase while providing a more robust and feature-rich scheduling experience for both candidates and recruiters.