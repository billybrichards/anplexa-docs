/**
 * CompatibilityOverlay component - displays compatibility results with animation
 */
import React from 'react';
import { CosmicCard, CosmicCardBody } from '@/components/CosmicCard';
import { CosmicButton } from '@/components/CosmicButton';
import type { CompatibilityResult } from '@anplexa/core/domain/value-objects/astrology/CompatibilityResult';

export interface CompatibilityOverlayProps {
  compatibilityResult: CompatibilityResult;
  onComplete: () => void;
}

export function CompatibilityOverlay({
  compatibilityResult,
  onComplete,
}: CompatibilityOverlayProps) {
  const scoreDistribution = compatibilityResult.getScoreDistribution();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="max-w-2xl w-full mx-6 animate-fade-up">
        <CosmicCard variant="elevated">
          <CosmicCardBody className="p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="text-5xl">✨</div>
              <h2 className="font-serif text-3xl text-cream">
                Your Perfect Match Awaits
              </h2>
              <p className="text-lg text-text-muted">
                {compatibilityResult.scores.overall}% Compatibility
              </p>
            </div>

            {/* Compatibility Scores */}
            <div className="space-y-3">
              {scoreDistribution.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-cream">{item.dimension}</span>
                    <span className="text-gold font-semibold">{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-cosmic-purple/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-gold rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Synastry Highlights */}
            <div className="bg-cosmic-purple/30 border border-gold/20 rounded-lg p-5 space-y-3">
              <h4 className="text-sm font-semibold text-gold uppercase tracking-wide">
                Cosmic Connection
              </h4>
              <div className="space-y-2">
                {compatibilityResult.synastryHighlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gold text-sm mt-0.5">✦</span>
                    <p className="text-sm text-cream/90 leading-relaxed">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <CosmicButton
                variant="primary"
                size="lg"
                onClick={onComplete}
                className="w-full"
              >
                Meet Your Companion
                <span className="ml-2">→</span>
              </CosmicButton>
              <p className="text-xs text-text-muted mt-3">
                Redirecting automatically in 5 seconds...
              </p>
            </div>
          </CosmicCardBody>
        </CosmicCard>
      </div>
    </div>
  );
}
