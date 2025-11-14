/**
 * LoadingSpinner.tsx
 * Beautiful, theme-aware loading spinner component
 * Replaces the basic animate-spin Tailwind spinners throughout the app
 */
import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'current';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color variant */
  variant?: SpinnerVariant;
  /** Optional text to display next to spinner */
  text?: string;
  /** Center the spinner in its container */
  center?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const borderSizes: Record<SpinnerSize, string> = {
  xs: 'border-2',
  sm: 'border-2',
  md: 'border-3',
  lg: 'border-3',
  xl: 'border-4'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  center = false,
  className = ''
}) => {
  // Get variant-specific colors
  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return ''; // Uses default CSS from .loading-spinner
      case 'secondary':
        return 'border-t-[var(--accent-secondary)] border-r-[var(--accent-secondary)]';
      case 'white':
        return 'border-t-white border-r-white border-l-white/10 border-b-white/10';
      case 'current':
        return 'border-t-current border-r-current border-l-current/10 border-b-current/10';
      default:
        return '';
    }
  };

  const spinnerElement = (
    <div
      className={`
        loading-spinner
        ${sizeClasses[size]}
        ${borderSizes[size]}
        ${getVariantColor()}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );

  if (text) {
    return (
      <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        {spinnerElement}
        <span className="text-sm text-[var(--text-secondary)]">{text}</span>
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex items-center justify-center w-full">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

/**
 * LoadingDots - Alternative loading indicator with bouncing dots
 */
export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`dots-loader ${className}`} role="status" aria-label="Loading">
      <span />
      <span />
      <span />
    </div>
  );
};

/**
 * LoadingProgress - Indeterminate progress bar
 */
export const LoadingProgress: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`progress-bar ${className}`} role="progressbar" aria-label="Loading">
      <div className="progress-bar-fill" />
    </div>
  );
};

export default LoadingSpinner;
