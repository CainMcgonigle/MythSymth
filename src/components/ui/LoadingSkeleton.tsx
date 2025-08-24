import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  lines?: number;
}

const Skeleton = React.memo<SkeletonProps>(({
  width,
  height,
  className = '',
  variant = 'text',
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-700 rounded';
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'w-full h-20',
    circular: 'rounded-full w-10 h-10',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export const NodeSkeleton = React.memo(() => (
  <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton width="60%" height={20} />
        <div className="mt-2">
          <Skeleton variant="text" lines={2} />
        </div>
      </div>
    </div>
  </div>
));

NodeSkeleton.displayName = 'NodeSkeleton';

export const SidebarSkeleton = React.memo(() => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <NodeSkeleton key={index} />
    ))}
  </div>
));

SidebarSkeleton.displayName = 'SidebarSkeleton';

export const GraphSkeleton = React.memo(() => (
  <div className="flex-1 bg-gray-900 relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <Skeleton width={200} height={20} />
        <div className="mt-2">
          <Skeleton width={150} height={16} />
        </div>
      </div>
    </div>
  </div>
));

GraphSkeleton.displayName = 'GraphSkeleton';

export default Skeleton;