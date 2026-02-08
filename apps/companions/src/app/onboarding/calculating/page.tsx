'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicCard, CosmicCardBody } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';

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

  useEffect(() => {
    // Check if birth data exists
    const birthData = sessionStorage.getItem('birthData');
    if (!birthData) {
      router.push('/onboarding/birth-data');
      return;
    }

    // Simulate chart calculation with progress updates
    const totalDuration = 5000; // 5 seconds total
    const stepDuration = totalDuration / CALCULATION_STEPS.length;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= CALCULATION_STEPS.length) {
          clearInterval(stepInterval);
          // Navigate to chart reveal after completion
          setTimeout(() => {
            router.push('/onboarding/chart-reveal');
          }, 500);
        }
        return next;
      });
    }, stepDuration);

    // Smooth progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, totalDuration / 100);

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
          <SectionLabel className="animate-fade-in">Step 2 of 3</SectionLabel>

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
            This usually takes 10-15 seconds • Step 2 of 3
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
