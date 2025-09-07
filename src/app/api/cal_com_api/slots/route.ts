import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventTypeId = searchParams.get('eventTypeId');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');

        if (!eventTypeId || !startTime || !endTime) {
            return NextResponse.json({
                success: false,
                error: 'Missing required query parameters: eventTypeId, startTime, endTime'
            }, { status: 400 });        
        }

        // Validate eventTypeId is a number
        const eventTypeIdNum = parseInt(eventTypeId);
        if (isNaN(eventTypeIdNum)) {
            return NextResponse.json({
                success: false,
                error: 'eventTypeId must be a valid number'
            }, { status: 400 });
        }

        // Validate date formats
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({
                success: false,
                error: 'Invalid date format for startTime or endTime'
            }, { status: 400 });
        }

        // Use global API key as fallback
        const apiKey = serverConfig.cal.apiKey;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Cal.com API key is not configured'
            }, { status: 500 });
        }

        const params = new URLSearchParams({
            apiKey: apiKey,
            eventTypeId: eventTypeId,
            startTime: startTime,
            endTime: endTime,
        });

        const slotsUrl = `https://api.cal.com/v1/slots?${params.toString()}`;
        console.log('[CAL_COM_SLOTS] Fetching slots from:', slotsUrl.replace(apiKey, '[API_KEY]'));

        const slotsResponse = await fetch(slotsUrl, {
            headers: {
                'User-Agent': 'RecruiterPlatform/1.0'
            }
        });

        if (!slotsResponse.ok) {
            const errorText = await slotsResponse.text();
            console.error('[CAL_COM_SLOTS] API Error:', errorText);
            throw new Error(`Failed to fetch slots: ${slotsResponse.status} ${errorText}`);
        }

        const slotsData = await slotsResponse.json();
        console.log('[CAL_COM_SLOTS] Raw response:', slotsData);

        // Handle different response formats from Cal.com
        let slots = [];
        
        if (slotsData.slots && Array.isArray(slotsData.slots)) {
            slots = slotsData.slots;
        } else if (Array.isArray(slotsData)) {
            slots = slotsData;
        } else if (slotsData.data && Array.isArray(slotsData.data)) {
            slots = slotsData.data;
        }
        
        // Transform slots to ensure consistent format
        const formattedSlots = slots.map((slot: any) => {
            if (typeof slot === 'string') {
                return {
                    time: slot,
                    attendees: 0
                };
            } else if (slot && typeof slot === 'object') {
                return {
                    time: slot.time || slot.start || slot,
                    attendees: slot.attendees || 0
                };
            } else {
                return {
                    time: slot,
                    attendees: 0
                };
            }
        }).filter(slot => slot.time); // Filter out invalid slots

        console.log('[CAL_COM_SLOTS] Formatted slots:', formattedSlots.length);

        return NextResponse.json({
            success: true,
            slots: formattedSlots,
            count: formattedSlots.length
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[SCHEDULING_SLOTS_ERROR]', errorMessage, error);
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}