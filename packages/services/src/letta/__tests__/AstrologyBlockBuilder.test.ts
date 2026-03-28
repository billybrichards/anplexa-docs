import { describe, it, expect } from 'vitest';
import { AstrologyBlockBuilder } from '../AstrologyBlockBuilder.js';
import {
  NatalChartData,
  type PlanetPlacement,
} from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { ZodiacSign } from '@anplexa/core/domain/value-objects/astrology/ZodiacSign';

/** Degree midpoints for signs used in tests */
function getDegreeForSign(signName: string): number {
  const signs = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  ];
  const index = signs.indexOf(signName);
  return index * 30 + 15;
}

function createPlanet(name: string, signName: string): PlanetPlacement {
  const degree = getDegreeForSign(signName);
  return {
    planetName: name,
    sign: ZodiacSign.fromDegree(degree),
    house: null,
    degree,
    speed: 1.0,
    isRetrograde: false,
  };
}

function createMockChart(overrides: Record<string, unknown> = {}): NatalChartData {
  return NatalChartData.create({
    planets: {
      sun: createPlanet('Sun', 'leo'),
      moon: createPlanet('Moon', 'pisces'),
      mercury: createPlanet('Mercury', 'virgo'),
      venus: createPlanet('Venus', 'taurus'),
      mars: createPlanet('Mars', 'aries'),
      jupiter: createPlanet('Jupiter', 'sagittarius'),
      saturn: createPlanet('Saturn', 'capricorn'),
      uranus: createPlanet('Uranus', 'aquarius'),
      neptune: createPlanet('Neptune', 'pisces'),
      pluto: createPlanet('Pluto', 'scorpio'),
      northNode: createPlanet('North Node', 'gemini'),
      southNode: createPlanet('South Node', 'sagittarius'),
    },
    houses: [],
    aspects: [],
    dominantElement: 'fire',
    dominantModality: 'cardinal',
    ascendant: ZodiacSign.fromDegree(getDegreeForSign('scorpio')),
    midheaven: ZodiacSign.fromDegree(getDegreeForSign('leo')),
    ...overrides,
  });
}

describe('AstrologyBlockBuilder', () => {
  const builder = new AstrologyBlockBuilder();

  describe('buildHumanBlock', () => {
    it('should build a complete human block with all data', () => {
      const chart = createMockChart();
      const result = builder.buildHumanBlock(chart, 'Alex');
      expect(result).toContain('Name: Alex');
      expect(result).toContain('Sun Sign:');
      expect(result).toContain('Moon Sign:');
      expect(result).toContain('Rising Sign:');
      expect(result).toContain('ASTROLOGICAL PROFILE:');
      expect(result).toContain('DOMINANT TRAITS:');
      expect(result).toContain('fire');
      expect(result).toContain('KNOWN FACTS:');
    });

    it('should include Mercury communication style in known facts', () => {
      const chart = createMockChart();
      const result = builder.buildHumanBlock(chart, 'Alex');
      expect(result).toContain('Communication style: Mercury in');
    });

    it('should use [unknown] if no name provided', () => {
      const chart = createMockChart();
      const result = builder.buildHumanBlock(chart);
      expect(result).toContain('Name: [unknown]');
    });

    it('should handle null chart gracefully', () => {
      const result = builder.buildHumanBlock(null, 'Alex');
      expect(result).toContain('Name: Alex');
      expect(result).not.toContain('Sun Sign');
    });

    it('should handle undefined chart gracefully', () => {
      const result = builder.buildHumanBlock(undefined);
      expect(result).toContain('Name: [unknown]');
    });

    it('should handle chart without ascendant', () => {
      const chart = createMockChart({ ascendant: null });
      const result = builder.buildHumanBlock(chart, 'Alex');
      expect(result).not.toContain('Rising Sign:');
    });

    it('should respect the 3000 char limit', () => {
      const chart = createMockChart();
      const result = builder.buildHumanBlock(chart, 'A'.repeat(2000));
      expect(result.length).toBeLessThanOrEqual(3000);
    });
  });

  describe('buildUserModelBlock', () => {
    it('should build a seeded user model with astrology data', () => {
      const chart = createMockChart();
      const result = builder.buildUserModelBlock(chart, 'Alex');
      expect(result).toContain('Name: Alex');
      expect(result).toContain('Communication style: Mercury in');
      expect(result).toContain('Key traits: fire, cardinal');
      expect(result).toContain('astrology-informed');
    });

    it('should fall back to [observing] if no chart', () => {
      const result = builder.buildUserModelBlock(null);
      expect(result).toContain('Communication style: [observing]');
      expect(result).toContain('Emotional patterns: [observing]');
    });

    it('should handle null inputs', () => {
      const result = builder.buildUserModelBlock(null, null);
      expect(result).toContain('Name: [unknown]');
      expect(result).toContain('User Model');
    });

    it('should include emotional patterns from moon sign', () => {
      const chart = createMockChart();
      const result = builder.buildUserModelBlock(chart, 'Alex');
      expect(result).toContain('Emotional patterns: Moon in');
    });

    it('should respect the 3000 char limit', () => {
      const chart = createMockChart();
      const result = builder.buildUserModelBlock(chart, 'A'.repeat(2000));
      expect(result.length).toBeLessThanOrEqual(3000);
    });
  });
});
