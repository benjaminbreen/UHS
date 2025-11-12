/**
 * useModalKeyboard - Hook for standardized modal keyboard navigation
 *
 * Provides:
 * - Escape key to close modal
 * - Enter key to confirm/submit (optional)
 * - Tab key focus trapping (handled by focus-trap-react)
 *
 * Usage:
 * ```tsx
 * const MyModal = ({ onClose, onSubmit }) => {
 *   useModalKeyboard({ onClose, onConfirm: onSubmit });
 *
 *   return <div>Modal content</div>;
 * };
 * ```
 */

import { useEffect, useCallback } from 'react';

interface UseModalKeyboardOptions {
  /**
   * Called when Escape key is pressed
   */
  onClose: () => void;

  /**
   * Optional: Called when Enter key is pressed
   * If not provided, Enter key does nothing
   */
  onConfirm?: () => void;

  /**
   * If true, disables keyboard shortcuts (e.g., when typing in input fields)
   * Default: false
   */
  disabled?: boolean;

  /**
   * If true, prevents Enter key from triggering confirm when focus is on an input/textarea
   * Default: true
   */
  preventEnterOnInput?: boolean;
}

export const useModalKeyboard = ({
  onClose,
  onConfirm,
  disabled = false,
  preventEnterOnInput = true
}: UseModalKeyboardOptions) => {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle if disabled
    if (disabled) return;

    // Handle Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    // Handle Enter key (if onConfirm provided)
    if (event.key === 'Enter' && onConfirm) {
      // Check if we should prevent Enter on inputs
      if (preventEnterOnInput) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isButton = target.tagName === 'BUTTON';

        // Allow Enter on buttons (they handle their own click)
        // Prevent on inputs/textareas (let them handle their own Enter)
        if (isInput || isButton) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      onConfirm();
    }
  }, [onClose, onConfirm, disabled, preventEnterOnInput]);

  useEffect(() => {
    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * useKeyboardShortcut - Hook for custom keyboard shortcuts
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcut('i', () => toggleInventory());
 * useKeyboardShortcut('c', () => toggleCharacter());
 * ```
 */
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    disabled?: boolean;
  } = {}
) => {
  const { ctrl = false, shift = false, alt = false, meta = false, disabled = false } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Don't trigger shortcuts when typing
      if (isInput) return;

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const modifiersMatch =
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta;

      if (keyMatches && modifiersMatch) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, shift, alt, meta, disabled]);
};
