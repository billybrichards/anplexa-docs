/**
 * CategoryLegend component - shows color legend for trait categories
 */
import React from 'react';
import { TRAIT_COLORS } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity',
  emotional: 'Emotional',
  social: 'Social',
  mental: 'Mental',
  creative: 'Creative',
  spiritual: 'Spiritual',
};

export function CategoryLegend() {
  const categories = Object.entries(TRAIT_COLORS);

  return (
    <div className="absolute top-6 right-6 bg-cosmic-purple/90 border border-gold/20 rounded-lg p-4 shadow-lg">
      <h3 className="text-xs font-semibold text-gold mb-3 uppercase tracking-wide">
        Trait Categories
      </h3>
      <div className="space-y-2">
        {categories.map(([category, colorValue]) => {
          const hexColor = '#' + colorValue.toString(16).padStart(6, '0').toUpperCase();
          return (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-cream/30"
                style={{ backgroundColor: hexColor }}
              />
              <span className="text-xs text-cream capitalize">
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
