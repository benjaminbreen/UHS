/**
 * ErrorBoundary.tsx - Catches React errors and prevents app crashes
 * Provides fallback UI and error recovery options
 */
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // Reload the page as a last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border-2 border-red-500/50 p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <svg 
                  className="w-12 h-12 text-red-500 mr-4" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  The game encountered an unexpected error. Your progress has been saved, and you can try to continue or reload the page.
                </p>
                
                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-200 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-slate-900 rounded p-4 text-xs font-mono overflow-auto max-h-40">
                      <div className="text-red-400 mb-2">{this.state.error.toString()}</div>
                      {this.state.errorInfo && (
                        <div className="text-gray-500 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Try to Continue
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Reload Page
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-sm text-gray-400">
                  If this problem persists, please report it to the developers with the error details above.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;