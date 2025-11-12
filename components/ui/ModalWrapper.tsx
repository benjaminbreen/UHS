/**
 * ModalWrapper - Accessible modal component with built-in features
 *
 * Features:
 * - Keyboard navigation (Escape to close, Enter to confirm)
 * - Focus trapping (Tab cycles within modal)
 * - ARIA labels and roles
 * - Backdrop click to close
 * - Responsive sizing
 * - Screen reader announcements
 *
 * Usage:
 * ```tsx
 * <ModalWrapper
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Character Profile"
 *   description="View and edit your character information"
 * >
 *   <div>Modal content here</div>
 * </ModalWrapper>
 * ```
 */

import React, { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

interface ModalWrapperProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean;

  /**
   * Called when modal should close
   */
  onClose: () => void;

  /**
   * Modal title (shown in header and used for ARIA label)
   */
  title: string;

  /**
   * Optional description for screen readers
   */
  description?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Optional confirm action (triggered by Enter key)
   */
  onConfirm?: () => void;

  /**
   * Size of the modal
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';

  /**
   * If true, clicking backdrop won't close modal
   * @default false
   */
  preventBackdropClose?: boolean;

  /**
   * If true, shows close button in header
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Custom footer content (buttons, actions, etc.)
   */
  footer?: React.ReactNode;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;

  /**
   * If true, disables focus trap (use sparingly)
   * @default false
   */
  disableFocusTrap?: boolean;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  size = 'medium',
  preventBackdropClose = false,
  showCloseButton = true,
  footer,
  className = '',
  disableFocusTrap = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  // Keyboard navigation
  useModalKeyboard({
    onClose,
    onConfirm,
    disabled: !isOpen
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `${title} dialog opened`;
      document.body.appendChild(announcement);

      return () => {
        document.body.style.overflow = '';
        document.body.removeChild(announcement);
      };
    }
  }, [isOpen, title]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={description ? descId.current : undefined}
      className={`
        relative w-full ${sizeClasses[size]} mx-auto
        bg-slate-800 rounded-lg shadow-2xl border border-slate-600
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2
          id={titleId.current}
          className="text-xl font-semibold text-gray-100"
        >
          {title}
        </h2>

        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label={`Close ${title} dialog`}
            title="Close (Esc)"
            className="
              p-2 rounded-lg
              text-gray-400 hover:text-gray-200
              hover:bg-slate-700
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Description for screen readers */}
      {description && (
        <p id={descId.current} className="sr-only">
          {description}
        </p>
      )}

      {/* Content */}
      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {disableFocusTrap ? (
        modalContent
      ) : (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            escapeDeactivates: false, // We handle Escape ourselves
            clickOutsideDeactivates: !preventBackdropClose
          }}
        >
          {modalContent}
        </FocusTrap>
      )}
    </div>
  );
};

/**
 * ConfirmButton - Pre-styled confirm button for modal footers
 */
export const ConfirmButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ onClick, children, disabled = false, variant = 'primary' }) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-medium
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${variant === 'primary' ? 'focus:ring-blue-500' : ''}
        ${variant === 'danger' ? 'focus:ring-red-500' : ''}
      `}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </button>
  );
};

/**
 * CancelButton - Pre-styled cancel button for modal footers
 */
export const CancelButton: React.FC<{
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ onClick, children = 'Cancel' }) => (
  <button
    onClick={onClick}
    className="
      px-4 py-2 rounded-lg font-medium
      text-gray-300 hover:text-white hover:bg-slate-700
      transition-colors
      focus:outline-none focus:ring-2 focus:ring-slate-500
    "
    aria-label={typeof children === 'string' ? children : 'Cancel'}
  >
    {children}
  </button>
);
