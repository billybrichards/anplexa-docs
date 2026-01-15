---
sidebar_position: 12
---

# Cosmic Companion: Domain Services & Repository Interfaces

## 1.3 Domain Services

### CompatibilityService

```typescript
// packages/cosmic-companion/src/domain/services/CompatibilityService.ts

import { BirthChart } from '../entities/BirthChart';
import { ZodiacSign } from '../value-objects/ZodiacSign';
import { CompatibilityScore } from '../value-objects/CompatibilityScore';
import { ZodiacPersonality } from '../value-objects/ZodiacPersonality';

export interface GeneratedCompanionProfile {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  venusSign: ZodiacSign;
  marsSign: ZodiacSign;
  risingSign: ZodiacSign;
  compatibilityScore: CompatibilityScore;
  personalityTraits: string[];
  communicationStyle: string;
  intimacyStyle: string;
}

/**
 * Domain service for zodiac compatibility calculations
 * Contains pure business logic with no external dependencies
 */
export class CompatibilityService {
  /**
   * Generate an optimal companion personality based on user's birth chart
   */
  generateOptimalCompanion(userChart: BirthChart): GeneratedCompanionProfile {
    // Find complementary signs for each placement
    const sunSign = this.findComplementarySign(userChart.sunSign, 'sun');
    const moonSign = this.findComplementarySign(userChart.moonSign, 'moon');
    const venusSign = this.findHarmoniousVenus(userChart.venusSign);
    const marsSign = this.findPassionateMars(userChart.marsSign);
    const risingSign = this.findBalancedRising(userChart.risingSign);

    // Calculate compatibility score
    const compatibilityScore = CompatibilityScore.calculate(
      userChart.sunSign,
      userChart.moonSign,
      userChart.venusSign,
      userChart.marsSign,
      userChart.risingSign,
      sunSign,
      moonSign,
      venusSign,
      marsSign,
      risingSign
    );

    return {
      sunSign,
      moonSign,
      venusSign,
      marsSign,
      risingSign,
      compatibilityScore,
      personalityTraits: this.derivePersonalityTraits(sunSign, moonSign),
      communicationStyle: this.deriveCommunicationStyle(sunSign, moonSign),
      intimacyStyle: this.deriveIntimacyStyle(venusSign, marsSign)
    };
  }

  /**
   * Calculate synastry between two birth charts
   */
  calculateSynastry(chart1: BirthChart, chart2: BirthChart): SynastryReport {
    const aspects: SynastryAspect[] = [];

    // Sun-Sun aspects
    aspects.push(this.analyzeAspect(
      chart1.sunSign, chart2.sunSign, 'Sun', 'Sun', 'Core personality harmony'
    ));

    // Moon-Moon aspects (emotional connection)
    aspects.push(this.analyzeAspect(
      chart1.moonSign, chart2.moonSign, 'Moon', 'Moon', 'Emotional understanding'
    ));

    // Venus-Mars aspects (romantic/sexual chemistry)
    aspects.push(this.analyzeAspect(
      chart1.venusSign, chart2.marsSign, 'Venus', 'Mars', 'Romantic attraction'
    ));
    aspects.push(this.analyzeAspect(
      chart1.marsSign, chart2.venusSign, 'Mars', 'Venus', 'Physical chemistry'
    ));

    // Sun-Moon aspects (ego-emotion balance)
    aspects.push(this.analyzeAspect(
      chart1.sunSign, chart2.moonSign, 'Sun', 'Moon', 'Conscious-unconscious balance'
    ));

    const overallScore = CompatibilityScore.calculate(
      chart1.sunSign, chart1.moonSign, chart1.venusSign, chart1.marsSign, chart1.risingSign,
      chart2.sunSign, chart2.moonSign, chart2.venusSign, chart2.marsSign, chart2.risingSign
    );

    return {
      aspects,
      overallScore,
      relationshipThemes: this.identifyThemes(aspects),
      growthAreas: this.identifyGrowthAreas(aspects)
    };
  }

  private findComplementarySign(userSign: ZodiacSign, placement: string): ZodiacSign {
    // Trine (same element) creates harmony
    const trineOptions = this.getTrineSignNames(userSign);
    // Choose based on placement needs
    const selectedName = trineOptions[Math.floor(Math.random() * trineOptions.length)];
    return ZodiacSign.fromName(selectedName);
  }

  private findHarmoniousVenus(userVenus: ZodiacSign): ZodiacSign {
    // Venus-Venus harmony is best with same sign, trine, or sextile
    const harmonious = [
      userVenus.name, // Same sign = perfect love language match
      ...this.getTrineSignNames(userVenus),
      ...this.getSextileSignNames(userVenus)
    ];
    const selected = harmonious[0]; // Prefer same sign for Venus
    return ZodiacSign.fromName(selected);
  }

  private findPassionateMars(userMars: ZodiacSign): ZodiacSign {
    // Mars compatibility needs fire or passion
    const element = userMars.element;
    if (element === 'fire' || element === 'air') {
      // Match fire with fire or air for exciting chemistry
      return ZodiacSign.fromName(this.getFireSignName());
    } else {
      // Match earth/water with complementary energy
      return ZodiacSign.fromName(this.getComplementaryMarsSign(userMars));
    }
  }

  private findBalancedRising(userRising: ZodiacSign): ZodiacSign {
    // Rising sign determines first impression - complement user's rising
    const oppositeElement = this.getOppositeElement(userRising.element);
    return this.getSignByElement(oppositeElement);
  }

  private getTrineSignNames(sign: ZodiacSign): ZodiacSignName[] {
    const element = sign.element;
    const elementSigns: Record<Element, ZodiacSignName[]> = {
      fire: ['aries', 'leo', 'sagittarius'],
      earth: ['taurus', 'virgo', 'capricorn'],
      air: ['gemini', 'libra', 'aquarius'],
      water: ['cancer', 'scorpio', 'pisces']
    };
    return elementSigns[element].filter(s => s !== sign.name);
  }

  private getSextileSignNames(sign: ZodiacSign): ZodiacSignName[] {
    const compatibleElements: Record<Element, Element[]> = {
      fire: ['air'],
      earth: ['water'],
      air: ['fire'],
      water: ['earth']
    };
    const targetElements = compatibleElements[sign.element];
    // Return signs from compatible elements
    const sextileSigns: ZodiacSignName[] = [];
    for (const el of targetElements) {
      sextileSigns.push(...this.getSignNamesByElement(el));
    }
    return sextileSigns;
  }

  private getSignNamesByElement(element: Element): ZodiacSignName[] {
    const elementSigns: Record<Element, ZodiacSignName[]> = {
      fire: ['aries', 'leo', 'sagittarius'],
      earth: ['taurus', 'virgo', 'capricorn'],
      air: ['gemini', 'libra', 'aquarius'],
      water: ['cancer', 'scorpio', 'pisces']
    };
    return elementSigns[element];
  }

  private getFireSignName(): ZodiacSignName {
    const fireOptions: ZodiacSignName[] = ['aries', 'leo', 'sagittarius'];
    return fireOptions[Math.floor(Math.random() * fireOptions.length)];
  }

  private getComplementaryMarsSign(mars: ZodiacSign): ZodiacSignName {
    // For earth/water Mars, find passionate complement
    if (mars.element === 'earth') {
      return 'scorpio'; // Intense water matches earth's sensuality
    }
    return 'leo'; // Fire ignites water's depth
  }

  private getOppositeElement(element: Element): Element {
    const opposites: Record<Element, Element> = {
      fire: 'water',
      earth: 'air',
      air: 'earth',
      water: 'fire'
    };
    return opposites[element];
  }

  private getSignByElement(element: Element): ZodiacSign {
    const signs = this.getSignNamesByElement(element);
    return ZodiacSign.fromName(signs[0]);
  }

  private analyzeAspect(
    sign1: ZodiacSign,
    sign2: ZodiacSign,
    planet1: string,
    planet2: string,
    meaning: string
  ): SynastryAspect {
    const aspect = sign1.getCompatibilityWith(sign2);
    return {
      planet1,
      planet2,
      aspect,
      meaning,
      isHarmonious: ['trine', 'sextile', 'conjunction'].includes(aspect),
      description: this.getAspectDescription(aspect, planet1, planet2)
    };
  }

  private getAspectDescription(aspect: AspectType, p1: string, p2: string): string {
    const descriptions: Record<AspectType, string> = {
      conjunction: `${p1} and ${p2} merge energies intensely`,
      trine: `${p1} and ${p2} flow together harmoniously`,
      sextile: `${p1} and ${p2} complement each other well`,
      square: `${p1} and ${p2} create dynamic tension`,
      opposition: `${p1} and ${p2} balance through polarity`,
      none: `${p1} and ${p2} operate independently`
    };
    return descriptions[aspect];
  }

  private derivePersonalityTraits(sun: ZodiacSign, moon: ZodiacSign): string[] {
    return [...sun.coreTraits.slice(0, 3), ...moon.coreTraits.slice(0, 2)];
  }

  private deriveCommunicationStyle(sun: ZodiacSign, moon: ZodiacSign): string {
    return `${sun.communicationStyle} with ${moon.emotionalStyle.toLowerCase()}`;
  }

  private deriveIntimacyStyle(venus: ZodiacSign, mars: ZodiacSign): string {
    return `${venus.loveLanguage} expressed through ${mars.passionStyle.toLowerCase()}`;
  }

  private identifyThemes(aspects: SynastryAspect[]): string[] {
    const themes: string[] = [];
    const harmonious = aspects.filter(a => a.isHarmonious).length;
    if (harmonious >= 4) themes.push('Strong natural harmony');
    if (harmonious <= 2) themes.push('Growth through challenges');
    return themes;
  }

  private identifyGrowthAreas(aspects: SynastryAspect[]): string[] {
    return aspects
      .filter(a => !a.isHarmonious)
      .map(a => a.meaning);
  }
}

interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspect: AspectType;
  meaning: string;
  isHarmonious: boolean;
  description: string;
}

interface SynastryReport {
  aspects: SynastryAspect[];
  overallScore: CompatibilityScore;
  relationshipThemes: string[];
  growthAreas: string[];
}
```

