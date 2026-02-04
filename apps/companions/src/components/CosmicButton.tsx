'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';

export interface CosmicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  href?: string;
  asLink?: boolean;
}

/**
 * CosmicButton Component
 *
 * Premium button with gold gradient (primary) or stardust purple accents (secondary).
 * Includes hover effects, loading states, and icon support.
 *
 * Variants:
 * - primary: Gold gradient background with dark text
 * - secondary: Transparent with gold border
 * - ghost: Minimal styling with hover effect
 *
 * Sizes:
 * - sm: Compact button for dense UIs
 * - md: Standard size (default)
 * - lg: Prominent CTAs
 */
export const CosmicButton = forwardRef<HTMLButtonElement, CosmicButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      icon,
      iconPosition = 'right',
      loading = false,
      className = '',
      disabled,
      href,
      asLink = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md';

    const variantStyles = {
      primary:
        'bg-gradient-gold text-deep-space hover:shadow-gold-lg hover:-translate-y-1 active:translate-y-0',
      secondary:
        'bg-transparent text-gold border-2 border-gold hover:bg-gold hover:text-deep-space',
      ghost:
        'bg-transparent text-cream hover:text-gold hover:bg-cosmic-purple/30',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    const iconStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    const content = loading ? (
      <>
        <svg
          className={`animate-spin ${iconStyles[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && (
          <span className={iconStyles[size]}>{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className={`transition-transform duration-300 group-hover:translate-x-1 ${iconStyles[size]}`}>
            {icon}
          </span>
        )}
      </>
    );

    if (href || asLink) {
      return (
        <Link href={href || '#'} className={combinedClassName}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

CosmicButton.displayName = 'CosmicButton';
