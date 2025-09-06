import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.CAL_API_KEY;
        if (!apiKey) {
            throw new Error('Cal.com API key is not configured.');
        }

        const { searchParams } = new URL(request.url);
        const eventTypeId = searchParams.get('eventTypeId');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');

        if (!eventTypeId || !startTime || !endTime) {
            return new NextResponse('Missing required query parameters: eventTypeId, startTime, endTime', { status: 400 });        
        }

        const params = new URLSearchParams({
            apiKey: apiKey,
            eventTypeId: eventTypeId,
            startTime: startTime,
            endTime: endTime,
        });

        const slotsUrl = `https://api.cal.com/v1/slots?${params.toString()}`;

        const slotsResponse = await fetch(slotsUrl);

        if (!slotsResponse.ok) {
            throw new Error(`Failed to fetch slots: ${await slotsResponse.text()}`);
        }

        const slotsData = await slotsResponse.json();

        // Ensure we always return an array
        const slots = Array.isArray(slotsData?.slots) ? slotsData.slots : [];
        
        // Transform slots to ensure consistent format
        const formattedSlots = slots.map((slot: any) => ({
            time: typeof slot === 'string' ? slot : slot.time || slot,
            attendees: slot.attendees || 0
        }));

        return NextResponse.json(formattedSlots);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[SCHEDULING_SLOTS_ERROR]', errorMessage);
        return new NextResponse(errorMessage, { status: 500 });
    }
}