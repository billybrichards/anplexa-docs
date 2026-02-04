'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface CosmicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * CosmicInput Component
 *
 * Form input with cosmic styling and gold focus states.
 *
 * Features:
 * - Dark background with subtle border
 * - Gold border on focus
 * - Label and error message support
 * - Helper text for additional context
 */
export const CosmicInput = forwardRef<HTMLInputElement, CosmicInputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-sans font-medium tracking-wide uppercase text-text-muted mb-2"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3
            bg-cosmic-purple/50
            border-2 ${error ? 'border-red-500' : 'border-gold/20'}
            text-cream placeholder-text-muted
            rounded-lg
            font-sans text-base
            transition-all duration-300
            focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-2 text-sm text-red-400 font-sans">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-text-muted font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CosmicInput.displayName = 'CosmicInput';

/**
 * CosmicTextarea Component
 *
 * Textarea variant with cosmic styling.
 */
export interface CosmicTextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const CosmicTextarea = forwardRef<HTMLTextAreaElement, CosmicTextareaProps>(
  ({ label, error, helperText, rows = 4, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-sans font-medium tracking-wide uppercase text-text-muted mb-2"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full px-4 py-3
            bg-cosmic-purple/50
            border-2 ${error ? 'border-red-500' : 'border-gold/20'}
            text-cream placeholder-text-muted
            rounded-lg
            font-sans text-base
            transition-all duration-300
            focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-vertical
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-2 text-sm text-red-400 font-sans">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-text-muted font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CosmicTextarea.displayName = 'CosmicTextarea';
