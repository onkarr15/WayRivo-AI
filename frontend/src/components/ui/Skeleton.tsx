import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-surface-elevated/80 border border-white/5';

  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
    card: 'rounded-3xl h-64 w-full',
  }[variant];

  return (
    <div
      className={`${baseStyles} ${variantStyles} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style,
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-surface/90 border border-border/80 p-5 space-y-4">
          <Skeleton variant="rectangular" className="h-48 w-full rounded-2xl" />
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/3 h-3" />
            <Skeleton variant="text" className="w-3/4 h-5" />
            <Skeleton variant="text" className="w-full h-3" />
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Skeleton variant="text" className="w-1/4 h-6" />
            <Skeleton variant="rectangular" className="w-20 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
