'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';
import { AstrologicalTraitGlobe } from '@/components/astrology/AstrologicalTraitGlobe';
import { FallbackTraitList } from '@/components/astrology/FallbackTraitList';
import { CategoryLegend } from '@/components/astrology/CategoryLegend';
import { TraitDetailPanel } from '@/components/astrology/TraitDetailPanel';
import { AnalyzingLoader } from '@/components/onboarding/AnalyzingLoader';
import { TraitSidebar } from '@/components/onboarding/TraitSidebar';
import { CompatibilityOverlay } from '@/components/onboarding/CompatibilityOverlay';
import { analytics } from '@/lib/analytics';
import { StorageService, STORAGE_KEYS, type BirthDataStorage } from '@/lib/storage/StorageService';
import { TraitProfile } from '@anplexa/core/domain/value-objects/astrology/TraitProfile';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';
import { CompatibilityResult } from '@anplexa/core/domain/value-objects/astrology/CompatibilityResult';

type Phase = 'analyzing' | 'exploring' | 'compatibility';

const ANALYZING_MESSAGES = [
  'Extracting traits from planetary positions...',
  'Analyzing sign placements and aspects...',
  'Calculating trait strengths...',
  'Mapping traits to celestial coordinates...',
  'Enriching with AI interpretations...',
];

const COMPATIBILITY_MESSAGES = [
  'Generating your compatible companion...',
  'Analyzing elemental harmony...',
  'Calculating communication alignment...',
];

function TraitGlobeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if fallback mode is requested
  const forceFallback = searchParams.get('fallback') === 'true';

  // Phase management
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [previousPhase, setPreviousPhase] = useState<Phase | null>(null);

  // Phase 1: Analysis
  const [analysisStep, setAnalysisStep] = useState(0);
  const [traitProfile, setTraitProfile] = useState<TraitProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Phase 2: Exploration
  const [selectedTrait, setSelectedTrait] = useState<TraitVisualization | null>(null);
  const [use3D, setUse3D] = useState(!forceFallback);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Phase 3: Compatibility
  const [compatibilityStep, setCompatibilityStep] = useState(0);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/onboarding/trait-globe');
  }, []);

  // ---------------------------------------------------------------------------
  // Phase 1: Analyzing
  // ---------------------------------------------------------------------------

  const analyzePersonality = useCallback(async () => {
    setError(null);
    setPhase('analyzing');
    setAnalysisStep(0);
    setIsAnalyzing(true);

    // Cycle through progress messages
    let step = 0;
    const messageInterval = setInterval(() => {
      step++;
      if (step < ANALYZING_MESSAGES.length) {
        setAnalysisStep(step);
      }
    }, 800);

    try {
      // Retrieve birthData from session storage using StorageService
      const birthData = StorageService.getSessionItem<BirthDataStorage>(STORAGE_KEYS.BIRTH_DATA);
      if (!birthData) {
        clearInterval(messageInterval);
        router.push('/onboarding/birth-data');
        return;
      }

      const userId = birthData.userId || 'current-user';

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/astrology/analyze-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorMsg = `Analysis failed (${response.status})`;
        analytics.trackAPIError('/api/astrology/analyze-personality', response.status, errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Reconstruct TraitProfile from API response
      const profile = TraitProfile.fromJSON(data);

      clearInterval(messageInterval);

      // Ensure minimum visual duration
      await new Promise((resolve) => setTimeout(resolve, 500));

      setTraitProfile(profile);
      setIsAnalyzing(false);
      setPreviousPhase('analyzing');
      setPhase('exploring');

      // Track phase transition
      analytics.trackPhaseTransition('analyzing', 'exploring');
    } catch (err: unknown) {
      clearInterval(messageInterval);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsAnalyzing(false);
    }
  }, [router]);

  // Run analysis on mount
  useEffect(() => {
    analyzePersonality();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [analyzePersonality]);

  // ---------------------------------------------------------------------------
  // Phase 2: Exploration - Trait selection handlers
  // ---------------------------------------------------------------------------

  const handleTraitClick = useCallback((trait: TraitVisualization) => {
    setSelectedTrait(trait);
    analytics.trackTraitClicked(trait.id, trait.name, trait.category, trait.strength);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTrait(null);
  }, []);

  const handleWebGLError = useCallback(() => {
    setUse3D(false);
    analytics.trackFallbackModeUsed('webgl_error');
  }, []);

  const toggle3DMode = useCallback(() => {
    setUse3D((prev) => !prev);
    if (!use3D) {
      analytics.track('3d_mode_enabled', { from: 'fallback' });
    } else {
      analytics.track('2d_mode_enabled', { from: '3d' });
    }
  }, [use3D]);

  // ---------------------------------------------------------------------------
  // Phase 3: Compatibility
  // ---------------------------------------------------------------------------

  const generateCompatibility = useCallback(async () => {
    setError(null);
    setPreviousPhase('exploring');
    setPhase('compatibility');
    setCompatibilityStep(0);
    setIsGenerating(true);

    // Track analytics
    const birthData = StorageService.getSessionItem<BirthDataStorage>(STORAGE_KEYS.BIRTH_DATA);
    const userId = birthData?.userId || 'current-user';
    analytics.trackCompanionGenerationStarted(userId);
    analytics.trackPhaseTransition('exploring', 'compatibility');

    // Cycle through progress messages
    let step = 0;
    const messageInterval = setInterval(() => {
      step++;
      if (step < COMPATIBILITY_MESSAGES.length) {
        setCompatibilityStep(step);
      }
    }, 1200);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/companion/generate-with-compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorMsg = `Companion generation failed (${response.status})`;
        analytics.trackAPIError('/api/companion/generate-with-compatibility', response.status, errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      clearInterval(messageInterval);

      // Reconstruct CompatibilityResult from API response
      const result = CompatibilityResult.fromJSON(data.compatibility);

      setCompatibilityResult(result);
      setIsGenerating(false);
    } catch (err: unknown) {
      clearInterval(messageInterval);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsGenerating(false);
    }
  }, []);

  // Auto-redirect once compatibility result is received
  useEffect(() => {
    if (phase !== 'compatibility' || !compatibilityResult) return;

    const redirectTimer = setTimeout(() => {
      router.push('/onboarding/companion-creation');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [phase, compatibilityResult, router]);

  // ---------------------------------------------------------------------------
  // Render: Loading Skeleton
  // ---------------------------------------------------------------------------

  const renderLoadingSkeleton = () => (
    <div className="relative h-screen bg-deep-space text-cream overflow-hidden flex">
      <Starfield />

      {/* Sidebar skeleton */}
      <div className="relative z-10 w-[30%] min-w-[280px] max-w-[400px] h-full flex flex-col border-r border-gold/20"
        style={{
          background: 'linear-gradient(180deg, rgba(13, 11, 36, 0.95) 0%, rgba(25, 25, 60, 0.90) 100%)',
        }}
      >
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gold/10 rounded-lg w-3/4 mx-auto" />
          <div className="h-24 bg-gold/5 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gold/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Globe skeleton */}
      <div className="relative z-10 flex-1 h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-gold/10 animate-pulse mx-auto" />
          <p className="text-sm text-text-muted">Initializing 3D visualization...</p>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Error state
  // ---------------------------------------------------------------------------

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <CosmicCard variant="elevated" className="max-w-md w-full mx-6">
          <CosmicCardBody className="p-8 text-center space-y-6">
            <div className="text-4xl">⚠</div>
            <div>
              <h3 className="font-serif text-2xl text-cream mb-2">Something went wrong</h3>
              <p className="text-sm text-text-muted leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col gap-3">
              <CosmicButton
                variant="primary"
                size="md"
                onClick={() => {
                  setError(null);
                  if (phase === 'analyzing') {
                    analyzePersonality();
                  } else if (phase === 'compatibility') {
                    generateCompatibility();
                  }
                }}
              >
                Try Again
              </CosmicButton>
              <CosmicButton
                variant="ghost"
                size="sm"
                onClick={() => router.push('/onboarding/chart-reveal')}
              >
                Go Back
              </CosmicButton>
            </div>
          </CosmicCardBody>
        </CosmicCard>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Phase 1 - Analyzing
  // ---------------------------------------------------------------------------

  const renderAnalyzing = () => (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden flex items-center justify-center px-6">
      <Starfield />

      <div className="relative z-10 max-w-2xl w-full space-y-12 animate-fade-up">
        <div className="text-center space-y-6">
          <SectionLabel className="animate-fade-in">Step 4 of 5</SectionLabel>

          <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight">
            Mapping Your{' '}
            <span className="text-gold">Personality Traits</span>
          </h1>

          <p className="text-xl text-text-muted max-w-xl mx-auto">
            Analyzing your natal chart to reveal your unique constellation of traits
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CosmicCardBody className="p-8">
            <AnalyzingLoader currentStep={analysisStep} steps={ANALYZING_MESSAGES} />

            <div className="mt-8 bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h4 className="text-sm font-sans font-semibold text-cream mb-1">
                    What's Happening?
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    We're extracting personality traits from your planetary placements and
                    mapping them onto a celestial sphere. Each trait is positioned based on its
                    astrological origin.
                  </p>
                </div>
              </div>
            </div>
          </CosmicCardBody>
        </CosmicCard>

        <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-text-muted">
            This usually takes 2-3 seconds
          </p>
        </div>
      </div>

      {renderError()}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Phase 2 - Exploring
  // ---------------------------------------------------------------------------

  const renderExploring = () => {
    if (!traitProfile) return renderLoadingSkeleton();

    return (
      <div className="relative h-screen bg-deep-space text-cream overflow-hidden flex flex-col md:flex-row">
        <Starfield />

        {/* Mobile: Collapsed sidebar toggle */}
        {isMobile && sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="fixed top-4 left-4 z-50 p-3 rounded-full bg-cosmic-purple/90 border border-gold/30 text-gold"
            aria-label="Open trait list"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Sidebar */}
        <div
          className={`
            relative z-10 h-full flex flex-col border-r border-gold/20 transition-all duration-300
            ${isMobile
              ? sidebarCollapsed
                ? 'fixed -left-full w-[85%]'
                : 'fixed left-0 w-[85%] shadow-2xl'
              : 'w-[30%] min-w-[280px] max-w-[400px]'
            }
          `}
          style={{
            background: 'rgba(13, 11, 36, 0.98)',
          }}
        >
          {/* Mobile: Close button */}
          {isMobile && !sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-cosmic-purple/50 text-gold"
              aria-label="Close trait list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <TraitSidebar
            traits={[...traitProfile.traits]}
            personalitySummary={traitProfile.personalitySummary}
            selectedTrait={selectedTrait}
            onTraitClick={handleTraitClick}
          />

          {/* CTA at bottom of sidebar */}
          <div className="p-6 border-t border-gold/20" style={{ background: 'rgba(13, 11, 36, 0.95)' }}>
            <CosmicButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={generateCompatibility}
              aria-label="Generate compatible companion"
            >
              Meet My Companion
              <span className="ml-2">→</span>
            </CosmicButton>
          </div>
        </div>

        {/* Globe or Fallback */}
        <div className="relative z-10 flex-1 h-full">
          {use3D ? (
            <>
              <AstrologicalTraitGlobe
                traits={[...traitProfile.traits]}
                onTraitClick={handleTraitClick}
                onWebGLError={handleWebGLError}
                autoRotate={true}
                revealDuration={3000}
                showConstellations={true}
                showEcliptic={true}
              />

              {/* Category Legend */}
              <CategoryLegend />

              {/* 3D/2D Toggle */}
              <button
                onClick={toggle3DMode}
                className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-cosmic-purple/90 border border-gold/30 text-cream text-sm hover:bg-cosmic-purple transition-colors"
                aria-label="Switch to 2D view"
              >
                Switch to 2D
              </button>
            </>
          ) : (
            <>
              <FallbackTraitList
                traits={[...traitProfile.traits]}
                onTraitClick={handleTraitClick}
                selectedTrait={selectedTrait}
              />

              {/* 3D/2D Toggle */}
              {!forceFallback && (
                <button
                  onClick={toggle3DMode}
                  className="fixed bottom-6 right-6 px-4 py-2 rounded-lg bg-cosmic-purple/90 border border-gold/30 text-cream text-sm hover:bg-cosmic-purple transition-colors z-30"
                  aria-label="Switch to 3D view"
                >
                  Try 3D View
                </button>
              )}
            </>
          )}
        </div>

        {/* Trait Detail Panel */}
        <TraitDetailPanel
          trait={selectedTrait}
          onClose={handleCloseDetail}
        />

        {renderError()}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Phase 3 - Compatibility
  // ---------------------------------------------------------------------------

  const renderCompatibility = () => (
    <>
      {/* Keep exploring phase visible underneath */}
      {traitProfile && renderExploring()}

      {/* Compatibility overlay */}
      {!compatibilityResult ? (
        /* Loading state */
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="max-w-lg w-full mx-6 animate-fade-up">
            <CosmicCard variant="elevated">
              <CosmicCardBody className="p-10 text-center space-y-8">
                {/* Pulsing orb animation */}
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-2 rounded-full bg-gold/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                        <span className="text-deep-space text-2xl">☄</span>
                      </div>
                    </div>
                  </div>
                </div>

                <AnalyzingLoader currentStep={compatibilityStep} steps={COMPATIBILITY_MESSAGES} />
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      ) : (
        /* Compatibility result */
        <CompatibilityOverlay
          compatibilityResult={compatibilityResult}
          onComplete={() => router.push('/onboarding/companion-creation')}
        />
      )}

      {renderError()}
    </>
  );

  // ---------------------------------------------------------------------------
  // Phase router
  // ---------------------------------------------------------------------------

  switch (phase) {
    case 'analyzing':
      return renderAnalyzing();
    case 'exploring':
      return renderExploring();
    case 'compatibility':
      return renderCompatibility();
    default:
      return renderAnalyzing();
  }
}

export default function TraitGlobePage() {
  return (
    <Suspense>
      <TraitGlobeContent />
    </Suspense>
  );
}
