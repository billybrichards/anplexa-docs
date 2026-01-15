/**
 * ZodiacSign Value Object
 *
 * Represents one of the 12 zodiac signs with all associated astrological data.
 * Immutable value object following Clean Architecture principles.
 */

export type ZodiacSignName =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type Polarity = 'yang' | 'yin';

export type AspectType =
  | 'conjunction'   // 0° - Intense connection
  | 'sextile'       // 60° - Complementary
  | 'square'        // 90° - Challenging but passionate
  | 'trine'         // 120° - Harmonious
  | 'opposition'    // 180° - Tension but attraction
  | 'none';

interface VoiceCharacteristics {
  tone: string;
  pace: 'slow' | 'moderate' | 'fast';
  pitch: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
  emotionRange: string;
}

interface ImageAesthetics {
  colorPalette: string[];
  style: string;
  mood: string;
  themes: string[];
}

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
        pitch: 'medium-high',
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
        pitch: 'low-medium',
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
        pitch: 'medium-high',
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
        pitch: 'medium-high',
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
        pitch: 'low-medium',
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
        pitch: 'medium-high',
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
  get rulingPlanet(): string { return this.data.rulingPlanet; }
  get degreeStart(): number { return this.data.degreeStart; }
  get degreeEnd(): number { return this.data.degreeEnd; }
  get coreTraits(): string[] { return [...this.data.coreTraits]; }
  get emotionalStyle(): string { return this.data.emotionalStyle; }
  get loveLanguage(): string { return this.data.loveLanguage; }
  get passionStyle(): string { return this.data.passionStyle; }
  get communicationStyle(): string { return this.data.communicationStyle; }
  get voiceCharacteristics(): VoiceCharacteristics { return { ...this.data.voiceCharacteristics }; }
  get imageAesthetics(): ImageAesthetics { return { ...this.data.imageAesthetics }; }

  /**
   * Calculate astrological aspect between this sign and another
   */
  getAspectWith(other: ZodiacSign): AspectType {
    const degreeDiff = Math.abs(this.data.degreeStart - other.data.degreeStart);
    const normalizedDiff = degreeDiff > 180 ? 360 - degreeDiff : degreeDiff;

    // Allow 10-degree orb for aspects
    if (normalizedDiff <= 10) return 'conjunction';
    if (normalizedDiff >= 55 && normalizedDiff <= 65) return 'sextile';
    if (normalizedDiff >= 85 && normalizedDiff <= 95) return 'square';
    if (normalizedDiff >= 115 && normalizedDiff <= 125) return 'trine';
    if (normalizedDiff >= 175) return 'opposition';

    return 'none';
  }

  /**
   * Calculate compatibility score with another sign (0-100)
   */
  getCompatibilityScore(other: ZodiacSign): number {
    const aspect = this.getAspectWith(other);
    const aspectScores: Record<AspectType, number> = {
      'conjunction': 25,  // Intense connection
      'sextile': 20,      // Complementary
      'trine': 30,        // Harmonious (best)
      'square': -10,      // Challenging
      'opposition': -5,   // Tension
      'none': 0
    };

    let score = 50; // Base score
    score += aspectScores[aspect];

    // Element compatibility bonus
    if (this.hasElementCompatibility(other)) {
      score += 15;
    }

    // Modality compatibility
    if (this.modality === other.modality) {
      score += 5; // Similar approach to life
    }

    // Polarity (yang/yin) compatibility
    if (this.polarity !== other.polarity) {
      score += 10; // Opposites attract
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if elements are compatible
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

  /**
   * Create from sign name
   */
  static fromName(name: ZodiacSignName): ZodiacSign {
    const data = ZodiacSign.SIGNS[name];
    if (!data) {
      throw new Error(`Invalid zodiac sign: ${name}`);
    }
    return new ZodiacSign(data);
  }

  /**
   * Create from ecliptic longitude (0-360 degrees)
   */
  static fromDegree(degree: number): ZodiacSign {
    const normalizedDegree = ((degree % 360) + 360) % 360;

    for (const data of Object.values(ZodiacSign.SIGNS)) {
      if (normalizedDegree >= data.degreeStart && normalizedDegree < data.degreeEnd) {
        return new ZodiacSign(data);
      }
    }

    // Handle 360 degrees edge case (wraps to Aries)
    return new ZodiacSign(ZodiacSign.SIGNS.aries);
  }

  /**
   * Get all zodiac sign names
   */
  static getAllNames(): ZodiacSignName[] {
    return Object.keys(ZodiacSign.SIGNS) as ZodiacSignName[];
  }

  equals(other: ZodiacSign): boolean {
    return this.name === other.name;
  }

  toJSON(): ZodiacSignData {
    return { ...this.data };
  }
}
