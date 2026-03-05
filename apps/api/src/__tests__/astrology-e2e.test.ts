/**
 * Astrology Pipeline — End-to-End Tests
 *
 * Tests the complete flow from raw birth data input through to:
 * - BirthData validation & Julian Day calculation
 * - ZodiacSign derivation from ecliptic longitude
 * - Full natal chart calculation (SimplifiedAstrologyService)
 * - Big Three (Sun/Moon/Rising) extraction
 * - Elemental & modal balance analysis
 * - Trait extraction from chart positions
 * - Compatibility scoring between two charts
 * - Interpretation & companion context generation
 * - CalculateBirthChartUseCase with mocked repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BirthData } from '@anplexa/core/domain/value-objects/astrology/BirthData';
import { ZodiacSign, type ZodiacSignName, type Element } from '@anplexa/core/domain/value-objects/astrology/ZodiacSign';
import { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { SimplifiedAstrologyService } from '@anplexa/services';
import { TraitExtractionService } from '@anplexa/core/domain/services/astrology/TraitExtractionService';
import { CompatibilityCalculationService } from '@anplexa/core/domain/services/astrology/CompatibilityCalculationService';
import { CalculateBirthChartUseCase } from '@anplexa/core/use-cases/astrology/CalculateBirthChartUseCase';

// ─────────────────────────────────────────────────────────────
// Known birth data for deterministic assertions
// ─────────────────────────────────────────────────────────────

/** Aries test subject: April 16, 1999, 11:30 AM, London */
const ARIES_BIRTH = {
  date: new Date('1999-04-16'),
  time: '11:30',
  timeZone: 'Europe/London',
  latitude: 51.5074,
  longitude: -0.1278,
  placeName: 'London',
  country: 'United Kingdom',
  timeKnown: true,
};

/** Frida Kahlo: July 6, 1907, Coyoacán, Mexico (time unknown) */
const KAHLO_BIRTH = {
  date: new Date('1907-07-06'),
  time: '12:00',
  timeZone: 'America/Mexico_City',
  latitude: 19.3500,
  longitude: -99.1617,
  placeName: 'Coyoacán',
  country: 'Mexico',
  timeKnown: false,
};

/** Modern date: Jan 15, 2000, 09:00 AM, London */
const MODERN_BIRTH = {
  date: new Date('2000-01-15'),
  time: '09:00',
  timeZone: 'Europe/London',
  latitude: 51.5074,
  longitude: -0.1278,
  placeName: 'London',
  country: 'United Kingdom',
  timeKnown: true,
};

/** Summer solstice baby: June 21, 1990, 14:00, Sydney */
const SUMMER_SOLSTICE_BIRTH = {
  date: new Date('1990-06-21'),
  time: '14:00',
  timeZone: 'Australia/Sydney',
  latitude: -33.8688,
  longitude: 151.2093,
  placeName: 'Sydney',
  country: 'Australia',
  timeKnown: true,
};

// ─────────────────────────────────────────────────────────────
// 1. BirthData Value Object
// ─────────────────────────────────────────────────────────────

