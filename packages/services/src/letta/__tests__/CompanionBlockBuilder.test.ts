import { describe, it, expect } from 'vitest';
import { CompanionBlockBuilder, type CompanionPersonaInput } from '../CompanionBlockBuilder.js';
import { PersonalityTraits } from '@anplexa/core/domain/value-objects/companion/PersonalityTraits';
import { CommunicationStyle } from '@anplexa/core/domain/value-objects/companion/CommunicationStyle';
import { EmotionalApproach } from '@anplexa/core/domain/value-objects/companion/EmotionalApproach';
import {
  NatalChartData,
  type PlanetPlacement,
} from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { ZodiacSign } from '@anplexa/core/domain/value-objects/astrology/ZodiacSign';

function getDegreeForSign(signName: string): number {
  const signs = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  ];
  return signs.indexOf(signName) * 30 + 15;
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

function createMockChart(): NatalChartData {
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
    ascendant: null,
    midheaven: null,
  });
}

function createFullCompanion(): CompanionPersonaInput {
  return {
    name: 'Aurora',
    personalityTraits: PersonalityTraits.create({
      traits: ['Warm', 'Witty', 'Empathetic', 'Creative'],
      coreArchetype: 'The Wise Friend',
    }),
    communicationStyle: CommunicationStyle.create({
      tone: 'warm',
      directness: 'gentle',
      pacing: 'thoughtful',
      verbosity: 'moderate',
      formalityLevel: 3,
      usesMetaphors: true,
      usesHumor: true,
      emotionalExpressiveness: 'expressive',
    }),
    emotionalApproach: EmotionalApproach.create({
      empathyLevel: 'high',
      supportStyle: 'nurturing',
      depthPreference: 'deep',
      validationStyle: 'balanced',
      boundaryRespect: 8,
      emotionalMirroring: true,
      proactiveCareCheckins: true,
    }),
  };
}

describe('CompanionBlockBuilder', () => {
  const builder = new CompanionBlockBuilder();

  describe('buildPersonaBlock', () => {
    it('should build a complete persona block', () => {
      const companion = createFullCompanion();
      const chart = createMockChart();
      const result = builder.buildPersonaBlock(companion, chart);
      expect(result).toContain('IDENTITY:');
      expect(result).toContain('Aurora');
      expect(result).toContain('PERSONALITY:');
      expect(result).toContain('COMMUNICATION STYLE:');
      expect(result).toContain('EMOTIONAL APPROACH:');
      expect(result).toContain('ASTROLOGICAL AWARENESS:');
    });

    it('should include personality traits', () => {
      const companion = createFullCompanion();
      const result = builder.buildPersonaBlock(companion, null);
      expect(result).toContain('- Warm');
      expect(result).toContain('- Witty');
      expect(result).toContain('- Empathetic');
    });

    it('should include archetype when present', () => {
      const companion = createFullCompanion();
      const result = builder.buildPersonaBlock(companion, null);
      expect(result).toContain('ARCHETYPE: The Wise Friend');
    });

    it('should include communication style fields', () => {
      const companion = createFullCompanion();
      const result = builder.buildPersonaBlock(companion, null);
      expect(result).toContain('Tone: warm');
      expect(result).toContain('Directness: gentle');
      expect(result).toContain('Pacing: thoughtful');
      expect(result).toContain('Expressiveness: expressive');
      expect(result).toContain('Formality: 3/10');
    });

    it('should include emotional approach fields', () => {
      const companion = createFullCompanion();
      const result = builder.buildPersonaBlock(companion, null);
      expect(result).toContain('Empathy: high');
      expect(result).toContain('Support style: nurturing');
      expect(result).toContain('Depth: deep');
    });

    it('should include astrological awareness when chart provided', () => {
      const companion = createFullCompanion();
      const chart = createMockChart();
      const result = builder.buildPersonaBlock(companion, chart);
      expect(result).toContain('Sun is in');
      expect(result).toContain('Moon is in');
      expect(result).toContain('Mercury in');
      expect(result).toContain('subtly');
    });

    it('should omit astrological awareness when no chart', () => {
      const companion = createFullCompanion();
      const result = builder.buildPersonaBlock(companion, null);
      expect(result).not.toContain('ASTROLOGICAL AWARENESS:');
      expect(result).toContain('IDENTITY:');
    });

    it('should handle minimal companion data', () => {
      const minimal: CompanionPersonaInput = { name: 'Test' };
      const result = builder.buildPersonaBlock(minimal, null);
      expect(result).toContain('IDENTITY:');
      expect(result).toContain('Test');
      expect(result).not.toContain('PERSONALITY:');
      expect(result).not.toContain('COMMUNICATION STYLE:');
    });

    it('should respect the 4000 char limit', () => {
      const companion = createFullCompanion();
      const chart = createMockChart();
      const result = builder.buildPersonaBlock(companion, chart);
      expect(result.length).toBeLessThanOrEqual(4000);
    });
  });
});
