"use client"

import { Search, Target, Calendar, TrendingUp, Bell, Settings } from 'lucide-react'
import { useState } from 'react'

export function JobSearchOverview() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Welcome Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium mb-2">
            <Calendar className="h-4 w-4" />
            {currentDate}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Welcome back! 🚀
          </h1>
          <p className="text-indigo-100 text-lg">
            Let's find your dream job and ace those interviews.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4">
          {/* Job Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-200" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-indigo-200" />
            <span className="text-indigo-100 text-xs font-medium">Applications</span>
          </div>
          <div className="text-2xl font-bold">23</div>
          <div className="text-indigo-200 text-xs">This month</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-indigo-200" />
            <span className="text-indigo-100 text-xs font-medium">Interviews</span>
          </div>
          <div className="text-2xl font-bold">5</div>
          <div className="text-indigo-200 text-xs">Scheduled</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-indigo-200" />
            <span className="text-indigo-100 text-xs font-medium">Response Rate</span>
          </div>
          <div className="text-2xl font-bold">34%</div>
          <div className="text-indigo-200 text-xs">Above average</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-indigo-200" />
            <span className="text-indigo-100 text-xs font-medium">Goal Progress</span>
          </div>
          <div className="text-2xl font-bold">76%</div>
          <div className="text-indigo-200 text-xs">Monthly target</div>
        </div>
      </div>
    </div>
  )
}