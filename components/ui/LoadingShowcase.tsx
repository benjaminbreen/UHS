/**
 * LoadingShowcase.tsx
 * Visual showcase of all loading components
 * Import this in your dev environment to see all variations
 */
import React from 'react';
import { LoadingSpinner, LoadingDots, LoadingProgress } from './LoadingSpinner';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from './Skeleton';

export const LoadingShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-12 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-[var(--text-primary)]">Loading Components Showcase</h1>
        <p className="text-[var(--text-secondary)] mb-8">All loading states in one place</p>

        {/* LoadingSpinner - Sizes */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">LoadingSpinner - Sizes</h2>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <LoadingSpinner size="xs" />
              <p className="text-xs text-[var(--text-muted)] mt-2">xs</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="text-xs text-[var(--text-muted)] mt-2">sm</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-xs text-[var(--text-muted)] mt-2">md</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-[var(--text-muted)] mt-2">lg</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-xs text-[var(--text-muted)] mt-2">xl</p>
            </div>
          </div>
        </section>

        {/* LoadingSpinner - With Text */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">LoadingSpinner - With Text</h2>
          <div className="space-y-4">
            <LoadingSpinner text="Loading historical context..." />
            <LoadingSpinner size="sm" text="Processing..." />
            <LoadingSpinner size="lg" text="Generating narrative..." center />
          </div>
        </section>

        {/* LoadingSpinner - Variants */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">LoadingSpinner - Variants</h2>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <LoadingSpinner variant="primary" />
              <p className="text-xs text-[var(--text-muted)] mt-2">primary</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="secondary" />
              <p className="text-xs text-[var(--text-muted)] mt-2">secondary</p>
            </div>
            <div className="text-center bg-gray-800 p-4 rounded">
              <LoadingSpinner variant="white" />
              <p className="text-xs text-gray-400 mt-2">white</p>
            </div>
          </div>
        </section>

        {/* Alternative Loaders */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Alternative Loaders</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">Loading Dots</p>
              <LoadingDots />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">Loading Progress Bar</p>
              <LoadingProgress />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">Progress Bar (Custom Width)</p>
              <LoadingProgress className="w-64" />
            </div>
          </div>
        </section>

        {/* Skeleton Loaders */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Skeleton Loaders</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Text Lines</p>
              <Skeleton variant="text" lines={3} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Title</p>
              <Skeleton variant="title" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Avatar</p>
              <Skeleton variant="avatar" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Card</p>
              <Skeleton variant="card" height="150px" />
            </div>
          </div>
        </section>

        {/* Pre-built Skeleton Layouts */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Pre-built Skeleton Layouts</h2>
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Skeleton Card</p>
              <SkeletonCard />
            </div>
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Skeleton List</p>
              <SkeletonList items={3} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Skeleton Table</p>
              <SkeletonTable rows={3} cols={3} />
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="surface-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Real-World Usage Examples</h2>

          <div className="space-y-6">
            {/* Modal Loading */}
            <div className="border border-[var(--border-normal)] rounded-lg p-4">
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Modal Loading State</p>
              <div className="flex items-center justify-center py-8 bg-[var(--surface-muted-bg)] rounded">
                <LoadingSpinner text="Loading historical context..." />
              </div>
            </div>

            {/* Inline Button */}
            <div className="border border-[var(--border-normal)] rounded-lg p-4">
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Button Loading State</p>
              <button className="px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg flex items-center gap-2">
                <LoadingSpinner size="sm" variant="white" />
                <span>Processing...</span>
              </button>
            </div>

            {/* Content Loading */}
            <div className="border border-[var(--border-normal)] rounded-lg p-4">
              <p className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Content Loading</p>
              <SkeletonCard />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-[var(--text-muted)] text-sm pt-8 border-t border-[var(--border-normal)]">
          <p>All components are theme-aware and work in both light and dark modes</p>
          <p className="mt-2">See <code className="bg-[var(--surface-muted-bg)] px-2 py-1 rounded">components/ui/LOADING_USAGE_GUIDE.md</code> for documentation</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingShowcase;
