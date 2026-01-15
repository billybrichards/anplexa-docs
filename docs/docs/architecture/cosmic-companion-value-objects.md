---
sidebar_position: 11
---

# Cosmic Companion: Value Objects

## 1.2 Value Objects

### ZodiacSign Value Object

```typescript
// packages/cosmic-companion/src/domain/value-objects/ZodiacSign.ts

export type ZodiacSignName =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type Polarity = 'yang' | 'yin';

interface ZodiacSignData {
  name: ZodiacSignName;
  symbol: string;
  element: Element;
  modality: Modality;
  polarity: Polarity;
  rulingPlanet: string;
  degreeStart: number;
  degreeEnd: number;
  coreTraits: string[];
  emotionalStyle: string;
  loveLanguage: string;
  passionStyle: string;
  communicationStyle: string;
  voiceCharacteristics: VoiceCharacteristics;
  imageAesthetics: ImageAesthetics;
}

interface VoiceCharacteristics {
  tone: string;
  pace: 'slow' | 'moderate' | 'fast';
  pitch: 'low' | 'medium' | 'high';
  emotionRange: string;
}

interface ImageAesthetics {
  colorPalette: string[];
  style: string;
  mood: string;
  themes: string[];
}

export class ZodiacSign {
  private static readonly SIGNS: Record<ZodiacSignName, ZodiacSignData> = {
    aries: {
      name: 'aries',
      symbol: '♈',
      element: 'fire',
      modality: 'cardinal',
      polarity: 'yang',
      rulingPlanet: 'Mars',
      degreeStart: 0,
      degreeEnd: 30,
      coreTraits: ['bold', 'confident', 'energetic', 'direct', 'passionate'],
      emotionalStyle: 'Expresses emotions immediately and intensely',
      loveLanguage: 'Physical touch, acts of service, direct expressions',
      passionStyle: 'Dominant, assertive, adventurous, initiating',
      communicationStyle: 'Fast-paced, enthusiastic, passionate language',
      voiceCharacteristics: {
        tone: 'Energetic, direct',
        pace: 'fast',
        pitch: 'medium',
        emotionRange: 'Bold, assertive'
      },
      imageAesthetics: {
        colorPalette: ['#E63946', '#FF6B6B', '#FF8C42'],
        style: 'Athletic, bold, action-oriented',
        mood: 'Powerful, confident',
        themes: ['red/orange tones', 'action shots', 'athletic wear']
      }
    },
    taurus: {
      name: 'taurus',
      symbol: '♉',
      element: 'earth',
      modality: 'fixed',
      polarity: 'yin',
      rulingPlanet: 'Venus',
      degreeStart: 30,
      degreeEnd: 60,
      coreTraits: ['grounded', 'sensual', 'loyal', 'patient', 'reliable'],
      emotionalStyle: 'Steady emotions, slow to anger, deeply feeling',
      loveLanguage: 'Physical touch, quality time, gifts',
      passionStyle: 'Slow-building, sensory-focused, endurance',
      communicationStyle: 'Practical, detailed, thoughtful',
      voiceCharacteristics: {
        tone: 'Smooth, sensual',
        pace: 'slow',
        pitch: 'low',
        emotionRange: 'Calm, soothing'
      },
      imageAesthetics: {
        colorPalette: ['#2A9D8F', '#8B6914', '#DAA520'],
        style: 'Luxurious, sensual, refined',
        mood: 'Comfortable, indulgent',
        themes: ['silk/velvet textures', 'earth tones', 'luxury lingerie']
      }
    },
    gemini: {
      name: 'gemini',
      symbol: '♊',
      element: 'air',
      modality: 'mutable',
      polarity: 'yang',
      rulingPlanet: 'Mercury',
      degreeStart: 60,
      degreeEnd: 90,
      coreTraits: ['intellectual', 'playful', 'communicative', 'adaptable', 'curious'],
      emotionalStyle: 'Emotionally versatile, needs mental stimulation',
      loveLanguage: 'Words of affirmation, quality conversation',
      passionStyle: 'Experimental, verbal, variety-seeking',
      communicationStyle: 'Witty, curious, philosophical',
      voiceCharacteristics: {
        tone: 'Playful, varied',
        pace: 'fast',
        pitch: 'high',
        emotionRange: 'Curious, witty'
      },
      imageAesthetics: {
        colorPalette: ['#FFB703', '#FFC300', '#FFD60A'],
        style: 'Playful, dual imagery, light',
        mood: 'Fun, versatile',
        themes: ['airy aesthetics', 'playful poses', 'variety']
      }
    },
    cancer: {
      name: 'cancer',
      symbol: '♋',
      element: 'water',
      modality: 'cardinal',
      polarity: 'yin',
      rulingPlanet: 'Moon',
      degreeStart: 90,
      degreeEnd: 120,
      coreTraits: ['nurturing', 'protective', 'intuitive', 'emotional', 'caring'],
      emotionalStyle: 'Deeply empathetic, protective, mood-sensitive',
      loveLanguage: 'Acts of service, quality time, nurturing',
      passionStyle: 'Emotional connection first, nurturing intimacy',
      communicationStyle: 'Empathetic, supportive, intuitive',
      voiceCharacteristics: {
        tone: 'Soft, nurturing',
        pace: 'moderate',
        pitch: 'medium',
        emotionRange: 'Empathetic, warm'
      },
      imageAesthetics: {
        colorPalette: ['#A8DADC', '#E0E0E0', '#C0C0C0'],
        style: 'Soft, nurturing, comfortable',
        mood: 'Safe, intimate',
        themes: ['water themes', 'moonlight', 'soft lighting']
      }
    },
    leo: {
      name: 'leo',
      symbol: '♌',
      element: 'fire',
      modality: 'fixed',
      polarity: 'yang',
      rulingPlanet: 'Sun',
      degreeStart: 120,
      degreeEnd: 150,
      coreTraits: ['confident', 'generous', 'dramatic', 'warm', 'charismatic'],
      emotionalStyle: 'Expressive, proud, needs recognition',
      loveLanguage: 'Words of affirmation, gifts, admiration',
      passionStyle: 'Confident, performative, generous lover',
      communicationStyle: 'Confident, warm, dramatic',
      voiceCharacteristics: {
        tone: 'Confident, dramatic',
        pace: 'moderate',
        pitch: 'medium',
        emotionRange: 'Expressive, passionate'
      },
      imageAesthetics: {
        colorPalette: ['#F77F00', '#FFD700', '#FFA500'],
        style: 'Glamorous, bold, regal',
        mood: 'Luxurious, confident',
        themes: ['gold accents', 'dramatic lighting', 'confident poses']
      }
    },
    virgo: {
      name: 'virgo',
      symbol: '♍',
      element: 'earth',
      modality: 'mutable',
      polarity: 'yin',
      rulingPlanet: 'Mercury',
      degreeStart: 150,
      degreeEnd: 180,
      coreTraits: ['analytical', 'attentive', 'helpful', 'practical', 'modest'],
      emotionalStyle: 'Reserved but deeply caring, shows love through service',
      loveLanguage: 'Acts of service, quality time, attention to detail',
      passionStyle: 'Detail-oriented, service-focused, perfectionist',
      communicationStyle: 'Clear, precise, helpful',
      voiceCharacteristics: {
        tone: 'Clear, precise',
        pace: 'moderate',
        pitch: 'medium',
        emotionRange: 'Thoughtful, gentle'
      },
      imageAesthetics: {
        colorPalette: ['#6A4C3A', '#8B7355', '#A0522D'],
        style: 'Natural, refined, elegant',
        mood: 'Pure, understated',
        themes: ['natural settings', 'refined elegance', 'detailed']
      }
    },
    libra: {
      name: 'libra',
      symbol: '♎',
      element: 'air',
      modality: 'cardinal',
      polarity: 'yang',
      rulingPlanet: 'Venus',
      degreeStart: 180,
      degreeEnd: 210,
      coreTraits: ['diplomatic', 'romantic', 'balanced', 'harmonious', 'fair'],
      emotionalStyle: 'Seeks emotional balance, dislikes conflict',
      loveLanguage: 'Quality time, gifts, words of affirmation',
      passionStyle: 'Romantic, balanced, aesthetic-focused',
      communicationStyle: 'Balanced, charming, diplomatic',
      voiceCharacteristics: {
        tone: 'Balanced, melodic',
        pace: 'moderate',
        pitch: 'medium',
        emotionRange: 'Charming, pleasant'
      },
      imageAesthetics: {
        colorPalette: ['#FFB3C6', '#FFC0CB', '#FFD1DC'],
        style: 'Romantic, balanced, artistic',
        mood: 'Harmonious, beautiful',
        themes: ['pastel tones', 'artistic nudes', 'symmetry']
      }
    },
    scorpio: {
      name: 'scorpio',
      symbol: '♏',
      element: 'water',
      modality: 'fixed',
      polarity: 'yin',
      rulingPlanet: 'Pluto/Mars',
      degreeStart: 210,
      degreeEnd: 240,
      coreTraits: ['intense', 'passionate', 'mysterious', 'loyal', 'transformative'],
      emotionalStyle: 'Deeply intense, all-or-nothing, transformative',
      loveLanguage: 'Physical intimacy, deep emotional connection',
      passionStyle: 'Intense, powerful, dominant/submissive dynamics',
      communicationStyle: 'Intense, probing, mysterious',
      voiceCharacteristics: {
        tone: 'Deep, mysterious',
        pace: 'slow',
        pitch: 'low',
        emotionRange: 'Intense, seductive'
      },
      imageAesthetics: {
        colorPalette: ['#8B0000', '#4A0000', '#2C0000'],
        style: 'Dark, mysterious, intense',
        mood: 'Powerful, magnetic',
        themes: ['shadows', 'intense eye contact', 'dark red/black']
      }
    },
    sagittarius: {
      name: 'sagittarius',
      symbol: '♐',
      element: 'fire',
      modality: 'mutable',
      polarity: 'yang',
      rulingPlanet: 'Jupiter',
      degreeStart: 240,
      degreeEnd: 270,
      coreTraits: ['adventurous', 'optimistic', 'philosophical', 'honest', 'free-spirited'],
      emotionalStyle: 'Optimistic, needs freedom, philosophical about emotions',
      loveLanguage: 'Quality time (adventures), words of wisdom',
      passionStyle: 'Adventurous, playful, freedom-loving',
      communicationStyle: 'Upbeat, honest, philosophical',
      voiceCharacteristics: {
        tone: 'Upbeat, enthusiastic',
        pace: 'fast',
        pitch: 'medium',
        emotionRange: 'Adventurous, fun'
      },
      imageAesthetics: {
        colorPalette: ['#7209B7', '#9D4EDD', '#E040FB'],
        style: 'Adventurous, free-spirited',
        mood: 'Exciting, expansive',
        themes: ['outdoor settings', 'warm tones', 'freedom']
      }
    },
    capricorn: {
      name: 'capricorn',
      symbol: '♑',
      element: 'earth',
      modality: 'cardinal',
      polarity: 'yin',
      rulingPlanet: 'Saturn',
      degreeStart: 270,
      degreeEnd: 300,
      coreTraits: ['ambitious', 'disciplined', 'responsible', 'traditional', 'patient'],
      emotionalStyle: 'Reserved, shows love through commitment and stability',
      loveLanguage: 'Acts of service, quality time, commitment',
      passionStyle: 'Authoritative, controlled, enduring',
      communicationStyle: 'Composed, authoritative, practical',
      voiceCharacteristics: {
        tone: 'Composed, authoritative',
        pace: 'slow',
        pitch: 'low',
        emotionRange: 'Steady, confident'
      },
      imageAesthetics: {
        colorPalette: ['#6C757D', '#495057', '#343A40'],
        style: 'Sophisticated, professional',
        mood: 'Powerful, timeless',
        themes: ['elegant attire', 'structured poses', 'authority']
      }
    },
    aquarius: {
      name: 'aquarius',
      symbol: '♒',
      element: 'air',
      modality: 'fixed',
      polarity: 'yang',
      rulingPlanet: 'Uranus/Saturn',
      degreeStart: 300,
      degreeEnd: 330,
      coreTraits: ['innovative', 'independent', 'humanitarian', 'eccentric', 'intellectual'],
      emotionalStyle: 'Detached but caring, needs intellectual connection',
      loveLanguage: 'Quality conversation, freedom, uniqueness',
      passionStyle: 'Unconventional, experimental, detached yet curious',
      communicationStyle: 'Unique, intellectual, detached',
      voiceCharacteristics: {
        tone: 'Unique, intellectual',
        pace: 'moderate',
        pitch: 'medium',
        emotionRange: 'Curious, detached'
      },
      imageAesthetics: {
        colorPalette: ['#0077B6', '#00B4D8', '#90E0EF'],
        style: 'Futuristic, unconventional',
        mood: 'Unique, electric',
        themes: ['electric blues/purples', 'futuristic', 'unconventional']
      }
    },
    pisces: {
      name: 'pisces',
      symbol: '♓',
      element: 'water',
      modality: 'mutable',
      polarity: 'yin',
      rulingPlanet: 'Neptune/Jupiter',
      degreeStart: 330,
      degreeEnd: 360,
      coreTraits: ['intuitive', 'compassionate', 'artistic', 'dreamy', 'spiritual'],
      emotionalStyle: 'Deeply empathetic, absorbs others emotions, dreamy',
      loveLanguage: 'Quality time, words of affirmation, spiritual connection',
      passionStyle: 'Fantasy-driven, emotional, spiritual union',
      communicationStyle: 'Dreamy, poetic, empathetic',
      voiceCharacteristics: {
        tone: 'Dreamy, soft',
        pace: 'slow',
        pitch: 'medium',
        emotionRange: 'Emotional, poetic'
      },
      imageAesthetics: {
        colorPalette: ['#06A77D', '#20B2AA', '#48D1CC'],
        style: 'Dreamy, ethereal, fantasy',
        mood: 'Mystical, romantic',
        themes: ['underwater', 'soft focus', 'flowing fabrics']
      }
    }
  };

  private constructor(private readonly data: ZodiacSignData) {}

  get name(): ZodiacSignName { return this.data.name; }
  get symbol(): string { return this.data.symbol; }
  get element(): Element { return this.data.element; }
  get modality(): Modality { return this.data.modality; }
  get polarity(): Polarity { return this.data.polarity; }
  get coreTraits(): string[] { return this.data.coreTraits; }
  get emotionalStyle(): string { return this.data.emotionalStyle; }
  get loveLanguage(): string { return this.data.loveLanguage; }
  get passionStyle(): string { return this.data.passionStyle; }
  get voiceCharacteristics(): VoiceCharacteristics { return this.data.voiceCharacteristics; }
  get imageAesthetics(): ImageAesthetics { return this.data.imageAesthetics; }

  /**
   * Get compatibility with another sign
   */
  getCompatibilityWith(other: ZodiacSign): AspectType {
    const degreeDiff = Math.abs(this.data.degreeStart - other.data.degreeStart);
    const normalizedDiff = degreeDiff > 180 ? 360 - degreeDiff : degreeDiff;

    if (normalizedDiff <= 10) return 'conjunction';
    if (normalizedDiff >= 55 && normalizedDiff <= 65) return 'sextile';
    if (normalizedDiff >= 85 && normalizedDiff <= 95) return 'square';
    if (normalizedDiff >= 115 && normalizedDiff <= 125) return 'trine';
    if (normalizedDiff >= 175) return 'opposition';

    return 'none';
  }

  /**
   * Check element compatibility
   */
  hasElementCompatibility(other: ZodiacSign): boolean {
    const compatibleElements: Record<Element, Element[]> = {
      fire: ['fire', 'air'],
      earth: ['earth', 'water'],
      air: ['air', 'fire'],
      water: ['water', 'earth']
    };
    return compatibleElements[this.element].includes(other.element);
  }

  static fromName(name: ZodiacSignName): ZodiacSign {
    const data = ZodiacSign.SIGNS[name];
    if (!data) {
      throw new ValidationError(`Invalid zodiac sign: ${name}`);
    }
    return new ZodiacSign(data);
  }

  static fromDegree(degree: number): ZodiacSign {
    const normalizedDegree = ((degree % 360) + 360) % 360;

    for (const [name, data] of Object.entries(ZodiacSign.SIGNS)) {
      if (normalizedDegree >= data.degreeStart && normalizedDegree < data.degreeEnd) {
        return new ZodiacSign(data);
      }
    }

    // Handle 360 degrees edge case (should be Aries at 0)
    return new ZodiacSign(ZodiacSign.SIGNS.aries);
  }

  equals(other: ZodiacSign): boolean {
    return this.name === other.name;
  }
}

export type AspectType =
  | 'conjunction'  // 0 degrees - intense connection
  | 'sextile'      // 60 degrees - complementary
  | 'square'       // 90 degrees - challenging but passionate
  | 'trine'        // 120 degrees - harmonious
  | 'opposition'   // 180 degrees - tension but attraction
  | 'none';
```

