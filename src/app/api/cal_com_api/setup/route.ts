import { NextResponse } from 'next/server';

interface Availability{
    id: number;
    days: number[];
    startTime: string;
    endTime: string;
}

interface Schedule{
    id: number;
    userId: number;
    name: string;
    availability: Availability[];
}

export async function POST() {
    try{
        const apiKey = process.env.CAL_API_KEY;
        if (!apiKey){
            throw new Error('Cal.com API not configured');
        }

        const schedulesResponse = await fetch(`https://api.cal.com/v1/schedules?apiKey=${apiKey}`);
        if(!schedulesResponse.ok){
            throw new Error('Failed to fetch schedules from cal.com');
        }
        const schedulesData: { schedules: Schedule[] } = await schedulesResponse.json();

        const targetSchedules = schedulesData.schedules[0];
        if (!targetSchedules){
            throw new Error('No schedules found for the provided api key.');
        }
        const scheduleId = targetSchedules.id;

        const eventTypeResponse = await fetch (`https://api.cal.com/v1/event-types?apiKey=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
       
                title: "45-Minute Candidate Interview",
                slug: `candidate-interview-${Date.now()}`, // Unique slug
                length: 45, // Duration in minutes
                hidden: false, // shows it from the main public booking page
                scheduleId: scheduleId, // Links this event type to the recruiter's schedule
                metadata: {}, // Required, even if empty
            }
        ),
    });

    if (!eventTypeResponse.ok){
        throw new Error(`Failed to create new event type: ${await eventTypeResponse.text()}`);
    }

    const newEventType = await eventTypeResponse.json();

    return NextResponse.json({
        message: "Setup complete! event type created successfully ",
        eventTypeId: newEventType.event_type.id,
    });
}catch(error){
    const errorMessage = error instanceof Error ? error.message: 'An unknown error occured';
    console.error('[SCHEDULING_SETUP_ERROR]', errorMessage);
    return new NextResponse(errorMessage, { status: 500});
}
}