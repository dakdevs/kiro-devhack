"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Clock, Video, Edit, Trash2, Copy, ExternalLink } from 'lucide-react';

interface EventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  locations?: Array<{ type: string; link?: string }>;
  hidden: boolean;
}

interface EventTypeCardProps {
  eventType: EventType;
  onUpdate: (id: number, updates: Partial<EventType>) => void;
  onDelete: (id: number) => void;
}

export function EventTypeCard({ eventType, onUpdate, onDelete }: EventTypeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: eventType.title,
    length: eventType.length,
    description: eventType.description || '',
  });

  const handleSave = () => {
    onUpdate(eventType.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: eventType.title,
      length: eventType.length,
      description: eventType.description || '',
    });
    setIsEditing(false);
  };

  const copyBookingLink = () => {
    const bookingUrl = `${window.location.origin}/book/${eventType.slug}`;
    navigator.clipboard.writeText(bookingUrl);
    // You could add a toast notification here
  };

  const getLocationIcon = () => {
    const locationType = eventType.locations?.[0]?.type;
    if (locationType?.includes('zoom')) return <Video className="w-4 h-4" />;
    return <Video className="w-4 h-4" />;
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
            placeholder="Event type title"
          />
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={editData.length}
              onChange={(e) => setEditData(prev => ({ ...prev, length: parseInt(e.target.value) }))}
              className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              min="15"
              max="240"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
          </div>
          
          <textarea
            value={editData.description}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white resize-none"
            rows={3}
            placeholder="Description (optional)"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-apple-blue hover:bg-blue-600 text-white"
            >
              Save
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                {eventType.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {eventType.length} min
                </div>
                <div className="flex items-center gap-1">
                  {getLocationIcon()}
                  Video call
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="p-2"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onDelete(eventType.id)}
                size="sm"
                variant="ghost"
                className="p-2 text-apple-red hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {eventType.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {eventType.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={copyBookingLink}
              size="sm"
              variant="secondary"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              onClick={() => window.open(`/book/${eventType.slug}`, '_blank')}
              size="sm"
              variant="secondary"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}