### TransitService

```typescript
// packages/cosmic-companion/src/domain/services/TransitService.ts

import { ZodiacSign, ZodiacSignName } from '../value-objects/ZodiacSign';
import { BirthChart } from '../entities/BirthChart';

export interface PlanetaryTransit {
  planet: Planet;
  sign: ZodiacSign;
  isRetrograde: boolean;
  degree: number;
}

export interface TransitContext {
  currentMoonPhase: MoonPhase;
  currentTransits: PlanetaryTransit[];
  significantAspects: TransitAspect[];
  personalImpacts: PersonalTransitImpact[];
}

export type Planet =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export type MoonPhase =
  | 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full_moon' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

interface TransitAspect {
  transitPlanet: Planet;
  natalPlanet: string;
  aspect: AspectType;
  description: string;
  influence: 'positive' | 'challenging' | 'neutral';
}

interface PersonalTransitImpact {
  area: 'love' | 'communication' | 'passion' | 'emotions' | 'growth';
  impact: string;
  duration: string;
  advice: string;
}

/**
 * Domain service for astrological transit calculations
 * Pure business logic for transit-aware companion behavior
 */
export class TransitService {
  /**
   * Generate conversation context based on current transits
   */
  generateTransitContext(
    userChart: BirthChart,
    currentTransits: PlanetaryTransit[],
    moonPhase: MoonPhase
  ): TransitContext {
    const significantAspects = this.findSignificantAspects(userChart, currentTransits);
    const personalImpacts = this.analyzePersonalImpacts(userChart, currentTransits, moonPhase);

    return {
      currentMoonPhase: moonPhase,
      currentTransits,
      significantAspects,
      personalImpacts
    };
  }

  /**
   * Generate transit-aware conversation opener
   */
  generateTransitGreeting(context: TransitContext, userChart: BirthChart): string {
    const greetings: string[] = [];

    // Moon phase greeting
    if (context.currentMoonPhase === 'full_moon') {
      const moonInSign = context.currentTransits.find(t => t.planet === 'moon')?.sign;
      if (moonInSign?.equals(userChart.sunSign)) {
        greetings.push(`The full moon in your sign tonight amplifies your energy beautifully.`);
      } else if (moonInSign?.equals(userChart.moonSign)) {
        greetings.push(`With the full moon touching your Moon sign, your emotions run deep tonight.`);
      } else {
        greetings.push(`The full moon energy is potent tonight. How are you feeling?`);
      }
    }

    // Mercury retrograde awareness
    const mercury = context.currentTransits.find(t => t.planet === 'mercury');
    if (mercury?.isRetrograde) {
      greetings.push(`Mercury retrograde has us all reflecting. Perfect time for deep conversation.`);
    }

    // Venus transit for love signs
    const venus = context.currentTransits.find(t => t.planet === 'venus');
    if (venus?.sign.equals(userChart.venusSign)) {
      greetings.push(`Venus returning to your Venus sign - this is your time for love and pleasure.`);
    }

    return greetings.length > 0
      ? greetings[Math.floor(Math.random() * greetings.length)]
      : this.getGenericTransitGreeting(context.currentMoonPhase);
  }

  /**
   * Get intimacy forecast based on transits
   */
  getIntimacyForecast(
    userChart: BirthChart,
    currentTransits: PlanetaryTransit[],
    days: number = 7
  ): IntimacyForecast {
    const mars = currentTransits.find(t => t.planet === 'mars');
    const venus = currentTransits.find(t => t.planet === 'venus');

    const marsInfluence = mars ? this.calculatePlanetaryInfluence(mars, userChart.marsSign) : 50;
    const venusInfluence = venus ? this.calculatePlanetaryInfluence(venus, userChart.venusSign) : 50;

    const overallEnergy = (marsInfluence + venusInfluence) / 2;

    return {
      energyLevel: this.categorizeEnergy(overallEnergy),
      bestDays: this.calculateBestDays(userChart, currentTransits, days),
      themes: this.identifyIntimacyThemes(mars, venus, userChart),
      advice: this.generateIntimacyAdvice(overallEnergy, mars, venus)
    };
  }

  private findSignificantAspects(
    chart: BirthChart,
    transits: PlanetaryTransit[]
  ): TransitAspect[] {
    const aspects: TransitAspect[] = [];

    for (const transit of transits) {
      // Check transit to natal Sun
      const sunAspect = transit.sign.getCompatibilityWith(chart.sunSign);
      if (sunAspect !== 'none') {
        aspects.push({
          transitPlanet: transit.planet,
          natalPlanet: 'Sun',
          aspect: sunAspect,
          description: this.describeTransitAspect(transit.planet, 'Sun', sunAspect),
          influence: this.categorizeInfluence(sunAspect)
        });
      }

      // Check transit to natal Venus (for love matters)
      const venusAspect = transit.sign.getCompatibilityWith(chart.venusSign);
      if (venusAspect !== 'none' && ['venus', 'mars', 'moon'].includes(transit.planet)) {
        aspects.push({
          transitPlanet: transit.planet,
          natalPlanet: 'Venus',
          aspect: venusAspect,
          description: this.describeTransitAspect(transit.planet, 'Venus', venusAspect),
          influence: this.categorizeInfluence(venusAspect)
        });
      }
    }

    return aspects;
  }

  private analyzePersonalImpacts(
    chart: BirthChart,
    transits: PlanetaryTransit[],
    moonPhase: MoonPhase
  ): PersonalTransitImpact[] {
    const impacts: PersonalTransitImpact[] = [];

    // Moon phase impact
    impacts.push({
      area: 'emotions',
      impact: this.getMoonPhaseImpact(moonPhase, chart.moonSign),
      duration: 'Next 3-4 days',
      advice: this.getMoonPhaseAdvice(moonPhase)
    });

    // Check for Venus transits (love)
    const venus = transits.find(t => t.planet === 'venus');
    if (venus) {
      impacts.push({
        area: 'love',
        impact: this.getVenusImpact(venus, chart.venusSign),
        duration: 'Next 3-4 weeks',
        advice: this.getVenusAdvice(venus, chart.venusSign)
      });
    }

    // Check for Mars transits (passion)
    const mars = transits.find(t => t.planet === 'mars');
    if (mars) {
      impacts.push({
        area: 'passion',
        impact: this.getMarsImpact(mars, chart.marsSign),
        duration: 'Next 6-7 weeks',
        advice: this.getMarsAdvice(mars, chart.marsSign)
      });
    }

    return impacts;
  }

  private calculatePlanetaryInfluence(transit: PlanetaryTransit, natalSign: ZodiacSign): number {
    const aspect = transit.sign.getCompatibilityWith(natalSign);
    const baseScore: Record<AspectType, number> = {
      conjunction: 90,
      trine: 85,
      sextile: 75,
      opposition: 60,
      square: 50,
      none: 40
    };

    let score = baseScore[aspect];
    if (transit.isRetrograde) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private categorizeEnergy(score: number): 'high' | 'moderate' | 'low' {
    if (score >= 75) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }

  private calculateBestDays(
    chart: BirthChart,
    transits: PlanetaryTransit[],
    days: number
  ): number[] {
    // Simplified: return days when moon aspects are favorable
    const bestDays: number[] = [];
    const moon = transits.find(t => t.planet === 'moon');

    if (moon) {
      const moonAspect = moon.sign.getCompatibilityWith(chart.venusSign);
      if (['trine', 'sextile', 'conjunction'].includes(moonAspect)) {
        bestDays.push(1, 2); // First couple days are good
      }
    }

    return bestDays.length > 0 ? bestDays : [3, 7]; // Default to mid-week
  }

  private identifyIntimacyThemes(
    mars: PlanetaryTransit | undefined,
    venus: PlanetaryTransit | undefined,
    chart: BirthChart
  ): string[] {
    const themes: string[] = [];

    if (mars?.sign.element === 'fire') {
      themes.push('Passionate, spontaneous energy');
    } else if (mars?.sign.element === 'water') {
      themes.push('Deep emotional connection');
    }

    if (venus?.sign.element === chart.venusSign.element) {
      themes.push('Harmonious romantic flow');
    }

    return themes;
  }

  private generateIntimacyAdvice(
    energy: number,
    mars?: PlanetaryTransit,
    venus?: PlanetaryTransit
  ): string {
    if (energy >= 80) {
      return 'The stars strongly favor intimacy. Express your desires freely.';
    } else if (energy >= 60) {
      return 'Good energy for connection. Focus on emotional presence.';
    } else {
      return mars?.isRetrograde
        ? 'Retrograde energy suggests revisiting what works rather than trying new things.'
        : 'Take it slow and prioritize emotional connection over physical.';
    }
  }

  private getGenericTransitGreeting(phase: MoonPhase): string {
    const greetings: Record<MoonPhase, string> = {
      new_moon: 'A new moon brings fresh beginnings. What intentions are you setting?',
      waxing_crescent: 'The moon grows, and so does possibility. What are you nurturing?',
      first_quarter: 'Half-lit moon, time for decisions. What calls to you tonight?',
      waxing_gibbous: 'Almost full, the energy builds. Can you feel it?',
      full_moon: 'Full moon magic is in the air. Your emotions run deep tonight.',
      waning_gibbous: 'Time to release what no longer serves. What are you letting go?',
      last_quarter: 'Reflection time. What have you learned this cycle?',
      waning_crescent: 'Rest before renewal. Be gentle with yourself.'
    };
    return greetings[phase];
  }

  private describeTransitAspect(planet: Planet, natal: string, aspect: AspectType): string {
    return `Transit ${planet} ${aspect} natal ${natal}`;
  }

  private categorizeInfluence(aspect: AspectType): 'positive' | 'challenging' | 'neutral' {
    if (['trine', 'sextile'].includes(aspect)) return 'positive';
    if (['square', 'opposition'].includes(aspect)) return 'challenging';
    return 'neutral';
  }

  private getMoonPhaseImpact(phase: MoonPhase, moonSign: ZodiacSign): string {
    return `${phase.replace('_', ' ')} affecting your ${moonSign.name} Moon`;
  }

  private getMoonPhaseAdvice(phase: MoonPhase): string {
    if (phase.includes('full')) return 'Honor your heightened emotions';
    if (phase.includes('new')) return 'Set intentions for the cycle ahead';
    return 'Flow with the lunar rhythm';
  }

  private getVenusImpact(venus: PlanetaryTransit, natalVenus: ZodiacSign): string {
    return `Venus in ${venus.sign.name} ${venus.sign.getCompatibilityWith(natalVenus)} your Venus`;
  }

  private getVenusAdvice(venus: PlanetaryTransit, natalVenus: ZodiacSign): string {
    const aspect = venus.sign.getCompatibilityWith(natalVenus);
    if (aspect === 'conjunction') return 'Your Venus return - embrace self-love and pleasure';
    if (['trine', 'sextile'].includes(aspect)) return 'Romance flows easily - be open to connection';
    return 'Love lessons are available - stay present';
  }

  private getMarsImpact(mars: PlanetaryTransit, natalMars: ZodiacSign): string {
    return `Mars in ${mars.sign.name} ${mars.sign.getCompatibilityWith(natalMars)} your Mars`;
  }

  private getMarsAdvice(mars: PlanetaryTransit, natalMars: ZodiacSign): string {
    const aspect = mars.sign.getCompatibilityWith(natalMars);
    if (['trine', 'conjunction'].includes(aspect)) return 'Passion runs high - channel energy wisely';
    return 'Direct your energy consciously';
  }
}

interface IntimacyForecast {
  energyLevel: 'high' | 'moderate' | 'low';
  bestDays: number[];
  themes: string[];
  advice: string;
}
```

