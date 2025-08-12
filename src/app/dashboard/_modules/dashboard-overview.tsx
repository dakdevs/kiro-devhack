"use client"

import { Calendar, Bell, Search, Filter } from 'lucide-react'
import { useState } from 'react'

export function DashboardOverview() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Welcome Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-2">
            <Calendar className="h-4 w-4" />
            {currentDate}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Good morning, Alex! 👋
          </h1>
          <p className="text-blue-100 text-lg">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm w-64"
            />
          </div>

          {/* Filter Button */}
          <button className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
            <Filter className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold">98.5%</div>
          <div className="text-blue-100 text-sm">Uptime</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold">2.4s</div>
          <div className="text-blue-100 text-sm">Avg Response</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold">156</div>
          <div className="text-blue-100 text-sm">Active Users</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold">$12.4k</div>
          <div className="text-blue-100 text-sm">Today's Revenue</div>
        </div>
      </div>
    </div>
  )
}