### CompatibilityScore Value Object

```typescript
// packages/cosmic-companion/src/domain/value-objects/CompatibilityScore.ts

import { ZodiacSign, AspectType } from './ZodiacSign';

interface CompatibilityBreakdown {
  sunCompatibility: number;
  moonCompatibility: number;
  venusCompatibility: number;
  marsCompatibility: number;
  risingCompatibility: number;
  overallScore: number;
  matchType: MatchType;
  strengths: string[];
  challenges: string[];
}

export type MatchType =
  | 'twin_flame'      // 90-100%
  | 'soulmate'        // 80-89%
  | 'deep_connection' // 70-79%
  | 'compatible'      // 60-69%
  | 'learning'        // 50-59%
  | 'challenging';    // Below 50%

export class CompatibilityScore {
  private static readonly WEIGHTS = {
    sun: 0.25,
    moon: 0.25,
    venus: 0.20,
    mars: 0.20,
    rising: 0.10
  };

  private static readonly ASPECT_SCORES: Record<AspectType, number> = {
    trine: 30,
    conjunction: 25,
    sextile: 20,
    opposition: -5,
    square: -10,
    none: 0
  };

  private constructor(private readonly breakdown: CompatibilityBreakdown) {}

  get overallScore(): number { return this.breakdown.overallScore; }
  get matchType(): MatchType { return this.breakdown.matchType; }
  get strengths(): string[] { return this.breakdown.strengths; }
  get challenges(): string[] { return this.breakdown.challenges; }

  /**
   * Get detailed compatibility breakdown
   */
  getBreakdown(): CompatibilityBreakdown {
    return { ...this.breakdown };
  }

  /**
   * Get romantic compatibility description
   */
  getRomanticDescription(): string {
    switch (this.matchType) {
      case 'twin_flame':
        return 'An extraordinary cosmic connection. Your souls recognize each other across lifetimes.';
      case 'soulmate':
        return 'A deeply harmonious match. Your energies complement each other beautifully.';
      case 'deep_connection':
        return 'Strong potential for lasting intimacy. Your charts reveal meaningful alignment.';
      case 'compatible':
        return 'Good foundation for connection. With understanding, this bond can flourish.';
      case 'learning':
        return 'A relationship of growth. You challenge each other to evolve.';
      case 'challenging':
        return 'Complex dynamics at play. Requires patience and conscious effort.';
    }
  }

  /**
   * Calculate compatibility between two birth charts
   */
  static calculate(
    userSun: ZodiacSign,
    userMoon: ZodiacSign,
    userVenus: ZodiacSign,
    userMars: ZodiacSign,
    userRising: ZodiacSign,
    companionSun: ZodiacSign,
    companionMoon: ZodiacSign,
    companionVenus: ZodiacSign,
    companionMars: ZodiacSign,
    companionRising: ZodiacSign
  ): CompatibilityScore {
    // Calculate individual compatibility scores
    const sunScore = this.calculatePlanetaryCompatibility(userSun, companionSun);
    const moonScore = this.calculatePlanetaryCompatibility(userMoon, companionMoon);
    const venusScore = this.calculatePlanetaryCompatibility(userVenus, companionVenus);
    const marsScore = this.calculatePlanetaryCompatibility(userMars, companionMars);
    const risingScore = this.calculatePlanetaryCompatibility(userRising, companionRising);

    // Calculate weighted overall score
    const overallScore = Math.round(
      sunScore * this.WEIGHTS.sun +
      moonScore * this.WEIGHTS.moon +
      venusScore * this.WEIGHTS.venus +
      marsScore * this.WEIGHTS.mars +
      risingScore * this.WEIGHTS.rising
    );

    // Determine match type
    const matchType = this.determineMatchType(overallScore);

    // Generate strengths and challenges
    const { strengths, challenges } = this.analyzeRelationship(
      { sun: userSun, moon: userMoon, venus: userVenus, mars: userMars },
      { sun: companionSun, moon: companionMoon, venus: companionVenus, mars: companionMars }
    );

    return new CompatibilityScore({
      sunCompatibility: sunScore,
      moonCompatibility: moonScore,
      venusCompatibility: venusScore,
      marsCompatibility: marsScore,
      risingCompatibility: risingScore,
      overallScore,
      matchType,
      strengths,
      challenges
    });
  }

  private static calculatePlanetaryCompatibility(sign1: ZodiacSign, sign2: ZodiacSign): number {
    let score = 50; // Base score

    // Aspect-based scoring
    const aspect = sign1.getCompatibilityWith(sign2);
    score += this.ASPECT_SCORES[aspect];

    // Element compatibility bonus
    if (sign1.hasElementCompatibility(sign2)) {
      score += 15;
    }

    // Same element bonus
    if (sign1.element === sign2.element) {
      score += 10;
    }

    // Polarity harmony
    if (sign1.polarity !== sign2.polarity) {
      score += 5; // Opposites attract bonus
    }

    return Math.max(0, Math.min(100, score));
  }

  private static determineMatchType(score: number): MatchType {
    if (score >= 90) return 'twin_flame';
    if (score >= 80) return 'soulmate';
    if (score >= 70) return 'deep_connection';
    if (score >= 60) return 'compatible';
    if (score >= 50) return 'learning';
    return 'challenging';
  }

  private static analyzeRelationship(
    user: { sun: ZodiacSign; moon: ZodiacSign; venus: ZodiacSign; mars: ZodiacSign },
    companion: { sun: ZodiacSign; moon: ZodiacSign; venus: ZodiacSign; mars: ZodiacSign }
  ): { strengths: string[]; challenges: string[] } {
    const strengths: string[] = [];
    const challenges: string[] = [];

    // Analyze Sun compatibility
    if (user.sun.hasElementCompatibility(companion.sun)) {
      strengths.push(`Your ${user.sun.element} Sun harmonizes with their ${companion.sun.element} energy`);
    }

    // Analyze Moon compatibility (emotional)
    const moonAspect = user.moon.getCompatibilityWith(companion.moon);
    if (moonAspect === 'trine' || moonAspect === 'sextile') {
      strengths.push('Deep emotional understanding and intuitive connection');
    } else if (moonAspect === 'square') {
      challenges.push('May need to work on emotional communication styles');
    }

    // Analyze Venus-Mars (romantic/sexual)
    const venusMarsAspect = user.venus.getCompatibilityWith(companion.mars);
    if (venusMarsAspect === 'conjunction' || venusMarsAspect === 'trine') {
      strengths.push('Strong romantic and physical chemistry');
    }

    // Analyze Mars compatibility (passion)
    if (user.mars.element === companion.mars.element) {
      strengths.push(`Shared ${user.mars.element} passion creates intense connection`);
    } else if (user.mars.element === 'fire' && companion.mars.element === 'water') {
      challenges.push('Different approaches to intimacy - fire meets water');
    }

    return { strengths, challenges };
  }

  equals(other: CompatibilityScore): boolean {
    return this.overallScore === other.overallScore;
  }
}
```