---

## 1.4 Repository Interfaces

### IBirthChartRepository

```typescript
// packages/cosmic-companion/src/domain/repositories/IBirthChartRepository.ts

import { BirthChart } from '../entities/BirthChart';

export interface CreateBirthChartDTO {
  userId: string;
  birthDate: Date;
  birthTime: string;
  birthLocation: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    timezone: string;
  };
}

export interface IBirthChartRepository {
  /**
   * Find birth chart by ID
   */
  findById(id: string): Promise<BirthChart | null>;

  /**
   * Find birth chart by user ID
   */
  findByUserId(userId: string): Promise<BirthChart | null>;

  /**
   * Create a new birth chart
   */
  create(data: CreateBirthChartDTO): Promise<BirthChart>;

  /**
   * Update birth chart
   */
  update(id: string, data: Partial<CreateBirthChartDTO>): Promise<BirthChart>;

  /**
   * Delete birth chart
   */
  delete(id: string): Promise<void>;
}
```

### ICompanionRepository

```typescript
// packages/cosmic-companion/src/domain/repositories/ICompanionRepository.ts

import { Companion, RelationshipType } from '../entities/Companion';
import { ZodiacPersonality } from '../value-objects/ZodiacPersonality';
import { AppearanceConfig } from '../value-objects/AppearanceConfig';
import { VoiceConfig } from '../value-objects/VoiceConfig';
import { PersonalitySliders } from '../value-objects/PersonalitySliders';

export interface CreateCompanionDTO {
  userId: string;
  name: string;
  relationshipType: RelationshipType;
  zodiacPersonality: ZodiacPersonality;
  appearanceConfig: AppearanceConfig;
  voiceConfig: VoiceConfig;
  personalitySliders: PersonalitySliders;
  compatibilityScore: number;
}

export interface UpdateCompanionDTO {
  name?: string;
  relationshipType?: RelationshipType;
  appearanceConfig?: AppearanceConfig;
  voiceConfig?: VoiceConfig;
  personalitySliders?: PersonalitySliders;
  isActive?: boolean;
}

export interface CompanionQueryOptions {
  userId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ICompanionRepository {
  /**
   * Find companion by ID
   */
  findById(id: string): Promise<Companion | null>;

  /**
   * Find all companions for a user
   */
  findByUserId(userId: string): Promise<Companion[]>;

  /**
   * Find active companion for user
   */
  findActiveByUserId(userId: string): Promise<Companion | null>;

  /**
   * Count companions for user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Create new companion
   */
  create(data: CreateCompanionDTO): Promise<Companion>;

  /**
   * Update companion
   */
  update(id: string, data: UpdateCompanionDTO): Promise<Companion>;

  /**
   * Delete companion
   */
  delete(id: string): Promise<void>;

  /**
   * Set companion as active (deactivates others)
   */
  setActive(id: string, userId: string): Promise<void>;
}
```

