/**
 * Safari-specific utilities for performance optimization
 */

// Detect Safari browser
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Get Safari-optimized class names (removes blur effects on Safari)
export const getSafariOptimizedClassName = (className: string): string => {
  if (!isSafari()) {
    return className;
  }
  
  // Remove blur-related classes on Safari for performance
  return className
    .replace(/backdrop-blur-[^\s]*/g, '') // Remove backdrop-blur-* classes
    .replace(/blur-[^\s]*/g, '')          // Remove blur-* classes  
    .replace(/\s+/g, ' ')                 // Clean up extra spaces
    .trim();
};

// Get Safari-optimized inline styles (removes blur effects on Safari)
export const getSafariOptimizedStyle = (style: React.CSSProperties): React.CSSProperties => {
  if (!isSafari()) {
    return style;
  }
  
  // Create a copy and remove blur-related properties on Safari
  const optimizedStyle = { ...style };
  
  if ('backdropFilter' in optimizedStyle) {
    delete optimizedStyle.backdropFilter;
  }
  
  if ('filter' in optimizedStyle && typeof optimizedStyle.filter === 'string') {
    // Remove blur and backdrop-blur from filter property
    optimizedStyle.filter = optimizedStyle.filter
      .replace(/blur\([^)]*\)/g, '')
      .replace(/backdrop-blur\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
      
    // If filter is empty after removing blur effects, delete it
    if (!optimizedStyle.filter) {
      delete optimizedStyle.filter;
    }
  }
  
  return optimizedStyle;
};