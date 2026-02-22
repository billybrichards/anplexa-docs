'use client';

import Link from 'next/link';
import { CosmicButton } from './CosmicButton';

export interface CosmicNavProps {
  ctaText?: string;
  ctaHref?: string;
  transparent?: boolean;
}

/**
 * CosmicNav Component
 *
 * Global navigation bar with ANPLEXA logo and CTA button.
 * Features:
 * - Fixed position with gradient fade background
 * - Responsive layout
 * - Gold accent branding
 *
 * @param ctaText - Text for CTA button (default: "Begin Free")
 * @param ctaHref - Link for CTA button (default: "#start")
 * @param transparent - Use transparent background (default: false)
 */
export function CosmicNav({
  ctaText = 'Begin Free',
  ctaHref = '#start',
  transparent = false,
}: CosmicNavProps) {
  const backgroundClass = transparent
    ? 'bg-gradient-to-b from-deep-space/80 to-transparent backdrop-blur-sm'
    : 'bg-deep-space/95 backdrop-blur-md border-b border-gold/10';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${backgroundClass} transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 md:px-8 md:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl md:text-3xl font-medium tracking-widest text-gold hover:text-gold-light transition-colors duration-300"
          >
            ANPLEXA
          </Link>

          {/* CTA Button */}
          <CosmicButton
            variant="secondary"
            size="sm"
            asLink
            href={ctaHref}
            className="hover:scale-105"
          >
            {ctaText}
          </CosmicButton>
        </div>
      </div>
    </nav>
  );
}
