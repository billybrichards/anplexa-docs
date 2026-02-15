'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicCard, CosmicCardBody } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS, type BirthDataStorage } from '@/lib/storage/StorageService';

const CALCULATION_STEPS = [
  'Calculating planetary positions...',
  'Computing house cusps...',
  'Analyzing planetary aspects...',
  'Determining elemental balance...',
  'Finalizing your cosmic blueprint...',
];

export default function CalculatingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if birth data exists
    const birthData = StorageService.getSessionItem<BirthDataStorage>(STORAGE_KEYS.BIRTH_DATA);
    if (!birthData) {
      router.push('/onboarding/birth-data');
      return;
    }

    // Start animation + API call concurrently
    const minDuration = 3000; // Minimum animation time
    const startTime = Date.now();

    // Step animation
    const stepDuration = 5000 / CALCULATION_STEPS.length;
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= CALCULATION_STEPS.length) clearInterval(stepInterval);
        return Math.min(next, CALCULATION_STEPS.length - 1);
      });
    }, stepDuration);

    // Progress animation (goes to 80% while API runs, then jumps to 100%)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) { clearInterval(progressInterval); return 80; }
        return prev + 1;
      });
    }, minDuration / 80);

    // Call the real API
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    fetch(`${apiBase}/api/birth-chart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: birthData.userId || 'guest',
        birthDate: birthData.date,
        birthTime: birthData.time || null,
        timeZone: birthData.location.timezone,
        latitude: birthData.location.latitude,
        longitude: birthData.location.longitude,
        placeName: birthData.location.name.split(',')[0]?.trim() || '',
        country: birthData.location.name.split(',')[1]?.trim() || '',
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Calculation failed (${res.status})`);
        }
        return res.json();
      })
      .then((chartResult) => {
        // Store result for chart-reveal page
        StorageService.setSessionItem(STORAGE_KEYS.CHART_RESULT, chartResult);

        // Ensure minimum animation duration
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
          setProgress(100);
          setCurrentStep(CALCULATION_STEPS.length);
          setTimeout(() => router.push('/onboarding/chart-reveal'), 500);
        }, remaining);
      })
      .catch((err) => {
        console.error('Birth chart calculation failed:', err);
        setError(err.message || 'Chart calculation failed. Please try again.');
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      });

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden flex items-center justify-center px-6">
      <Starfield />

      <div className="relative z-10 max-w-2xl w-full space-y-12 animate-fade-up">
        <div className="text-center space-y-6">
          <SectionLabel className="animate-fade-in">Step 2 of 5</SectionLabel>

          <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight">
            Calculating Your{' '}
            <span className="text-gold">Natal Chart</span>
          </h1>

          <p className="text-xl text-text-muted max-w-xl mx-auto">
            Analyzing your cosmic blueprint across planets, houses, and aspects
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CosmicCardBody className="p-8 space-y-8">
            {/* Orbital Loader Animation */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                {/* Outer orbit */}
                <div className="absolute inset-0 rounded-full border-2 border-gold/20 animate-spin-slow" />

                {/* Middle orbit */}
                <div className="absolute inset-4 rounded-full border-2 border-gold/30 animate-spin-reverse" />

                {/* Inner orbit */}
                <div className="absolute inset-8 rounded-full border-2 border-gold/40 animate-spin-slow" />

                {/* Center glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gold/30 blur-md animate-pulse" />
                  <div className="absolute w-4 h-4 rounded-full bg-gold animate-pulse" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Progress</span>
                <span className="text-gold font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-cosmic-purple/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-gold transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Calculation Steps */}
            <div className="space-y-3">
              {CALCULATION_STEPS.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    index <= currentStep ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  {index < currentStep ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <span className="text-deep-space text-sm">✓</span>
                    </div>
                  ) : index === currentStep ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gold flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gold/30" />
                  )}
                  <span
                    className={`text-sm ${
                      index === currentStep ? 'text-cream font-medium' : 'text-text-muted'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 space-y-3">
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={() => router.push('/onboarding/birth-data')}
                  className="text-sm text-gold underline hover:text-gold/80"
                >
                  Go back and try again
                </button>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h4 className="text-sm font-sans font-semibold text-cream mb-1">
                    Did You Know?
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Your natal chart is a snapshot of the exact positions of the planets at the
                    moment of your birth. Each placement reveals different facets of your
                    personality, from how you communicate (Mercury) to how you love (Venus).
                  </p>
                </div>
              </div>
            </div>
          </CosmicCardBody>
        </CosmicCard>

        <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-text-muted">
            This usually takes 10-15 seconds • Step 2 of 5
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
