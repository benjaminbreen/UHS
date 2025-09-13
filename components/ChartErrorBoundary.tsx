/**
 * ChartErrorBoundary.tsx
 * Specialized error boundary for chart components that handles SVG rendering errors gracefully
 */
import React, { Component, ReactNode } from 'react';
import { BarChart3, AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log chart-specific errors
    console.error('Chart Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Check for SVG-specific errors
    const isSvgError = error.message.includes('rect') || 
                      error.message.includes('width') || 
                      error.message.includes('height') ||
                      error.message.includes('SVG');

    if (isSvgError) {
      console.warn('SVG dimension error detected - likely negative width/height calculation');
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = "Chart Error", fallbackMessage = "Unable to render chart" } = this.props;
      
      return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 min-h-[150px] flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold text-sm">{fallbackTitle}</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 text-center mb-4 max-w-xs">
            {fallbackMessage}. The chart failed to render due to a display issue.
          </p>

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/60 text-slate-300 text-xs font-medium rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Try Again
          </button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                Error Details (Dev Only)
              </summary>
              <div className="mt-2 p-2 bg-slate-900/60 rounded text-xs text-red-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                {this.state.error.message}
                {this.state.errorInfo && (
                  <div className="mt-2 text-slate-400">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;