/**
 * TraitDetailPanel component - shows detailed information about a selected trait
 */
import React from 'react';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

export interface TraitDetailPanelProps {
  trait: TraitVisualization | null;
  onClose: () => void;
}

export function TraitDetailPanel({ trait, onClose }: TraitDetailPanelProps) {
  if (!trait) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full mx-6 bg-cosmic-purple/95 border border-gold/30 rounded-lg shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gold/20">
          <div className="flex-1">
            <h3 className="font-serif text-2xl text-cream mb-1">{trait.name}</h3>
            <p className="text-sm text-text-muted capitalize">{trait.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gold/10 transition-colors text-gold"
            aria-label="Close detail panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Strength */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gold uppercase tracking-wide">
                Strength
              </span>
              <span className="text-lg font-semibold text-cream">
                {Math.round(trait.strength)}%
              </span>
            </div>
            <div className="w-full h-2 bg-cosmic-purple/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${trait.strength}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-gold mb-2 uppercase tracking-wide">
              Description
            </h4>
            <p className="text-sm text-cream/90 leading-relaxed">{trait.description}</p>
          </div>

          {/* Source */}
          <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gold mb-2 uppercase tracking-wide">
              Astrological Source
            </h4>
            <p className="text-sm text-cream/90">{trait.getSourceDescription()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
