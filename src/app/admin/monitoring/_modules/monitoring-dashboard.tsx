"use client"

import { useState, useEffect } from 'react';
import { LoadingFallback, SkeletonCard } from '~/components/loading-fallback';

interface HealthCheck {
  status: string;
  responseTime: number;
  error?: string;
  recentNotifications?: number;
}

interface HealthData {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    interviewSystem: HealthCheck;
    aiService: HealthCheck;
    notifications: HealthCheck;
  };
  metrics: {
    totalRecruiters: number;
    activeJobs: number;
    totalAvailabilitySlots: number;
    scheduledInterviews: number;
    pendingNotifications: number;
  };
  uptime: number;
  totalResponseTime: number;
}

export function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/interview-system');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-apple-green bg-apple-green/10 border-apple-green';
      case 'degraded':
        return 'text-apple-orange bg-apple-orange/10 border-apple-orange';
      case 'unhealthy':
        return 'text-apple-red bg-apple-red/10 border-apple-red';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-black border border-apple-red rounded-xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-apple-red/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            Monitoring Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={fetchHealthData}
            className="inline-flex items-center justify-center px-4 py-2 bg-apple-blue text-white rounded-lg font-medium transition-colors duration-150 hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return <LoadingFallback message="No health data available" />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            System Status
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchHealthData}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(healthData.status)}`}>
              {healthData.status.toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Overall Status</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatUptime(healthData.uptime)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white">
              {healthData.totalResponseTime}ms
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
          </div>
        </div>
      </div>

      {/* Service Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(healthData.checks).map(([service, check]) => (
          <div key={service} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black dark:text-white capitalize">
                {service.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className={`w-3 h-3 rounded-full ${
                check.status === 'healthy' ? 'bg-apple-green' :
                check.status === 'degraded' ? 'bg-apple-orange' : 'bg-apple-red'
              }`} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${
                  check.status === 'healthy' ? 'text-apple-green' :
                  check.status === 'degraded' ? 'text-apple-orange' : 'text-apple-red'
                }`}>
                  {check.status}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Response:</span>
                <span className="text-black dark:text-white">{check.responseTime}ms</span>
              </div>
              
              {check.error && (
                <div className="text-xs text-apple-red bg-apple-red/10 p-2 rounded">
                  {check.error}
                </div>
              )}
              
              {check.recentNotifications !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Recent:</span>
                  <span className="text-black dark:text-white">{check.recentNotifications}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          System Metrics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-apple-blue mb-2">
              {healthData.metrics.totalRecruiters}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Recruiters</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-apple-green mb-2">
              {healthData.metrics.activeJobs}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-apple-purple mb-2">
              {healthData.metrics.totalAvailabilitySlots}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Availability Slots</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-apple-orange mb-2">
              {healthData.metrics.scheduledInterviews}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled Interviews</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-apple-red mb-2">
              {healthData.metrics.pendingNotifications}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Notifications</p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          System Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-black dark:text-white mb-2">Version</h3>
            <p className="text-gray-600 dark:text-gray-400">{healthData.version}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-black dark:text-white mb-2">Environment</h3>
            <p className="text-gray-600 dark:text-gray-400 capitalize">{healthData.environment}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-black dark:text-white mb-2">Last Check</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}