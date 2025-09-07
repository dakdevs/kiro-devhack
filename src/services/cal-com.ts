import { serverConfig } from '~/config/server-config';

export interface CalComUser {
  id: number;
  username: string;
  name: string;
  email: string;
  timeZone: string;
}

export interface CalComSchedule {
  id: number;
  userId: number;
  name: string;
  timeZone: string;
  availability: Array<{
    id: number;
    days: number[];
    startTime: string;
    endTime: string;
  }>;
}

export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  hidden: boolean;
  scheduleId: number;
}

export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  location?: string;
  status: string;
}

export interface CalComSlot {
  time: string;
  attendees: number;
}

export class CalComService {
  private apiKey: string;
  private baseUrl = 'https://api.cal.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || serverConfig.cal.apiKey || '';
    if (!this.apiKey) {
      throw new Error('Cal.com API key is required');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${this.apiKey}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getUser(): Promise<CalComUser> {
    const data = await this.makeRequest<{ user: CalComUser }>('/me');
    return data.user;
  }

  async getSchedules(): Promise<CalComSchedule[]> {
    const data = await this.makeRequest<{ schedules: CalComSchedule[] }>('/schedules');
    return data.schedules;
  }

  async getEventTypes(): Promise<CalComEventType[]> {
    const data = await this.makeRequest<{ event_types: CalComEventType[] }>('/event-types');
    return data.event_types;
  }

  async createEventType(eventType: {
    title: string;
    slug: string;
    length: number;
    scheduleId: number;
    hidden?: boolean;
  }): Promise<CalComEventType> {
    const data = await this.makeRequest<{ event_type: CalComEventType }>('/event-types', {
      method: 'POST',
      body: JSON.stringify({
        ...eventType,
        metadata: {},
        hidden: eventType.hidden ?? false,
      }),
    });
    return data.event_type;
  }

  async getAvailableSlots(params: {
    eventTypeId: number;
    startTime: string;
    endTime: string;
  }): Promise<CalComSlot[]> {
    const { eventTypeId, startTime, endTime } = params;
    const endpoint = `/slots?eventTypeId=${eventTypeId}&startTime=${startTime}&endTime=${endTime}`;
    
    const data = await this.makeRequest<{ slots: CalComSlot[] }>(endpoint);
    return Array.isArray(data.slots) ? data.slots : [];
  }

  async createBooking(booking: {
    eventTypeId: number;
    start: string;
    end: string;
    timeZone: string;
    responses: {
      name: string;
      email: string;
    };
    metadata?: Record<string, any>;
    status?: string;
  }): Promise<CalComBooking> {
    const data = await this.makeRequest<{ booking: CalComBooking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...booking,
        language: 'en',
        status: booking.status || 'ACCEPTED',
      }),
    });
    return data.booking;
  }

  async getBookings(params?: {
    status?: string;
    userId?: number;
    eventTypeId?: number;
  }): Promise<CalComBooking[]> {
    let endpoint = '/bookings';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      if (searchParams.toString()) {
        endpoint += `?${searchParams.toString()}`;
      }
    }

    const data = await this.makeRequest<{ bookings: CalComBooking[] }>(endpoint);
    return data.bookings || [];
  }

  async cancelBooking(bookingId: number, reason?: string): Promise<void> {
    await this.makeRequest(`/bookings/${bookingId}/cancel`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleBooking(bookingId: number, params: {
    start: string;
    end: string;
    timeZone: string;
  }): Promise<CalComBooking> {
    const data = await this.makeRequest<{ booking: CalComBooking }>(`/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
    return data.booking;
  }

  // Utility method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getUser();
      return true;
    } catch {
      return false;
    }
  }

  // Get default schedule for a user
  async getDefaultSchedule(): Promise<CalComSchedule | null> {
    const schedules = await this.getSchedules();
    return schedules.length > 0 ? schedules[0] : null;
  }

  // Setup interview event type for recruiters
  async setupInterviewEventType(scheduleId: number): Promise<CalComEventType> {
    const timestamp = Date.now();
    return this.createEventType({
      title: '45-Minute Candidate Interview',
      slug: `candidate-interview-${timestamp}`,
      length: 45,
      scheduleId,
      hidden: false,
    });
  }
}

export const calComService = new CalComService();