/**
 * FallbackTraitList component - 2D list view of traits (fallback for 3D globe)
 */
import React from 'react';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

export interface FallbackTraitListProps {
  traits: TraitVisualization[];
  onTraitClick: (trait: TraitVisualization) => void;
  selectedTrait: TraitVisualization | null;
}

export function FallbackTraitList({
  traits,
  onTraitClick,
  selectedTrait,
}: FallbackTraitListProps) {
  // Group traits by category
  const traitsByCategory = traits.reduce((acc, trait) => {
    if (!acc[trait.category]) {
      acc[trait.category] = [];
    }
    acc[trait.category].push(trait);
    return acc;
  }, {} as Record<string, TraitVisualization[]>);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl text-cream">Your Trait Constellation</h2>
          <p className="text-text-muted">Click any trait to learn more</p>
        </div>

        {/* Traits by Category */}
        {Object.entries(traitsByCategory).map(([category, categoryTraits]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide capitalize">
              {category} Traits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryTraits
                .sort((a, b) => b.strength - a.strength)
                .map((trait) => (
                  <button
                    key={trait.id}
                    onClick={() => onTraitClick(trait)}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      selectedTrait?.id === trait.id
                        ? 'bg-gold/20 border-gold shadow-lg'
                        : 'bg-cosmic-purple/20 border-gold/10 hover:border-gold/30 hover:bg-cosmic-purple/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-cream mb-1">
                          {trait.name}
                        </h4>
                        <p className="text-xs text-text-muted">
                          {trait.getSourceDescription()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold text-gold">
                          {Math.round(trait.strength)}
                        </div>
                        <div className="w-20 h-2 bg-cosmic-purple/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${trait.strength}%`,
                              backgroundColor: trait.getColorHex(),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