describe('E2E: BirthData Value Object', () => {
  it('creates valid birth data from known date', () => {
    const birthData = BirthData.create(ARIES_BIRTH);

    expect(birthData.placeName).toBe('London');
    expect(birthData.country).toBe('United Kingdom');
    expect(birthData.timeKnown).toBe(true);
    expect(birthData.latitude).toBe(51.5074);
    expect(birthData.longitude).toBe(-0.1278);
  });

  it('calculates Julian Day correctly for J2000 epoch', () => {
    const j2000 = BirthData.create({
      date: new Date('2000-01-01'),
      time: '12:00',
      timeZone: 'UTC',
      latitude: 0,
      longitude: 0,
      placeName: 'Null Island',
      country: 'Atlantic',
      timeKnown: true,
    });

    const jd = j2000.getJulianDay();
    // Should be close to 2451545.0
    expect(jd).toBeGreaterThan(2451544);
    expect(jd).toBeLessThan(2451546);
  });

  it('uses noon UTC when time is unknown', () => {
    const birthData = BirthData.create(KAHLO_BIRTH);
    const utc = birthData.getUTCTimestamp();
    expect(utc.getUTCHours()).toBe(12);
    expect(utc.getUTCMinutes()).toBe(0);
  });

  it('rejects future birth dates', () => {
    expect(() =>
      BirthData.create({ ...MODERN_BIRTH, date: new Date('2099-01-01') })
    ).toThrow('Birth date cannot be in the future');
  });

  it('rejects dates before 1900', () => {
    expect(() =>
      BirthData.create({ ...MODERN_BIRTH, date: new Date('1899-12-31') })
    ).toThrow('Birth date must be after 1900-01-01');
  });

  it('rejects invalid time format', () => {
    expect(() =>
      BirthData.create({ ...MODERN_BIRTH, time: '25:00' })
    ).toThrow('Time must be in HH:MM format');
  });

  it('rejects invalid coordinates', () => {
    expect(() => BirthData.create({ ...MODERN_BIRTH, latitude: 91 })).toThrow('Latitude');
    expect(() => BirthData.create({ ...MODERN_BIRTH, longitude: 181 })).toThrow('Longitude');
  });

  it('serializes and deserializes correctly', () => {
    const original = BirthData.create(ARIES_BIRTH);
    const json = original.toJSON();
    const restored = BirthData.fromJSON(json);
    expect(original.equals(restored)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. ZodiacSign Value Object
// ─────────────────────────────────────────────────────────────

describe('E2E: ZodiacSign Value Object', () => {
  it('maps all 12 signs from ecliptic degrees', () => {
    const expected: [number, ZodiacSignName][] = [
      [5, 'aries'], [45, 'taurus'], [75, 'gemini'], [105, 'cancer'],
      [135, 'leo'], [165, 'virgo'], [195, 'libra'], [225, 'scorpio'],
      [255, 'sagittarius'], [285, 'capricorn'], [315, 'aquarius'], [345, 'pisces'],
    ];

    for (const [degree, expectedSign] of expected) {
      expect(ZodiacSign.fromDegree(degree).name).toBe(expectedSign);
    }
  });

  it('assigns correct elements to all signs', () => {
    const fire: ZodiacSignName[] = ['aries', 'leo', 'sagittarius'];
    const earth: ZodiacSignName[] = ['taurus', 'virgo', 'capricorn'];
    const air: ZodiacSignName[] = ['gemini', 'libra', 'aquarius'];
    const water: ZodiacSignName[] = ['cancer', 'scorpio', 'pisces'];

    for (const n of fire) expect(ZodiacSign.create(n).element).toBe('fire');
    for (const n of earth) expect(ZodiacSign.create(n).element).toBe('earth');
    for (const n of air) expect(ZodiacSign.create(n).element).toBe('air');
    for (const n of water) expect(ZodiacSign.create(n).element).toBe('water');
  });

  it('assigns correct modalities', () => {
    const cardinal: ZodiacSignName[] = ['aries', 'cancer', 'libra', 'capricorn'];
    const fixed: ZodiacSignName[] = ['taurus', 'leo', 'scorpio', 'aquarius'];
    const mutable: ZodiacSignName[] = ['gemini', 'virgo', 'sagittarius', 'pisces'];

    for (const n of cardinal) expect(ZodiacSign.create(n).modality).toBe('cardinal');
    for (const n of fixed) expect(ZodiacSign.create(n).modality).toBe('fixed');
    for (const n of mutable) expect(ZodiacSign.create(n).modality).toBe('mutable');
  });

  it('computes elemental compatibility', () => {
    const aries = ZodiacSign.create('aries');     // fire
    const gemini = ZodiacSign.create('gemini');   // air
    const cancer = ZodiacSign.create('cancer');   // water

    expect(aries.isCompatibleElement(gemini)).toBe(true);  // fire + air
    expect(aries.isCompatibleElement(cancer)).toBe(false);  // fire + water
  });

  it('ecliptic longitude round-trips correctly', () => {
    for (let deg = 0; deg < 360; deg += 15) {
      const sign = ZodiacSign.fromDegree(deg);
      expect(Math.abs(sign.getEclipticLongitude() - deg)).toBeLessThan(0.01);
    }
  });

  it('renders correct Unicode symbols', () => {
    const symbols = '♈♉♊♋♌♍♎♏♐♑♒♓';
    const signs: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];
    signs.forEach((name, i) => {
      expect(ZodiacSign.create(name).toSymbol()).toBe(symbols[i]);
    });
  });

  it('rejects out-of-range degrees', () => {
    expect(() => ZodiacSign.fromDegree(-1)).toThrow();
    expect(() => ZodiacSign.fromDegree(360)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Full Natal Chart Calculation
// ─────────────────────────────────────────────────────────────

describe('E2E: SimplifiedAstrologyService — Chart Calculation', () => {
  let service: SimplifiedAstrologyService;

  beforeEach(() => {
    service = new SimplifiedAstrologyService();
  });

  it('reports availability', async () => {
    expect(await service.isAvailable()).toBe(true);
  });

  it('calculates complete chart with all 12 planets (Einstein)', async () => {
    const birthData = BirthData.create(ARIES_BIRTH);
    const chart = await service.calculateNatalChart(birthData);

    expect(Object.keys(chart.planets).length).toBe(12);

    for (const planet of Object.values(chart.planets)) {
      expect(planet.degree).toBeGreaterThanOrEqual(0);
      expect(planet.degree).toBeLessThan(360);
      expect(planet.sign).toBeDefined();
      expect(planet.sign.name).toBeTruthy();
    }
  });

  it('calculates houses when time is known', async () => {
    const birthData = BirthData.create(ARIES_BIRTH);
    const chart = await service.calculateNatalChart(birthData);

    expect(chart.hasHouses()).toBe(true);
    expect(chart.houses.length).toBe(12);
    expect(chart.ascendant).not.toBeNull();
    expect(chart.midheaven).not.toBeNull();
  });

  it('omits houses when time is unknown (Kahlo)', async () => {
    const birthData = BirthData.create(KAHLO_BIRTH);
    const chart = await service.calculateNatalChart(birthData);

    expect(chart.hasHouses()).toBe(false);
    expect(chart.ascendant).toBeNull();
    expect(chart.midheaven).toBeNull();
    expect(Object.keys(chart.planets).length).toBe(12); // planets still calculated
  });

  it('detects aspects between planets', async () => {
    const birthData = BirthData.create(ARIES_BIRTH);
    const chart = await service.calculateNatalChart(birthData);

    expect(chart.aspects.length).toBeGreaterThan(0);
    for (const aspect of chart.aspects) {
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
      expect(aspect.strength).toBeGreaterThanOrEqual(0);
      expect(aspect.strength).toBeLessThanOrEqual(1);
      expect(['conjunction', 'opposition', 'trine', 'square', 'sextile']).toContain(aspect.aspectType);
    }
  });

  it('Sun in Aries for Apr 16, 1999', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    expect(chart.getBigThree().sun).toBe('aries');
  });

  it('Sun in Cancer for Kahlo (July 6, 1907)', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(KAHLO_BIRTH));
    expect(chart.getBigThree().sun).toBe('cancer');
  });

  it('Sun in Capricorn for Jan 15, 2000', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    expect(chart.getBigThree().sun).toBe('capricorn');
  });

  it('Sun in Gemini or Cancer for June 21, 1990 (boundary)', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(SUMMER_SOLSTICE_BIRTH));
    expect(['gemini', 'cancer']).toContain(chart.getBigThree().sun);
  });

  it('assigns all planets to houses 1-12 when time is known', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));

    for (const planet of Object.values(chart.planets)) {
      expect(planet.house).toBeGreaterThanOrEqual(1);
      expect(planet.house).toBeLessThanOrEqual(12);
    }
  });

  it('south node is 180° opposite north node', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));

    const diff = Math.abs(chart.planets.northNode.degree - chart.planets.southNode.degree);
    const normalized = diff > 180 ? 360 - diff : diff;
    expect(Math.abs(normalized - 180)).toBeLessThan(0.01);
  });

  it('sets valid dominant element and modality', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));

    expect(['fire', 'earth', 'air', 'water']).toContain(chart.dominantElement);
    expect(['cardinal', 'fixed', 'mutable']).toContain(chart.dominantModality);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Chart Analysis Methods
