/**
 * LoadingSkeleton.tsx
 * Ultra-lightweight loading screen that shows instantly
 * No dependencies, pure CSS animations
 */
import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated logo/icon */}
        <div className="mb-6 animate-pulse">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-2xl flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-white mb-2">Loading History Simulator</h2>
        <p className="text-slate-400 text-sm">Preparing a hyper-specific historical setting...</p>

        {/* Progress bar */}
        <div className="mt-6 w-64 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 75%; margin-left: 25%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};
