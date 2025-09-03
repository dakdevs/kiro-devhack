import { RefreshCw, Briefcase, Target, TrendingUp } from 'lucide-react';

interface JobMatchingHeaderProps {
  matchCount: number;
  onRefresh: () => void;
  refreshing: boolean;
}

export function JobMatchingHeader({ matchCount, onRefresh, refreshing }: JobMatchingHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Your Jobs</h1>
          <p className="text-gray-600 mt-1">
            Jobs that match your skills with 90% or higher accuracy
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-apple-blue/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-apple-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High-Quality Matches</p>
              <p className="text-2xl font-bold text-gray-900">{matchCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Match Threshold</p>
              <p className="text-2xl font-bold text-gray-900">90%+</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {matchCount > 0 ? '95%' : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {matchCount > 0 && (
        <div className="bg-gradient-to-r from-apple-blue/10 to-purple-100 rounded-xl p-6 border border-apple-blue/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-apple-blue/20 rounded-lg">
              <Target className="h-6 w-6 text-apple-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Perfect Matches Found!</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                We found {matchCount} job{matchCount !== 1 ? 's' : ''} that closely match your skills and experience. 
                These positions have a 90% or higher compatibility score based on your interview data and skill profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}