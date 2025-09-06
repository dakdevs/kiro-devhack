"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { X, Clock, Video } from 'lucide-react';

interface CreateEventTypeModalProps {
  onClose: () => void;
  onCreate: (eventTypeData: {
    title: string;
    length: number;
    description: string;
    locations: Array<{ type: string }>;
  }) => void;
}

export function CreateEventTypeModal({ onClose, onCreate }: CreateEventTypeModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    length: 30,
    description: '',
    locationType: 'integrations:zoom'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.length < 15 || formData.length > 240) {
      newErrors.length = 'Duration must be between 15 and 240 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onCreate({
      title: formData.title,
      length: formData.length,
      description: formData.description,
      locations: [{ type: formData.locationType }]
    });
  };

  const presetDurations = [15, 30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Create Event Type
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
              placeholder="e.g., Technical Interview"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-apple-red">{errors.title}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Duration *
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: parseInt(e.target.value) || 30 }))}
                  className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                  min="15"
                  max="240"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {presetDurations.map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, length: duration }))}
                    size="sm"
                    variant={formData.length === duration ? "default" : "secondary"}
                    className={formData.length === duration ? "bg-apple-blue text-white" : ""}
                  >
                    {duration}m
                  </Button>
                ))}
              </div>
            </div>
            {errors.length && (
              <p className="mt-1 text-sm text-apple-red">{errors.length}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Location
            </label>
            <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <Video className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Zoom (Video conferencing)
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none resize-none"
              rows={3}
              placeholder="Brief description of this event type..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-apple-blue hover:bg-blue-600 text-white"
            >
              Create Event Type
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}