// ─────────────────────────────────────────────────────────────

describe('E2E: NatalChartData Analysis', () => {
  let service: SimplifiedAstrologyService;

  beforeEach(() => {
    service = new SimplifiedAstrologyService();
  });

  it('elemental balance sums to 12', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const b = chart.getElementalBalance();
    expect(b.fire + b.earth + b.air + b.water).toBe(12);
  });

  it('modal balance sums to 12', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const b = chart.getModalBalance();
    expect(b.cardinal + b.fixed + b.mutable).toBe(12);
  });

  it('dominant element matches highest count', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const b = chart.getElementalBalance();
    const max = (Object.entries(b) as [Element, number][]).sort(([, a], [, c]) => c - a)[0][0];
    expect(chart.dominantElement).toBe(max);
  });

  it('getSummary includes Big Three', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const summary = chart.getSummary();
    expect(summary).toContain('Sun in');
    expect(summary).toContain('Moon in');
  });

  it('getDetailedSummary includes personal planets', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const detail = chart.getDetailedSummary();
    expect(detail).toContain('communication');
    expect(detail).toContain('relationships');
    expect(detail).toContain('drive');
  });

  it('getPlanetsInSign finds Sun correctly', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const aries = chart.getPlanetsInSign('aries');
    expect(aries.some(p => p.planetName === 'sun')).toBe(true);
  });

  it('chart serializes and deserializes correctly', async () => {
    const original = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const restored = NatalChartData.fromJSON(original.toJSON());

    expect(restored.getBigThree().sun).toBe(original.getBigThree().sun);
    expect(restored.getBigThree().moon).toBe(original.getBigThree().moon);
    expect(restored.dominantElement).toBe(original.dominantElement);
    expect(restored.aspects.length).toBe(original.aspects.length);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Trait Extraction
// ─────────────────────────────────────────────────────────────

describe('E2E: TraitExtractionService', () => {
  let astroService: SimplifiedAstrologyService;
  let traitService: TraitExtractionService;

  beforeEach(() => {
    astroService = new SimplifiedAstrologyService();
    traitService = new TraitExtractionService();
  });

  it('extracts traits from a real calculated chart', async () => {
    const chart = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const result = await traitService.extractTraits(chart);

    expect(result.traits.length).toBeGreaterThanOrEqual(8);

    for (const trait of result.traits) {
      expect(trait.name).toBeTruthy();
      expect(trait.strength).toBeGreaterThanOrEqual(0);
      expect(trait.strength).toBeLessThanOrEqual(100);
      expect(['identity', 'emotional', 'social', 'mental', 'creative', 'spiritual']).toContain(trait.category);
    }
  });

  it('elemental and modal balances are consistent', async () => {
    const chart = await astroService.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const result = await traitService.extractTraits(chart);

    const elTotal = result.elementalBalance.fire + result.elementalBalance.earth +
                    result.elementalBalance.air + result.elementalBalance.water;
    // 12 planets + ascendant if time is known = 13
    expect(elTotal).toBeGreaterThanOrEqual(12);
    expect(elTotal).toBeLessThanOrEqual(13);

    const modTotal = result.modalBalance.cardinal + result.modalBalance.fixed + result.modalBalance.mutable;
    expect(modTotal).toBe(elTotal); // both should count same set
  });

  it('identifies dominant planets', async () => {
    const chart = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const result = await traitService.extractTraits(chart);
    // DominantPlanets is { primary, secondary, tertiary }
    expect(result.dominantPlanets.primary).toBeTruthy();
    expect(result.dominantPlanets.secondary).toBeTruthy();
    expect(result.dominantPlanets.tertiary).toBeTruthy();
  });

  it('produces different traits for different people', async () => {
    const eChart = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const kChart = await astroService.calculateNatalChart(BirthData.create(KAHLO_BIRTH));

    const eResult = await traitService.extractTraits(eChart);
    const kResult = await traitService.extractTraits(kChart);
    const eTraits = eResult.traits.map(t => t.name).sort();
    const kTraits = kResult.traits.map(t => t.name).sort();

    expect(eTraits).not.toEqual(kTraits);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Compatibility Scoring
// ─────────────────────────────────────────────────────────────

describe('E2E: Compatibility Between Real Charts', () => {
  let astroService: SimplifiedAstrologyService;
  let compatService: CompatibilityCalculationService;

  beforeEach(() => {
    astroService = new SimplifiedAstrologyService();
    compatService = new CompatibilityCalculationService();
  });

  it('scores Einstein vs Kahlo within valid range', async () => {
    const c1 = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const c2 = await astroService.calculateNatalChart(BirthData.create(KAHLO_BIRTH));
    const scores = compatService.calculateScores(c1, c2);

    for (const key of ['overall', 'elementalHarmony', 'modalSynergy', 'communicationAlignment', 'emotionalResonance'] as const) {
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
    }
  });

  it('overall score follows weighted formula', async () => {
    const c1 = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const c2 = await astroService.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const s = compatService.calculateScores(c1, c2);

    const expected = Math.round(
      s.elementalHarmony * 0.25 + s.modalSynergy * 0.20 +
      s.communicationAlignment * 0.30 + s.emotionalResonance * 0.25
    );
    expect(s.overall).toBe(expected);
  });

  it('self-compatibility scores > 90', async () => {
    const chart = await astroService.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const s = compatService.calculateScores(chart, chart);

    expect(s.overall).toBeGreaterThan(90);
    expect(s.elementalHarmony).toBeGreaterThan(90);
    expect(s.communicationAlignment).toBeGreaterThan(90);
    expect(s.emotionalResonance).toBeGreaterThan(90);
  });

  it('extracts synastry highlights (1-5)', async () => {
    const c1 = await astroService.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const c2 = await astroService.calculateNatalChart(BirthData.create(KAHLO_BIRTH));
    const highlights = compatService.extractSynastryHighlights(c1, c2);

    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights.length).toBeLessThanOrEqual(5);
    for (const h of highlights) {
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Interpretation & Companion Context
// ─────────────────────────────────────────────────────────────

describe('E2E: Interpretation & Companion Context Generation', () => {
  let service: SimplifiedAstrologyService;

  beforeEach(() => {
    service = new SimplifiedAstrologyService();
  });

  it('generates interpretation with Big Three', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(ARIES_BIRTH));
    const interp = await service.generateInterpretation(chart);

    expect(interp).toContain('Natal Chart Reading');
    expect(interp).toContain('Big Three');
    expect(interp).toContain('Sun in');
    expect(interp).toContain('Moon in');
    expect(interp).toContain('Dominant Patterns');
  });

  it('includes Rising when time is known', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const interp = await service.generateInterpretation(chart);
    expect(interp).toContain('Rising');
  });

  it('omits Rising when time is unknown', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(KAHLO_BIRTH));
    const interp = await service.generateInterpretation(chart);
    expect(interp).not.toContain('Rising');
  });

  it('generates companion context with communication guidance', async () => {
    const chart = await service.calculateNatalChart(BirthData.create(MODERN_BIRTH));
    const ctx = await service.generateCompanionContext(chart);

    expect(ctx).toContain('astrological profile');
    expect(ctx).toContain('Sun Sign');
    expect(ctx).toContain('Moon Sign');
    expect(ctx).toContain('When interacting with this user');
    expect(ctx.length).toBeGreaterThan(200);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. CalculateBirthChartUseCase — Full E2E
// ─────────────────────────────────────────────────────────────

describe('E2E: CalculateBirthChartUseCase', () => {
  let useCase: CalculateBirthChartUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(async (data: any) => ({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      getAllByUserId: vi.fn().mockResolvedValue([]),
      deactivateAllForUser: vi.fn().mockResolvedValue(undefined),
      getById: vi.fn(),
      getActiveByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CalculateBirthChartUseCase(mockRepo, new SimplifiedAstrologyService());
  });

  it('full pipeline: input → chart → Big Three → interpretation → output', async () => {
    const result = await useCase.execute({
      userId: 'user_test_001',
      birthDate: '2000-01-15',
      birthTime: '09:00',
      timeZone: 'Europe/London',
      latitude: 51.5074,
      longitude: -0.1278,
      placeName: 'London',
      country: 'United Kingdom',
      setAsActive: true,
    });

    expect(result.birthChart).toBeDefined();
    expect(result.birthChart.id).toBeTruthy();
    expect(result.birthChart.userId).toBe('user_test_001');

    // Jan 15 = Capricorn
    expect(result.sunSign).toBe('capricorn');

    // Moon sign should be valid
    const validSigns: ZodiacSignName[] = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];
    expect(validSigns).toContain(result.moonSign);

    // Rising sign present (time known)
    expect(result.risingSign).not.toBeNull();
    expect(validSigns).toContain(result.risingSign);

    // Non-empty interpretation and context
    expect(result.interpretation.length).toBeGreaterThan(100);
    expect(result.companionContext.length).toBeGreaterThan(100);

    // Repo called correctly
    expect(mockRepo.create).toHaveBeenCalledOnce();
    expect(mockRepo.deactivateAllForUser).toHaveBeenCalledWith('user_test_001');
  });

  it('returns null rising sign when time is unknown', async () => {
    const result = await useCase.execute({
      userId: 'user_test_002',
      birthDate: '1990-06-21',
      birthTime: null,
      timeZone: 'Australia/Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      placeName: 'Sydney',
      country: 'Australia',
    });

    expect(result.risingSign).toBeNull();
    expect(result.sunSign).toBeTruthy();
    expect(result.moonSign).toBeTruthy();
  });

  it('rejects duplicate birth data', async () => {
    mockRepo.getAllByUserId.mockResolvedValue([
      {
        birthData: BirthData.create({
          date: new Date('2000-01-15'),
          time: '09:00',
          timeZone: 'Europe/London',
          latitude: 51.5074,
          longitude: -0.1278,
          placeName: 'London',
          country: 'United Kingdom',
          timeKnown: true,
        }),
      },
    ]);

    await expect(
      useCase.execute({
        userId: 'user_test_003',
        birthDate: '2000-01-15',
        birthTime: '09:00',
        timeZone: 'Europe/London',
        latitude: 51.5074,
        longitude: -0.1278,
        placeName: 'London',
        country: 'United Kingdom',
      })
    ).rejects.toThrow('identical birth data already exists');
  });

  it('rejects future birth dates at domain level', async () => {
    await expect(
      useCase.execute({
        userId: 'user_test_004',
        birthDate: '2099-01-01',
        birthTime: '12:00',
        timeZone: 'UTC',
        latitude: 0,
        longitude: 0,
        placeName: 'Test',
        country: 'Test',
      })
    ).rejects.toThrow('future');
  });
});

// ─────────────────────────────────────────────────────────────
// 9. Determinism — Same Input = Same Output
// ─────────────────────────────────────────────────────────────

describe('E2E: Determinism', () => {
  it('identical birth data produces identical charts', async () => {
    const service = new SimplifiedAstrologyService();
    const birthData = BirthData.create(ARIES_BIRTH);

    const chart1 = await service.calculateNatalChart(birthData);
    const chart2 = await service.calculateNatalChart(birthData);

    expect(chart1.getBigThree()).toEqual(chart2.getBigThree());
    expect(chart1.dominantElement).toBe(chart2.dominantElement);
    expect(chart1.planets.sun.degree).toBe(chart2.planets.sun.degree);
    expect(chart1.planets.moon.degree).toBe(chart2.planets.moon.degree);
    expect(chart1.aspects.length).toBe(chart2.aspects.length);
  });
});
