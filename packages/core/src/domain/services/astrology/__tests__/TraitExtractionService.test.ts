/**
 * Tests for TraitExtractionService - Domain Service
 *
 * Verifies:
 * - Trait extraction from planetary positions
 * - Strength calculation (dignity bonus, house bonus, aspect bonus)
 * - Category assignment logic
 * - Ecliptic coordinate handling
 * - Edge cases (detriment/fall, no house data, etc.)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TraitExtractionService } from '../TraitExtractionService.js';
import { NatalChartData } from '../../../value-objects/astrology/NatalChartData.js';
import { ZodiacSign } from '../../../value-objects/astrology/ZodiacSign.js';
import type { PlanetPlacement, AspectData, House } from '../../../value-objects/astrology/NatalChartData.js';

describe('TraitExtractionService', () => {
  let service: TraitExtractionService;

  beforeEach(() => {
    service = new TraitExtractionService();
  });

  // Helper to create mock planet placement
  const createPlanet = (
    planetName: string,
    signName: any,
    degree: number,
    house: number | null = null
  ): PlanetPlacement => ({
    planetName,
    sign: ZodiacSign.create(signName, degree % 30),
    house,
    degree,
    speed: 1.0,
    isRetrograde: false,
  });

  // Helper to create minimal natal chart
  const createMockChart = (overrides: Partial<any> = {}): NatalChartData => {
    const defaultChart = {
      planets: {
        sun: createPlanet('sun', 'aries', 10, 1),
        moon: createPlanet('moon', 'taurus', 45, 2),
        mercury: createPlanet('mercury', 'gemini', 80, 3),
        venus: createPlanet('venus', 'libra', 190, 7),
        mars: createPlanet('mars', 'scorpio', 220, 8),
        jupiter: createPlanet('jupiter', 'sagittarius', 250, 9),
        saturn: createPlanet('saturn', 'capricorn', 280, 10),
        uranus: createPlanet('uranus', 'aquarius', 310, 11),
        neptune: createPlanet('neptune', 'pisces', 340, 12),
        pluto: createPlanet('pluto', 'scorpio', 225, 8),
        northNode: createPlanet('northNode', 'cancer', 100, 4),
        southNode: createPlanet('southNode', 'capricorn', 280, 10),
      },
      houses: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        cuspDegree: i * 30,
        cuspSign: ZodiacSign.fromDegree(i * 30),
        planets: [],
      })) as House[],
      aspects: [] as AspectData[],
      dominantElement: 'fire' as const,
      dominantModality: 'cardinal' as const,
      ascendant: ZodiacSign.create('aries', 0),
      midheaven: ZodiacSign.create('capricorn', 0),
      ...overrides,
    };

    return NatalChartData.create(defaultChart);
  };

  describe('extractTraits', () => {
    it('should extract traits from all major planets', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      expect(traits.length).toBeGreaterThanOrEqual(10);
    });

    it('should extract trait for Sun', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      const sunTrait = traits.find((t) => t.sourcePosition.planet === 'Sun');
      expect(sunTrait).toBeDefined();
      expect(sunTrait?.id).toContain('sun');
      expect(sunTrait?.category).toBe('identity');
    });

    it('should assign correct planet-sign trait names', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      const sunTrait = traits.find((t) => t.sourcePosition.planet === 'Sun');
      expect(sunTrait?.name).toBe('Bold Leadership');
    });

    it('should add Ascendant trait when birth time known', () => {
      const chart = createMockChart({
        ascendant: ZodiacSign.create('leo', 5),
      });
      const traits = service.extractTraits(chart);

      const ascTrait = traits.find((t) => t.sourcePosition.planet === 'Ascendant');
      expect(ascTrait).toBeDefined();
      expect(ascTrait?.category).toBe('identity');
      expect(ascTrait?.name).toBe('Magnetic Charisma');
    });

    it('should not add Ascendant trait when birth time unknown', () => {
      const chart = createMockChart({
        ascendant: null,
        houses: [],
      });
      const traits = service.extractTraits(chart);

      const ascTrait = traits.find((t) => t.sourcePosition.planet === 'Ascendant');
      expect(ascTrait).toBeUndefined();
    });

    it('should set empty description', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      traits.forEach((trait) => {
        expect(trait.description).toBe('');
      });
    });
  });

  describe('strength calculation', () => {
    it('should calculate higher strength for planets in domicile', () => {
      const chart1 = createMockChart({
        planets: {
          ...createMockChart().planets,
          mars: createPlanet('mars', 'aries', 10, 1),
        },
      });

      const chart2 = createMockChart({
        planets: {
          ...createMockChart().planets,
          mars: createPlanet('mars', 'libra', 190, 7),
        },
      });

      const traits1 = service.extractTraits(chart1);
      const traits2 = service.extractTraits(chart2);

      const marsTrait1 = traits1.find((t) => t.sourcePosition.planet === 'Mars');
      const marsTrait2 = traits2.find((t) => t.sourcePosition.planet === 'Mars');

      expect(marsTrait1?.strength).toBeGreaterThan(marsTrait2?.strength || 0);
    });

    it('should clamp strength to 0-100 range', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      traits.forEach((trait) => {
        expect(trait.strength).toBeGreaterThanOrEqual(0);
        expect(trait.strength).toBeLessThanOrEqual(100);
      });
    });

    it('should round strength to integer', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      traits.forEach((trait) => {
        expect(trait.strength).toBe(Math.round(trait.strength));
      });
    });
  });

  describe('category assignment', () => {
    const categoryTests = [
      { planet: 'Sun', category: 'identity' },
      { planet: 'Moon', category: 'emotional' },
      { planet: 'Mercury', category: 'mental' },
      { planet: 'Venus', category: 'social' },
      { planet: 'Mars', category: 'creative' },
      { planet: 'Jupiter', category: 'spiritual' },
      { planet: 'Saturn', category: 'spiritual' },
      { planet: 'Uranus', category: 'creative' },
      { planet: 'Neptune', category: 'spiritual' },
      { planet: 'Pluto', category: 'creative' },
    ];

    categoryTests.forEach(({ planet, category }) => {
      it(`should assign "${category}" to ${planet}`, () => {
        const chart = createMockChart();
        const traits = service.extractTraits(chart);

        const trait = traits.find((t) => t.sourcePosition.planet === planet);
        expect(trait?.category).toBe(category);
      });
    });
  });

  describe('ecliptic coordinates', () => {
    it('should use deterministic latitude for same planet', () => {
      const chart1 = createMockChart();
      const chart2 = createMockChart();

      const traits1 = service.extractTraits(chart1);
      const traits2 = service.extractTraits(chart2);

      const sunTrait1 = traits1.find((t) => t.sourcePosition.planet === 'Sun');
      const sunTrait2 = traits2.find((t) => t.sourcePosition.planet === 'Sun');

      expect(sunTrait1?.eclipticLatitude).toBe(sunTrait2?.eclipticLatitude);
    });

    it('should keep latitude within -5 to +5 degree range', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      traits.forEach((trait) => {
        expect(trait.eclipticLatitude).toBeGreaterThanOrEqual(-5);
        expect(trait.eclipticLatitude).toBeLessThanOrEqual(5);
      });
    });

    it('should set Ascendant latitude to 0', () => {
      const chart = createMockChart();
      const traits = service.extractTraits(chart);

      const ascTrait = traits.find((t) => t.sourcePosition.planet === 'Ascendant');
      expect(ascTrait?.eclipticLatitude).toBe(0);
    });
  });
});
