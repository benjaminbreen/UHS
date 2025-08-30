/**
 * utils/deviceUtils.ts
 * Device detection and responsive utilities
 */
import { useState, useEffect } from 'react';

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgentCheck = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(
    navigator.userAgent
  );
  
  // Check viewport width
  const viewportCheck = window.innerWidth < 768;
  
  // Check for touch support with safe fallback
  const touchCheck = 'ontouchstart' in window || 
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    false;
  
  return userAgentCheck || (viewportCheck && touchCheck);
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const hasNotch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for iPhone X and later models with notch
  const isIPhoneWithNotch = isIOS() && window.screen.height >= 812;
  
  // Check for CSS environment variables (more reliable) with safe fallback
  const hasEnvSupport = typeof CSS !== 'undefined' && 
    typeof CSS.supports === 'function' && 
    CSS.supports('padding-top', 'env(safe-area-inset-top)');
  
  return isIPhoneWithNotch || hasEnvSupport;
};

export const getViewportDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  // Use visualViewport API if available (better for mobile) with safe check
  if (typeof window !== 'undefined' && window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height
    };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

export const getOrientation = (): 'portrait' | 'landscape' => {
  const { width, height } = getViewportDimensions();
  return width > height ? 'landscape' : 'portrait';
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent;
  const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
  
  return isSafariBrowser;
};

export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if running as PWA
  return (window.navigator as any).standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
};

// Breakpoints
export const BREAKPOINTS = {
  mobileSmall: 320,   // iPhone SE
  mobile: 375,         // iPhone 12/13/14
  mobileLarge: 428,    // iPhone Pro Max  
  tablet: 768,         // iPad Mini
  desktop: 1024        // Desktop
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const { width } = getViewportDimensions();
  
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

// Safe area helpers
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
  };
};

// Haptic feedback (if supported)
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
};

// React hook for device detection
export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [deviceType, setDeviceType] = useState(getDeviceType());
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
      setDeviceType(getDeviceType());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    isMobile,
    deviceType,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isSafari: isSafari(),
    hasNotch: hasNotch(),
    isStandalone: isStandalone()
  };
};