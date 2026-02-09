/**
 * AstrologicalTraitGlobe component - 3D visualization of personality traits
 * 
 * This component renders traits on a 3D celestial sphere using WebGL.
 * Falls back gracefully if WebGL is not available.
 */
'use client';

import React, { useEffect, useRef } from 'react';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

export interface AstrologicalTraitGlobeProps {
  traits: TraitVisualization[];
  onTraitClick: (trait: TraitVisualization) => void;
  onWebGLError?: () => void;
  autoRotate?: boolean;
  revealDuration?: number;
  showConstellations?: boolean;
  showEcliptic?: boolean;
}

export function AstrologicalTraitGlobe({
  traits,
  onTraitClick,
  onWebGLError,
  autoRotate = true,
  revealDuration = 3000,
  showConstellations = true,
  showEcliptic = true,
}: AstrologicalTraitGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasWebGLRef = useRef<boolean>(true);

  useEffect(() => {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      hasWebGLRef.current = false;
      if (onWebGLError) {
        onWebGLError();
      }
      return;
    }

    // TODO: Initialize Three.js scene here
    // For now, we'll show a placeholder that indicates the 3D globe would be here
    // In a real implementation, this would:
    // 1. Create a Three.js scene with a sphere geometry
    // 2. Plot traits as points on the sphere using their ecliptic coordinates
    // 3. Add orbital controls for rotation
    // 4. Add constellation lines and ecliptic plane if requested
    // 5. Handle trait click events via raycasting

    console.log('AstrologicalTraitGlobe initialized with:', {
      traitCount: traits.length,
      autoRotate,
      revealDuration,
      showConstellations,
      showEcliptic,
    });

    return () => {
      // Cleanup Three.js scene here
    };
  }, [traits, onWebGLError, autoRotate, revealDuration, showConstellations, showEcliptic]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Placeholder for 3D globe - in production, Three.js canvas would render here */}
      <div className="text-center space-y-4 p-8">
        <div className="relative w-64 h-64 mx-auto">
          {/* Animated rings to simulate a celestial sphere */}
          <div className="absolute inset-0 rounded-full border-2 border-gold/20 animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border border-gold/30 animate-spin-slow" />
          <div className="absolute inset-8 rounded-full border border-gold/40" />

          {/* Center orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-radial from-gold/20 to-transparent animate-pulse-slow" />
          </div>

          {/* Trait markers (simplified 2D representation) */}
          {traits.slice(0, 8).map((trait, index) => {
            const angle = (index / 8) * Math.PI * 2;
            const radius = 100;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <button
                key={trait.id}
                onClick={() => onTraitClick(trait)}
                className="absolute w-3 h-3 rounded-full transition-all hover:scale-150 cursor-pointer"
                style={{
                  backgroundColor: trait.getColorHex(),
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.8,
                }}
                aria-label={`View ${trait.name} trait`}
                title={trait.name}
              />
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gold font-medium">3D Globe Visualization</p>
          <p className="text-xs text-text-muted max-w-md">
            Interactive 3D trait globe will render here.
            <br />
            Click the points to explore your traits.
          </p>
        </div>
      </div>
    </div>
  );
}
