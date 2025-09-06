"use client"

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface RecruiterBookingViewProps {
  calLink: string;
  candidateName?: string;
}

export function RecruiterBookingView({ calLink, candidateName }: RecruiterBookingViewProps) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        "styles": { 
          "branding": { 
            "brandColor": "#007AFF" // Apple blue
          } 
        },
        "hideEventTypeDetails": false,
        "layout": "month_view"
      });
    })();
  }, []);

  return (
    <div className="space-y-4">
      {candidateName && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
            Schedule Interview with {candidateName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Select an available time slot from the calendar below
          </p>
        </div>
      )}
      
      <div className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-black">
        <Cal
          calLink={calLink}
          style={{ width: "100%", height: "100%", overflow: "scroll" }}
          config={{ 
            layout: 'month_view',
            theme: 'auto'
          }}
        />
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <h4 className="font-medium text-black dark:text-white mb-2">
          Booking Information
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• All times are shown in your local timezone</li>
          <li>• You'll receive a calendar invitation after booking</li>
          <li>• The candidate will also receive confirmation details</li>
          <li>• You can reschedule or cancel from your calendar</li>
        </ul>
      </div>
    </div>
  );
}