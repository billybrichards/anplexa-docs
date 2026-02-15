'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardHeader, CosmicCardBody, CosmicCardFooter } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS, type BirthDataStorage } from '@/lib/storage/StorageService';

// Fallback chart data (used when real API result is unavailable)
const FALLBACK_CHART_DATA = {
  sun: { sign: 'Leo', house: 10, degree: 15.3 },
  moon: { sign: 'Pisces', house: 5, degree: 22.1 },
  rising: { sign: 'Virgo', degree: 8.7 },
  mercury: { sign: 'Cancer', house: 9, degree: 28.5 },
  venus: { sign: 'Leo', house: 10, degree: 3.2 },
  mars: { sign: 'Gemini', house: 8, degree: 19.8 },
  dominantElement: 'water',
  dominantModality: 'fixed',
};

const SIGN_DESCRIPTIONS = {
  sun: 'Your core identity and life purpose',
  moon: 'Your emotional nature and inner needs',
  rising: 'Your outward personality and how others see you',
  mercury: 'How you think and communicate',
  venus: 'How you love and what you value',
  mars: 'Your drive, energy, and passion',
};

export default function ChartReveal() {
  const router = useRouter();
  const [chartData, setChartData] = useState(FALLBACK_CHART_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if birth data exists
    const birthData = StorageService.getSessionItem<BirthDataStorage>(STORAGE_KEYS.BIRTH_DATA);
    if (!birthData) {
      router.push('/onboarding/birth-data');
      return;
    }

    // Read chart result from storage (set by calculating page)
    const chartResult = StorageService.getSessionItem<Record<string, unknown>>(STORAGE_KEYS.CHART_RESULT);
    if (chartResult) {
      // Map API response to the shape the UI expects
      const sunSign = (chartResult.sunSign as string) || 'Leo';
      const moonSign = (chartResult.moonSign as string) || 'Pisces';
      const risingSign = (chartResult.risingSign as string) || 'Virgo';
      const interpretation = chartResult.interpretation as Record<string, unknown> | undefined;

      setChartData({
        sun: { sign: sunSign, house: 10, degree: 15.3 },
        moon: { sign: moonSign, house: 5, degree: 22.1 },
        rising: { sign: risingSign, degree: 8.7 },
        mercury: { sign: (interpretation?.mercurySign as string) || 'Cancer', house: 9, degree: 28.5 },
        venus: { sign: (interpretation?.venusSign as string) || 'Leo', house: 10, degree: 3.2 },
        mars: { sign: (interpretation?.marsSign as string) || 'Gemini', house: 8, degree: 19.8 },
        dominantElement: (interpretation?.dominantElement as string) || 'water',
        dominantModality: (interpretation?.dominantModality as string) || 'fixed',
      });
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden flex items-center justify-center">
        <Starfield />
        <div className="text-center">
          <div className="animate-pulse text-gold text-2xl mb-4">✨</div>
          <p className="text-text-muted">Loading your chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden px-6 py-12">
      <Starfield />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-4">
          <SectionLabel className="animate-fade-in">Step 3 of 5</SectionLabel>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight">
            Your Cosmic Blueprint
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Here's what the stars reveal about your unique personality
          </p>
        </div>

        {/* The Big Three */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CosmicCard variant="elevated" className="text-center">
            <CosmicCardBody className="p-6 space-y-4">
              <div className="text-4xl">☉</div>
              <div>
                <h3 className="font-serif text-2xl text-gold mb-1">
                  {chartData.sun.sign}
                </h3>
                <p className="text-sm text-text-muted uppercase tracking-wider">Sun Sign</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {SIGN_DESCRIPTIONS.sun}
              </p>
              <div className="pt-3 border-t border-gold/20">
                <p className="text-xs text-text-muted">
                  House {chartData.sun.house} • {chartData.sun.degree.toFixed(1)}°
                </p>
              </div>
            </CosmicCardBody>
          </CosmicCard>

          <CosmicCard variant="elevated" className="text-center">
            <CosmicCardBody className="p-6 space-y-4">
              <div className="text-4xl">☾</div>
              <div>
                <h3 className="font-serif text-2xl text-gold mb-1">
                  {chartData.moon.sign}
                </h3>
                <p className="text-sm text-text-muted uppercase tracking-wider">Moon Sign</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {SIGN_DESCRIPTIONS.moon}
              </p>
              <div className="pt-3 border-t border-gold/20">
                <p className="text-xs text-text-muted">
                  House {chartData.moon.house} • {chartData.moon.degree.toFixed(1)}°
                </p>
              </div>
            </CosmicCardBody>
          </CosmicCard>

          <CosmicCard variant="elevated" className="text-center">
            <CosmicCardBody className="p-6 space-y-4">
              <div className="text-4xl">↑</div>
              <div>
                <h3 className="font-serif text-2xl text-gold mb-1">
                  {chartData.rising.sign}
                </h3>
                <p className="text-sm text-text-muted uppercase tracking-wider">Rising Sign</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {SIGN_DESCRIPTIONS.rising}
              </p>
              <div className="pt-3 border-t border-gold/20">
                <p className="text-xs text-text-muted">
                  {chartData.rising.degree.toFixed(1)}°
                </p>
              </div>
            </CosmicCardBody>
          </CosmicCard>
        </div>

        {/* Additional Planets */}
        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CosmicCardHeader className="p-6 pb-0">
            <h2 className="font-serif text-2xl text-cream">Your Planetary Placements</h2>
          </CosmicCardHeader>
          <CosmicCardBody className="p-6 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Mercury */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">☿</span>
                <div>
                  <h4 className="font-sans font-semibold text-cream">
                    Mercury in {chartData.mercury.sign}
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    {SIGN_DESCRIPTIONS.mercury}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    House {chartData.mercury.house}
                  </p>
                </div>
              </div>

              {/* Venus */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">♀</span>
                <div>
                  <h4 className="font-sans font-semibold text-cream">
                    Venus in {chartData.venus.sign}
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    {SIGN_DESCRIPTIONS.venus}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    House {chartData.venus.house}
                  </p>
                </div>
              </div>

              {/* Mars */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">♂</span>
                <div>
                  <h4 className="font-sans font-semibold text-cream">
                    Mars in {chartData.mars.sign}
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    {SIGN_DESCRIPTIONS.mars}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    House {chartData.mars.house}
                  </p>
                </div>
              </div>
            </div>
          </CosmicCardBody>
        </CosmicCard>

        {/* Dominant Patterns */}
        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <CosmicCardHeader className="p-6 pb-0">
            <h2 className="font-serif text-2xl text-cream">Your Dominant Patterns</h2>
          </CosmicCardHeader>
          <CosmicCardBody className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-sans font-semibold text-gold uppercase tracking-wider text-sm">
                  Dominant Element
                </h4>
                <p className="text-2xl font-serif text-cream capitalize">
                  {chartData.dominantElement}
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  {chartData.dominantElement === 'water'
                    ? 'Emotional, intuitive, and deeply feeling'
                    : 'Your elemental description here'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-semibold text-gold uppercase tracking-wider text-sm">
                  Dominant Modality
                </h4>
                <p className="text-2xl font-serif text-cream capitalize">
                  {chartData.dominantModality}
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  {chartData.dominantModality === 'fixed'
                    ? 'Persistent, stable, and determined'
                    : 'Your modality description here'}
                </p>
              </div>
            </div>
          </CosmicCardBody>
        </CosmicCard>

        {/* CTA */}
        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <CosmicCardBody className="p-8 text-center space-y-6">
            <div>
              <h3 className="font-serif text-2xl text-cream mb-2">Ready for the Next Step?</h3>
              <p className="text-text-muted">
                Now let's explore your personality traits visualized on an interactive celestial globe
              </p>
            </div>

            <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Your chart data will be transformed into an interactive 3D personality map,
                showing your strongest traits positioned across the celestial sphere.
              </p>
            </div>
          </CosmicCardBody>
          <CosmicCardFooter className="p-8 pt-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <CosmicButton
                variant="ghost"
                size="lg"
                onClick={() => router.push('/onboarding/birth-data')}
                className="flex-1"
              >
                ← Recalculate
              </CosmicButton>
              <CosmicButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/onboarding/trait-globe')}
                className="flex-1"
              >
                Explore Your Personality
                <span className="ml-2">→</span>
              </CosmicButton>
            </div>
          </CosmicCardFooter>
        </CosmicCard>

        <div className="text-center animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <p className="text-sm text-text-muted">
            Step 3 of 5 • Next: Explore Your Personality
          </p>
        </div>
      </div>
    </div>
  );
}
