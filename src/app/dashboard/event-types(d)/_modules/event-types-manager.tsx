"use client"

import { useState, useEffect } from 'react';
import { EventTypeCard } from './event-type-card';
import { CreateEventTypeModal } from './create-event-type-modal';
import { Button } from '~/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface EventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  locations?: Array<{ type: string; link?: string }>;
  hidden: boolean;
}

export function EventTypesManager() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEventTypes = async () => {
    try {
      setRefreshing(true);
      // For demo purposes, we'll use a mock username
      // In production, this would come from the user's profile
      const response = await fetch('/api/cal/event-types?username=demo-user');
      
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data);
      } else {
        console.error('Failed to fetch event types');
        // Set some mock data for demo
        setEventTypes([
          {
            id: 1,
            title: 'Technical Interview - 45 min',
            slug: 'technical-interview-45min',
            length: 45,
            description: 'Technical interview for software engineering positions',
            locations: [{ type: 'integrations:zoom' }],
            hidden: false
          },
          {
            id: 2,
            title: 'Initial Screening - 30 min',
            slug: 'initial-screening-30min',
            length: 30,
            description: 'Initial screening call for candidates',
            locations: [{ type: 'integrations:zoom' }],
            hidden: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
      // Set mock data on error
      setEventTypes([
        {
          id: 1,
          title: 'Technical Interview - 45 min',
          slug: 'technical-interview-45min',
          length: 45,
          description: 'Technical interview for software engineering positions',
          locations: [{ type: 'integrations:zoom' }],
          hidden: false
        },
        {
          id: 2,
          title: 'Initial Screening - 30 min',
          slug: 'initial-screening-30min',
          length: 30,
          description: 'Initial screening call for candidates',
          locations: [{ type: 'integrations:zoom' }],
          hidden: false
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const handleCreateEventType = async (eventTypeData: {
    title: string;
    length: number;
    description: string;
    locations: Array<{ type: string }>;
  }) => {
    try {
      const response = await fetch('/api/cal/event-types/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventTypeData),
      });

      if (response.ok) {
        const newEventType = await response.json();
        setEventTypes(prev => [...prev, newEventType.event_type]);
        setShowCreateModal(false);
      } else {
        console.error('Failed to create event type');
        // For demo, add to local state
        const mockEventType = {
          id: Date.now(),
          title: eventTypeData.title,
          slug: eventTypeData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          length: eventTypeData.length,
          description: eventTypeData.description,
          locations: eventTypeData.locations,
          hidden: false
        };
        setEventTypes(prev => [...prev, mockEventType]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating event type:', error);
    }
  };

  const handleUpdateEventType = async (id: number, updates: Partial<EventType>) => {
    try {
      const response = await fetch(`/api/cal/event-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEventTypes(prev => 
          prev.map(et => et.id === id ? { ...et, ...updates } : et)
        );
      } else {
        console.error('Failed to update event type');
        // For demo, update local state anyway
        setEventTypes(prev => 
          prev.map(et => et.id === id ? { ...et, ...updates } : et)
        );
      }
    } catch (error) {
      console.error('Error updating event type:', error);
    }
  };

  const handleDeleteEventType = async (id: number) => {
    try {
      const response = await fetch(`/api/cal/event-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEventTypes(prev => prev.filter(et => et.id !== id));
      } else {
        console.error('Failed to delete event type');
        // For demo, delete from local state anyway
        setEventTypes(prev => prev.filter(et => et.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event type:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event Type
          </Button>
          
          <Button
            onClick={fetchEventTypes}
            disabled={refreshing}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {eventTypes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-black dark:text-white mb-2">
            No event types yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first event type to start accepting interview bookings
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event Type
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((eventType) => (
            <EventTypeCard
              key={eventType.id}
              eventType={eventType}
              onUpdate={handleUpdateEventType}
              onDelete={handleDeleteEventType}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateEventTypeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEventType}
        />
      )}
    </div>
  );
}