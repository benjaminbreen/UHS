/**
 * Skeleton.tsx
 * Beautiful skeleton loader for content loading states
 * Theme-aware with smooth shimmer animation
 */
import React from 'react';

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'custom';

interface SkeletonProps {
  /** Type of skeleton */
  variant?: SkeletonVariant;
  /** Width (only for custom variant) */
  width?: string | number;
  /** Height (only for custom variant) */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Number of lines (for text variant) */
  lines?: number;
}

const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full'
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'custom',
  width,
  height,
  rounded = 'md',
  className = '',
  lines = 1
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return 'skeleton-text';
      case 'title':
        return 'skeleton-title';
      case 'avatar':
        return 'skeleton-avatar';
      case 'card':
        return 'skeleton-card';
      default:
        return '';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton skeleton-text ${roundedClasses[rounded]}`}
            style={{
              width: i === lines - 1 ? '80%' : '100%', // Last line shorter
              ...style
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${getVariantClass()} ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  );
};

/**
 * SkeletonCard - Pre-built skeleton for card layouts
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton width="40%" height="0.875rem" />
        </div>
      </div>
      <Skeleton variant="card" height="150px" />
      <Skeleton variant="text" lines={3} />
    </div>
  );
};

/**
 * SkeletonTable - Skeleton for table rows
 */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height="2rem"
              width={colIndex === 0 ? '30%' : '20%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonList - Skeleton for list items
 */
export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" rounded="md" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
