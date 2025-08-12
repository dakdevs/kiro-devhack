"use client"

import { TrendingUp, TrendingDown, MoreHorizontal, Calendar, Download } from 'lucide-react'
import { useState } from 'react'

const chartData = [
  { month: 'Jan', revenue: 4000, users: 240, orders: 120 },
  { month: 'Feb', revenue: 3000, users: 198, orders: 98 },
  { month: 'Mar', revenue: 5000, users: 320, orders: 180 },
  { month: 'Apr', revenue: 4500, users: 290, orders: 165 },
  { month: 'May', revenue: 6000, users: 380, orders: 220 },
  { month: 'Jun', revenue: 5500, users: 350, orders: 195 },
  { month: 'Jul', revenue: 7000, users: 420, orders: 280 },
  { month: 'Aug', revenue: 6500, users: 390, orders: 245 },
  { month: 'Sep', revenue: 8000, users: 480, orders: 320 },
  { month: 'Oct', revenue: 7500, users: 450, orders: 295 },
  { month: 'Nov', revenue: 9000, users: 520, orders: 380 },
  { month: 'Dec', revenue: 8500, users: 490, orders: 350 }
]

export function PerformanceChart() {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'users' | 'orders'>('revenue')
  const [timeRange, setTimeRange] = useState('12M')

  const maxValue = Math.max(...chartData.map(d => d[activeMetric]))
  const currentValue = chartData[chartData.length - 1][activeMetric]
  const previousValue = chartData[chartData.length - 2][activeMetric]
  const change = ((currentValue - previousValue) / previousValue * 100).toFixed(1)
  const isPositive = Number(change) > 0

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'revenue': return 'Revenue'
      case 'users': return 'Users'
      case 'orders': return 'Orders'
      default: return metric
    }
  }

  const getMetricValue = (value: number, metric: string) => {
    switch (metric) {
      case 'revenue': return `$${(value / 1000).toFixed(1)}k`
      case 'users': return value.toString()
      case 'orders': return value.toString()
      default: return value.toString()
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Track your key metrics over time</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7D">7 Days</option>
            <option value="30D">30 Days</option>
            <option value="12M">12 Months</option>
          </select>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['revenue', 'users', 'orders'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeMetric === metric
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {getMetricLabel(metric)}
          </button>
        ))}
      </div>

      {/* Current Value & Change */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {getMetricValue(currentValue, activeMetric)}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
          isPositive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(Number(change))}%
        </div>
        <span className="text-gray-500 text-sm">vs last month</span>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between gap-2">
          {chartData.map((data, index) => {
            const height = (data[activeMetric] / maxValue) * 100
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer relative group"
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      {data.month}: {getMetricValue(data[activeMetric], activeMetric)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">{data.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">{getMetricLabel(activeMetric)}</span>
            </div>
          </div>
          <div className="text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}