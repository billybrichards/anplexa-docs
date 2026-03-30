/**
 * AstrologicalTraitGlobe component — real 3D visualization of personality traits
 *
 * Renders traits on an interactive celestial sphere using Three.js via R3F.
 * Falls back gracefully if WebGL is not available.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { TraitVisualization } from '@anplexa/core/domain/value-objects/astrology/TraitVisualization';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export interface AstrologicalTraitGlobeProps {
  traits: TraitVisualization[];
  onTraitClick: (trait: TraitVisualization) => void;
  onWebGLError?: () => void;
  autoRotate?: boolean;
  revealDuration?: number;
  showConstellations?: boolean;
  showEcliptic?: boolean;
}

const SPHERE_RADIUS = 4;
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ---------------------------------------------------------------------------
// TraitNode — individual 3D trait marker
// ---------------------------------------------------------------------------

interface TraitNodeProps {
  trait: TraitVisualization;
  onClick: (trait: TraitVisualization) => void;
  revealDelay: number;
  revealDuration: number;
}

function TraitNode({ trait, onClick, revealDelay }: TraitNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scale, setScale] = useState(0);

  const position = useMemo(() => {
    const pos = trait.getPosition3D(SPHERE_RADIUS);
    return new THREE.Vector3(pos.x, pos.z, -pos.y); // Remap: Z-up → Y-up
  }, [trait]);

  const color = useMemo(() => new THREE.Color(trait.getColorByCategory()), [trait]);
  const baseSize = trait.getMarkerSize() * 0.12;

  // Staggered reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), revealDelay);
    return () => clearTimeout(timer);
  }, [revealDelay]);

  // Animate scale
  useFrame((_, delta) => {
    const targetScale = revealed ? (hovered ? 1.6 : 1) : 0;
    const speed = revealed ? 4 : 2;
    const newScale = THREE.MathUtils.lerp(scale, targetScale, Math.min(delta * speed, 1));
    setScale(newScale);

    if (meshRef.current) {
      meshRef.current.scale.setScalar(newScale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(newScale * 1.8);
    }
  });

  // Cursor style
  const { gl } = useThree();
  const handlePointerOver = useCallback(() => {
    setHovered(true);
    gl.domElement.style.cursor = 'pointer';
  }, [gl]);
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    gl.domElement.style.cursor = 'auto';
  }, [gl]);

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.25 : 0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Main trait sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(trait);
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Tooltip on hover */}
      {hovered && (
        <Html
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
          center
          position={[0, baseSize * 2.5, 0]}
        >
          <div className="px-3 py-2 rounded-lg bg-cosmic-purple/95 border border-gold/30 shadow-lg whitespace-nowrap backdrop-blur-sm">
            <p className="text-sm font-medium text-cream">{trait.name}</p>
            <p className="text-xs text-text-muted">
              {trait.getSourceDescription()} • {Math.round(trait.strength)}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CelestialSphere — wireframe grid + ecliptic + zodiac labels
// ---------------------------------------------------------------------------

interface CelestialSphereProps {
  showEcliptic: boolean;
  showConstellations: boolean;
}

function CelestialSphere({ showEcliptic, showConstellations }: CelestialSphereProps) {
  return (
    <group>
      {/* Main wireframe sphere */}
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 48, 24]} />
        <meshBasicMaterial
          color="#d4af37"
          wireframe
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Ecliptic plane ring */}
      {showEcliptic && (
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[SPHERE_RADIUS - 0.02, SPHERE_RADIUS + 0.02, 128]} />
          <meshBasicMaterial
            color="#d4af37"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Zodiac labels at 30° intervals around ecliptic */}
      {showConstellations &&
        ZODIAC_SIGNS.map((sign, i) => {
          const angle = ((i * 30 + 15) * Math.PI) / 180;
          const r = SPHERE_RADIUS + 0.4;
          const x = r * Math.cos(angle);
          const z = -r * Math.sin(angle);
          return (
            <Html
              key={sign}
              position={[x, 0, z]}
              center
              distanceFactor={12}
              style={{ pointerEvents: 'none' }}
            >
              <span className="text-[10px] text-gold/50 font-medium uppercase tracking-widest select-none">
                {sign}
              </span>
            </Html>
          );
        })}

      {/* Latitude guide rings at ±30° and ±60° */}
      {[30, 60, -30, -60].map((lat) => {
        const r = SPHERE_RADIUS * Math.cos((lat * Math.PI) / 180);
        const y = SPHERE_RADIUS * Math.sin((lat * Math.PI) / 180);
        return (
          <mesh key={lat} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r - 0.01, r + 0.01, 64]} />
            <meshBasicMaterial
              color="#d4af37"
              transparent
              opacity={0.04}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// ConstellationLines — connect traits from the same planet source
// ---------------------------------------------------------------------------

interface ConstellationLinesProps {
  traits: TraitVisualization[];
}

function ConstellationLines({ traits }: ConstellationLinesProps) {
  const connections = useMemo(() => {
    // Group traits by source planet
    const byPlanet: Record<string, THREE.Vector3[]> = {};
    for (const trait of traits) {
      const planet = trait.sourcePosition.planet;
      if (!byPlanet[planet]) byPlanet[planet] = [];
      const pos = trait.getPosition3D(SPHERE_RADIUS);
      byPlanet[planet].push(new THREE.Vector3(pos.x, pos.z, -pos.y));
    }

    // Only draw lines for planets with 2+ traits
    return Object.values(byPlanet).filter((pts) => pts.length >= 2);
  }, [traits]);

  return (
    <>
      {connections.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#d4af37"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// AutoRotate — gentle rotation of the whole scene group
// ---------------------------------------------------------------------------

interface SceneGroupProps {
  autoRotate: boolean;
  children: React.ReactNode;
}

function SceneGroup({ autoRotate, children }: SceneGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Main Globe Scene (rendered inside Canvas)
// ---------------------------------------------------------------------------

interface GlobeSceneProps {
  traits: TraitVisualization[];
  onTraitClick: (trait: TraitVisualization) => void;
  autoRotate: boolean;
  revealDuration: number;
  showConstellations: boolean;
  showEcliptic: boolean;
}

function GlobeScene({
  traits,
  onTraitClick,
  autoRotate,
  revealDuration,
  showConstellations,
  showEcliptic,
}: GlobeSceneProps) {
  const staggerDelay = traits.length > 0 ? revealDuration / traits.length : 100;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#fff5e0" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#87CEEB" />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={SPHERE_RADIUS * 1.2}
        maxDistance={SPHERE_RADIUS * 4}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />

      <SceneGroup autoRotate={autoRotate}>
        {/* Celestial sphere grid */}
        <CelestialSphere showEcliptic={showEcliptic} showConstellations={showConstellations} />

        {/* Constellation connection lines */}
        {showConstellations && <ConstellationLines traits={traits} />}

        {/* Trait nodes */}
        {traits.map((trait, index) => (
          <TraitNode
            key={trait.id}
            trait={trait}
            onClick={onTraitClick}
            revealDelay={index * staggerDelay}
            revealDuration={revealDuration}
          />
        ))}
      </SceneGroup>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

export function AstrologicalTraitGlobe({
  traits,
  onTraitClick,
  onWebGLError,
  autoRotate = true,
  revealDuration = 3000,
  showConstellations = true,
  showEcliptic = true,
}: AstrologicalTraitGlobeProps) {
  const [webGLFailed, setWebGLFailed] = useState(false);

  // Check WebGL support on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebGLFailed(true);
        onWebGLError?.();
      }
    } catch {
      setWebGLFailed(true);
      onWebGLError?.();
    }
  }, [onWebGLError]);

  if (webGLFailed) {
    return null; // Parent switches to FallbackTraitList
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 2, SPHERE_RADIUS * 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <GlobeScene
          traits={traits}
          onTraitClick={onTraitClick}
          autoRotate={autoRotate}
          revealDuration={revealDuration}
          showConstellations={showConstellations}
          showEcliptic={showEcliptic}
        />
      </Canvas>
    </div>
  );
}
