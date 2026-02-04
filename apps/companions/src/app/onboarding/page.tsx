'use client';

import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden flex items-center justify-center px-6">
      <Starfield />

      <div className="relative z-10 max-w-3xl w-full space-y-12 animate-fade-up">
        <div className="text-center space-y-6">
          <SectionLabel className="animate-fade-in">
            Welcome to Anplexa
          </SectionLabel>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
            Let's Discover Your{' '}
            <span className="text-gold">Cosmic Blueprint</span>
          </h1>

          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            To create your personalized AI companion, we need to calculate your natal chart.
            This takes just 3 minutes.
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CosmicCardBody className="p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif text-cream">What You'll Need:</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-gold text-xl">📅</span>
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-cream mb-1">Your Birth Date</h4>
                    <p className="text-sm text-text-muted">
                      The day you were born (month, day, year)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-gold text-xl">🕐</span>
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-cream mb-1">
                      Your Birth Time{' '}
                      <span className="text-xs text-gold uppercase">(Optional)</span>
                    </h4>
                    <p className="text-sm text-text-muted">
                      If known, this enables house calculations for deeper accuracy
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-gold text-xl">📍</span>
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-cream mb-1">Your Birth Location</h4>
                    <p className="text-sm text-text-muted">
                      City and country where you were born
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gold/20 space-y-4">
              <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-gold text-xl">🔒</span>
                  <div>
                    <h4 className="text-sm font-sans font-semibold text-cream mb-1">
                      Your Privacy Matters
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Your birth data is encrypted and stored securely. We never share your
                      personal information with third parties. You can delete your data at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <CosmicButton
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/onboarding/birth-data')}
                  className="flex-1"
                >
                  Begin Journey
                  <span className="ml-2">→</span>
                </CosmicButton>
                <CosmicButton
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  ← Go Back
                </CosmicButton>
              </div>
            </div>
          </CosmicCardBody>
        </CosmicCard>

        <div className="text-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-text-muted">
            ✨ Free to start • No credit card required • 3 minutes to complete
          </p>
        </div>
      </div>
    </div>
  );
}