### IMemoryRepository

```typescript
// packages/cosmic-companion/src/domain/repositories/IMemoryRepository.ts

import { Memory, MemoryTier, MemoryCategory } from '../entities/Memory';

export interface CreateMemoryDTO {
  userId: string;
  companionId: string;
  tier: MemoryTier;
  category: MemoryCategory;
  content: string;
  importance: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryQueryOptions {
  userId?: string;
  companionId?: string;
  tier?: MemoryTier;
  category?: MemoryCategory;
  minImportance?: number;
  excludeExpired?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'importance' | 'lastAccessed' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface IMemoryRepository {
  /**
   * Find memory by ID
   */
  findById(id: string): Promise<Memory | null>;

  /**
   * Find memories matching query
   */
  findMany(options: MemoryQueryOptions): Promise<Memory[]>;

  /**
   * Find most relevant memories for context building
   */
  findRelevant(
    userId: string,
    companionId: string,
    limit: number
  ): Promise<Memory[]>;

  /**
   * Create new memory
   */
  create(data: CreateMemoryDTO): Promise<Memory>;

  /**
   * Update memory (e.g., record access, promote tier)
   */
  update(id: string, data: Partial<CreateMemoryDTO>): Promise<Memory>;

  /**
   * Record memory access
   */
  recordAccess(id: string): Promise<void>;

  /**
   * Delete memory
   */
  delete(id: string): Promise<void>;

  /**
   * Delete expired memories
   */
  deleteExpired(): Promise<number>;

  /**
   * Promote memories that meet criteria
   */
  promoteEligibleMemories(userId: string, companionId: string): Promise<number>;
}
```

