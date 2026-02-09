/**
 * TraitSidebar component - displays list of traits and personality summary
 */
import React from 'react';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

export interface TraitSidebarProps {
  traits: TraitVisualization[];
  personalitySummary: string;
  selectedTrait: TraitVisualization | null;
  onTraitClick: (trait: TraitVisualization) => void;
}

export function TraitSidebar({
  traits,
  personalitySummary,
  selectedTrait,
  onTraitClick,
}: TraitSidebarProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl text-cream">Your Trait Profile</h2>
        <p className="text-xs text-text-muted">{traits.length} traits identified</p>
      </div>

      {/* Personality Summary */}
      <div className="bg-cosmic-purple/30 border border-gold/20 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gold mb-2 uppercase tracking-wide">
          Personality Summary
        </h3>
        <p className="text-sm text-cream/90 leading-relaxed">{personalitySummary}</p>
      </div>

      {/* Trait List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gold mb-3 uppercase tracking-wide">
          All Traits
        </h3>
        {traits.map((trait) => (
          <button
            key={trait.id}
            onClick={() => onTraitClick(trait)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedTrait?.id === trait.id
                ? 'bg-gold/20 border-gold'
                : 'bg-cosmic-purple/20 border-gold/10 hover:border-gold/30 hover:bg-cosmic-purple/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-cream">{trait.name}</h4>
                <p className="text-xs text-text-muted capitalize">{trait.category}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs font-semibold text-gold">{Math.round(trait.strength)}</div>
                <div className="w-16 h-1.5 bg-cosmic-purple/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${trait.strength}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
