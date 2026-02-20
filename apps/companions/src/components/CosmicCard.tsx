'use client';

import { type HTMLAttributes, type ReactNode } from 'react';

export interface CosmicCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
  children: ReactNode;
}

/**
 * CosmicCard Component
 *
 * Reusable card component with cosmic styling.
 *
 * Variants:
 * - default: Standard cosmic purple background
 * - elevated: Slightly lighter with stronger shadow
 * - glass: Glassmorphism effect with backdrop blur
 *
 * @param hover - Enable hover animation (lift effect)
 */
export function CosmicCard({
  variant = 'default',
  hover = false,
  children,
  className = '',
  ...props
}: CosmicCardProps) {
  const baseStyles = 'rounded-lg transition-all duration-300';

  const variantStyles = {
    default: 'bg-cosmic-purple border border-gold/15',
    elevated: 'bg-nebula border border-gold/30 shadow-lg',
    glass: 'glass border',
  };

  const hoverStyles = hover
    ? 'hover:border-gold/40 hover:-translate-y-2 hover:shadow-xl cursor-pointer'
    : '';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`;

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
}

/**
 * CosmicCardHeader Component
 *
 * Header section for CosmicCard with title and optional description.
 */
export function CosmicCardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-b border-gold/10 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CosmicCardBody Component
 *
 * Main content area for CosmicCard.
 */
export function CosmicCardBody({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CosmicCardFooter Component
 *
 * Footer section for CosmicCard, typically for actions.
 */
export function CosmicCardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-t border-gold/10 ${className}`} {...props}>
      {children}
    </div>
  );
}