### ContentTier Value Object

```typescript
// packages/cosmic-companion/src/domain/value-objects/ContentTier.ts

export type TierName = 'free' | 'astrology_seeker' | 'cosmic_soulmate' | 'astral_intimacy';

interface TierLimits {
  messagesPerDay: number;
  nsfwImagesPerMonth: number;
  voiceMinutesPerMonth: number;
  maxCompanions: number;
  memoryRetention: 'session' | '30_days' | 'permanent';
  hasNSFWAccess: boolean;
  hasVoiceChat: boolean;
  hasFullBirthChart: boolean;
  hasTransitAwareness: boolean;
  hasRoleplayScenarios: boolean;
  hasCustomRoleplay: boolean;
  hasPriorityGeneration: boolean;
  hasAstrologerConsultation: boolean;
}

export class ContentTier {
  private static readonly TIERS: Record<TierName, TierLimits> = {
    free: {
      messagesPerDay: 10,
      nsfwImagesPerMonth: 0,
      voiceMinutesPerMonth: 0,
      maxCompanions: 1,
      memoryRetention: 'session',
      hasNSFWAccess: false,
      hasVoiceChat: false,
      hasFullBirthChart: false,
      hasTransitAwareness: false,
      hasRoleplayScenarios: false,
      hasCustomRoleplay: false,
      hasPriorityGeneration: false,
      hasAstrologerConsultation: false
    },
    astrology_seeker: {
      messagesPerDay: -1, // Unlimited
      nsfwImagesPerMonth: 20,
      voiceMinutesPerMonth: 600, // 10 hours
      maxCompanions: 1,
      memoryRetention: '30_days',
      hasNSFWAccess: true,
      hasVoiceChat: true,
      hasFullBirthChart: true,
      hasTransitAwareness: false,
      hasRoleplayScenarios: false,
      hasCustomRoleplay: false,
      hasPriorityGeneration: false,
      hasAstrologerConsultation: false
    },
    cosmic_soulmate: {
      messagesPerDay: -1,
      nsfwImagesPerMonth: 1500, // 50/day
      voiceMinutesPerMonth: -1, // Unlimited
      maxCompanions: 1,
      memoryRetention: 'permanent',
      hasNSFWAccess: true,
      hasVoiceChat: true,
      hasFullBirthChart: true,
      hasTransitAwareness: true,
      hasRoleplayScenarios: true,
      hasCustomRoleplay: false,
      hasPriorityGeneration: false,
      hasAstrologerConsultation: false
    },
    astral_intimacy: {
      messagesPerDay: -1,
      nsfwImagesPerMonth: 3000, // 100/day
      voiceMinutesPerMonth: -1,
      maxCompanions: 3,
      memoryRetention: 'permanent',
      hasNSFWAccess: true,
      hasVoiceChat: true,
      hasFullBirthChart: true,
      hasTransitAwareness: true,
      hasRoleplayScenarios: true,
      hasCustomRoleplay: true,
      hasPriorityGeneration: true,
      hasAstrologerConsultation: true
    }
  };

  private static readonly PRICES: Record<TierName, number> = {
    free: 0,
    astrology_seeker: 14.99,
    cosmic_soulmate: 24.99,
    astral_intimacy: 39.99
  };

  private constructor(
    private readonly name: TierName,
    private readonly limits: TierLimits
  ) {}

  get tierName(): TierName { return this.name; }
  get price(): number { return ContentTier.PRICES[this.name]; }
  get messagesPerDay(): number { return this.limits.messagesPerDay; }
  get nsfwImagesPerMonth(): number { return this.limits.nsfwImagesPerMonth; }
  get maxCompanions(): number { return this.limits.maxCompanions; }

  canAccessNSFW(): boolean {
    return this.limits.hasNSFWAccess;
  }

  canAccessVoice(): boolean {
    return this.limits.hasVoiceChat;
  }

  canAccessTransits(): boolean {
    return this.limits.hasTransitAwareness;
  }

  canCreateCompanion(currentCount: number): boolean {
    return currentCount < this.limits.maxCompanions;
  }

  hasUnlimitedMessages(): boolean {
    return this.limits.messagesPerDay === -1;
  }

  static fromName(name: TierName): ContentTier {
    const limits = ContentTier.TIERS[name];
    if (!limits) {
      throw new ValidationError(`Invalid tier: ${name}`);
    }
    return new ContentTier(name, limits);
  }

  static getUpgradePath(current: TierName): TierName | null {
    const path: Record<TierName, TierName | null> = {
      free: 'astrology_seeker',
      astrology_seeker: 'cosmic_soulmate',
      cosmic_soulmate: 'astral_intimacy',
      astral_intimacy: null
    };
    return path[current];
  }

  equals(other: ContentTier): boolean {
    return this.name === other.name;
  }
}
```
