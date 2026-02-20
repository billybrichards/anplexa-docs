'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

/**
 * ConditionalNavbar - Renders navbar only when appropriate
 *
 * Hides navbar during:
 * - Onboarding flow (/onboarding/*)
 * - Chat interface (/chat)
 *
 * This creates an immersive, distraction-free experience for these
 * critical user journeys.
 */
export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar during onboarding and chat
  const shouldHideNavbar = pathname.startsWith('/onboarding') || pathname === '/chat';

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
