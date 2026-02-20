'use client';

import { type HTMLAttributes } from 'react';

export interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/**
 * SectionHeader Component
 *
 * Standardized section header with optional label, title, and subtitle.
 *
 * Layout:
 * - Label: Small uppercase text with gold color
 * - Title: Large serif headline
 * - Subtitle: Body text with muted color
 *
 * @param label - Optional eyebrow label (e.g., "How It Works")
 * @param title - Main heading text
 * @param subtitle - Optional descriptive text below title
 * @param align - Text alignment (default: center)
 */
export function SectionHeader({
  label,
  title,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`${alignmentClasses[align]} ${className}`}>
      {label && (
        <p className="text-xs md:text-sm font-sans font-medium tracking-[0.3em] uppercase text-gold mb-4 animate-fade-in">
          {label}
        </p>
      )}

      <h2
        className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-cream mb-4 animate-fade-up"
        style={{ animationDelay: '0.1s' }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="text-base md:text-lg lg:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * SectionLabel Component
 *
 * Standalone eyebrow label for sections.
 */
export function SectionLabel({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs md:text-sm font-sans font-medium tracking-[0.3em] uppercase text-gold ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * SectionTitle Component
 *
 * Standalone section title with serif font.
 */
export function SectionTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-cream ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * SectionSubtitle Component
 *
 * Standalone section subtitle with muted text.
 */
export function SectionSubtitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-base md:text-lg lg:text-xl text-text-muted leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}
