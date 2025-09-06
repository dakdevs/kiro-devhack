"use client"

import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { 
  Calendar, 
  Briefcase, 
  Clock, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-apple-blue/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-apple-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black dark:text-white">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Job Matches</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-apple-green/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-apple-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black dark:text-white">2</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Interviews</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-apple-orange/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-apple-orange" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black dark:text-white">4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Event Types</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-apple-purple/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-apple-purple" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black dark:text-white">87%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Job Matches
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover new job opportunities that match your skills and experience
            </p>
          </div>
          <Link href="/dashboard/job-matches">
            <Button className="w-full">
              View Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Interviews
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your scheduled interviews and upcoming sessions
            </p>
          </div>
          <Link href="/dashboard/interviews">
            <Button className="w-full">
              View Interviews
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Event Types
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set up your interview availability and event types for recruiters
            </p>
          </div>
          <Link href="/dashboard/event-types">
            <Button className="w-full">
              Manage Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-8 h-8 bg-apple-green/10 rounded-full flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-apple-green" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black dark:text-white">
                New job match found
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Senior Full Stack Developer at TechCorp Solutions • 87% match
              </div>
            </div>
            <div className="text-xs text-gray-500">2h ago</div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-8 h-8 bg-apple-blue/10 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-apple-blue" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black dark:text-white">
                Interview scheduled
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Technical interview with David Kim tomorrow at 2:00 PM
              </div>
            </div>
            <div className="text-xs text-gray-500">1d ago</div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-8 h-8 bg-apple-orange/10 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-apple-orange" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black dark:text-white">
                Event type created
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Technical Interview - 45 min is now available for booking
              </div>
            </div>
            <div className="text-xs text-gray-500">3d ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}