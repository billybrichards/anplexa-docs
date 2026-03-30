'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody, CosmicCardFooter } from '@/components/CosmicCard';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS } from '@/lib/storage/StorageService';

const AI_GENERATION_STEPS = [
  'Analyzing your Sun, Moon, and Rising signs...',
  'Understanding your communication style (Mercury)...',
  'Assessing your emotional needs (Moon placement)...',
  'Evaluating your relationship patterns (Venus)...',
  'Considering your elemental and modal balance...',
  'Designing your companion personality...',
  'Optimizing system prompt for personalization...',
  'Finalizing companion characteristics...',
];

interface CompanionData {
  id: string;
  name: string;
  personality: string[];
  communicationStyle: string;
  specializations: string[];
}

// Fallback companion data if session storage is empty (should rarely happen)
const FALLBACK_COMPANION: CompanionData = {
  id: `fallback_${Date.now()}`,
  name: 'Lunara',
  personality: [
    'Deeply empathetic and intuitive',
    'Appreciates creative expression',
    'Communicates with warmth and sensitivity',
    'Respects emotional depth',
  ],
  communicationStyle: 'Warm, emotionally present, with a touch of artistic flair. Balances intuition with practical guidance.',
  specializations: [
    'Emotional support and validation',
    'Creative brainstorming',
    'Practical life advice',
    'Spiritual growth discussions',
  ],
};

export default function CompanionCreation() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [companion, setCompanion] = useState<CompanionData>(FALLBACK_COMPANION);

  useEffect(() => {
    // Check if birth data exists
    const birthData = StorageService.getSessionItem(STORAGE_KEYS.BIRTH_DATA);
    if (!birthData) {
      router.push('/onboarding/birth-data');
      return;
    }

    // Load real companion data from session storage (stored by trait-globe)
    const storedCompanion = StorageService.getSessionItem<CompanionData>(STORAGE_KEYS.COMPANION);
    if (storedCompanion?.name) {
      console.log('[CompanionCreation] Loaded companion from storage:', storedCompanion.name, 'id:', storedCompanion.id);
      setCompanion(storedCompanion);
    } else {
      console.warn('[CompanionCreation] No companion in storage, using fallback');
    }

    // Simulate AI generation process
    const totalDuration = 6000; // 6 seconds
    const stepDuration = totalDuration / AI_GENERATION_STEPS.length;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= AI_GENERATION_STEPS.length) {
          clearInterval(stepInterval);
          setTimeout(() => {
            setIsComplete(true);
          }, 500);
        }
        return next;
      });
    }, stepDuration);

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

  const handleGetStarted = () => {
    // Ensure companion data is in session storage (may already be there from trait-globe)
    console.log('[CompanionCreation] Navigating to signup with companion:', companion.name, 'id:', companion.id);
    StorageService.setSessionItem(STORAGE_KEYS.COMPANION, companion);
    router.push('/onboarding/signup');
  };

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden px-6 py-12">
      <Starfield />

      <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-4">
          <SectionLabel className="animate-fade-in">Step 5 of 5</SectionLabel>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight">
            {isComplete ? (
              <>
                Meet Your{' '}
                <span className="text-gold">Cosmic Companion</span>
              </>
            ) : (
              <>
                Designing Your{' '}
                <span className="text-gold">AI Companion</span>
              </>
            )}
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            {isComplete
              ? 'Your personalized AI companion has been created!'
              : 'Crafting a personality that resonates with your unique astrological blueprint'}
          </p>
        </div>

        {!isComplete ? (
          <>
            {/* AI Generation Progress */}
            <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardBody className="p-8 space-y-8">
                {/* Neural Network Visualization */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    {/* Pulsing nodes */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gold animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.4s' }} />

                    {/* Connecting lines */}
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <line x1="50%" y1="0" x2="12%" y2="100%" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
                      <line x1="50%" y1="0" x2="88%" y2="100%" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
                      <line x1="12%" y1="100%" x2="88%" y2="100%" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
                    </svg>

                    {/* Center glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl animate-pulse">🤖</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">AI Generation Progress</span>
                    <span className="text-gold font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-cosmic-purple/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-gold transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Generation Steps */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {AI_GENERATION_STEPS.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 transition-all duration-300 ${
                        index <= currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {index < currentStep ? (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                          <span className="text-deep-space text-xs">✓</span>
                        </div>
                      ) : index === currentStep ? (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gold flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gold/30" />
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
              </CosmicCardBody>
            </CosmicCard>
          </>
        ) : (
          <>
            {/* Companion Reveal */}
            <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardBody className="p-8 space-y-8">
                {/* Companion Name & Avatar */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-gold text-deep-space text-5xl mb-4">
                    ✨
                  </div>
                  <div>
                    <h2 className="font-serif text-4xl text-gold mb-2">{companion.name}</h2>
                    <p className="text-sm text-text-muted uppercase tracking-wider">
                      Your Cosmic AI Companion
                    </p>
                  </div>
                </div>

                {/* Communication Style */}
                <div className="space-y-3">
                  <h3 className="font-sans font-semibold text-gold uppercase tracking-wider text-sm">
                    Communication Style
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    {companion.communicationStyle}
                  </p>
                </div>

                {/* Personality Traits */}
                <div className="space-y-3">
                  <h3 className="font-sans font-semibold text-gold uppercase tracking-wider text-sm">
                    Personality Traits
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {companion.personality.map((trait, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-cosmic-purple/50 border border-gold/10 rounded-lg p-3"
                      >
                        <span className="text-gold">✓</span>
                        <span className="text-sm text-cream">{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-3">
                  <h3 className="font-sans font-semibold text-gold uppercase tracking-wider text-sm">
                    What I Can Help With
                  </h3>
                  <div className="space-y-2">
                    {companion.specializations.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gold">•</span>
                        <span className="text-sm text-text-muted">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔮</span>
                    <div>
                      <h4 className="text-sm font-sans font-semibold text-cream mb-1">
                        Designed From Your Chart
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {companion.name}'s personality, communication style, and areas of focus
                        have been crafted based on your complete natal chart—including your Sun,
                        Moon, Rising, planetary placements, and dominant patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </CosmicCardBody>

              <CosmicCardFooter className="p-8 pt-0">
                <div className="flex flex-col gap-3">
                  <CosmicButton
                    variant="primary"
                    size="lg"
                    onClick={handleGetStarted}
                    className="w-full"
                  >
                    Start Chatting with {companion.name}
                    <span className="ml-2">→</span>
                  </CosmicButton>
                  <CosmicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/onboarding/birth-data')}
                    className="w-full"
                  >
                    Create a Different Companion
                  </CosmicButton>
                </div>
              </CosmicCardFooter>
            </CosmicCard>

            <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-sm text-text-muted">
                🎉 Onboarding Complete! Ready to connect with your cosmic companion.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