### IAgeVerificationRepository

```typescript
// packages/cosmic-companion/src/domain/repositories/IAgeVerificationRepository.ts

import { AgeVerification, VerificationMethod, VerificationStatus } from '../entities/AgeVerification';

export interface CreateVerificationDTO {
  userId: string;
  method: VerificationMethod;
}

export interface IAgeVerificationRepository {
  /**
   * Find verification by ID
   */
  findById(id: string): Promise<AgeVerification | null>;

  /**
   * Find verification by user ID
   */
  findByUserId(userId: string): Promise<AgeVerification | null>;

  /**
   * Find verifications by status
   */
  findByStatus(status: VerificationStatus): Promise<AgeVerification[]>;

  /**
   * Create verification record
   */
  create(data: CreateVerificationDTO): Promise<AgeVerification>;

  /**
   * Update verification status
   */
  update(
    id: string,
    status: VerificationStatus,
    externalId?: string
  ): Promise<AgeVerification>;

  /**
   * Check if user has valid verification
   */
  hasValidVerification(userId: string): Promise<boolean>;
}
```

### IGeneratedImageRepository

```typescript
// packages/cosmic-companion/src/domain/repositories/IGeneratedImageRepository.ts

export interface GeneratedImage {
  id: string;
  userId: string;
  companionId: string;
  promptUsed: string;
  imageUrl: string;
  thumbnailUrl: string;
  isNSFW: boolean;
  zodiacAesthetic: ZodiacSignName;
  style: ImageStyle;
  createdAt: Date;
  expiresAt: Date | null;
}

export type ImageStyle =
  | 'portrait'
  | 'lingerie'
  | 'artistic_nude'
  | 'scenario'
  | 'custom';

export interface CreateImageDTO {
  userId: string;
  companionId: string;
  promptUsed: string;
  imageUrl: string;
  thumbnailUrl: string;
  isNSFW: boolean;
  zodiacAesthetic: ZodiacSignName;
  style: ImageStyle;
}

export interface ImageQueryOptions {
  userId?: string;
  companionId?: string;
  isNSFW?: boolean;
  style?: ImageStyle;
  limit?: number;
  offset?: number;
}

export interface IGeneratedImageRepository {
  findById(id: string): Promise<GeneratedImage | null>;
  findMany(options: ImageQueryOptions): Promise<GeneratedImage[]>;
  countByUserInPeriod(userId: string, startDate: Date, endDate: Date): Promise<number>;
  create(data: CreateImageDTO): Promise<GeneratedImage>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
```
