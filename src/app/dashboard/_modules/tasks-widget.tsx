"use client"

import { CheckCircle2, Circle, Clock, AlertTriangle, Plus } from 'lucide-react'
import { useState } from 'react'

const initialTasks = [
  {
    id: 1,
    title: 'Review Q4 analytics report',
    priority: 'high' as const,
    completed: false,
    dueDate: '2025-01-10'
  },
  {
    id: 2,
    title: 'Update user documentation',
    priority: 'medium' as const,
    completed: true,
    dueDate: '2025-01-08'
  },
  {
    id: 3,
    title: 'Schedule team meeting',
    priority: 'low' as const,
    completed: false,
    dueDate: '2025-01-12'
  },
  {
    id: 4,
    title: 'Optimize database queries',
    priority: 'high' as const,
    completed: false,
    dueDate: '2025-01-09'
  }
]

const priorityColors = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-orange-600 bg-orange-50',
  low: 'text-green-600 bg-green-50'
}

export function TasksWidget() {
  const [tasks, setTasks] = useState(initialTasks)
  const [showCompleted, setShowCompleted] = useState(true)

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const filteredTasks = showCompleted ? tasks : tasks.filter(task => !task.completed)
  const completedCount = tasks.filter(task => task.completed).length
  const totalCount = tasks.length

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <p className="text-gray-600 text-sm mt-1">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isOverdue = new Date(task.dueDate) < new Date() && !task.completed
          
          return (
            <div 
              key={task.id} 
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                task.completed 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}>
                  {task.title}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    priorityColors[task.priority]
                  }`}>
                    {task.priority}
                  </span>
                  
                  <div className={`flex items-center gap-1 text-xs ${
                    isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {isOverdue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks to show</p>
        </div>
      )}
    </div>
  )
}