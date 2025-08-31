interface LoadingFallbackProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LoadingFallback({ 
  message = 'Loading...', 
  size = 'medium',
  className = '' 
}: LoadingFallbackProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const containerClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin mx-auto mb-2`} />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex space-x-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                  colIndex === 0 ? 'w-1/4' : colIndex === cols - 1 ? 'w-1/6' : 'flex-1'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}