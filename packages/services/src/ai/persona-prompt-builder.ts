/**
 * Persona Prompt Builder
 *
 * Constructs comprehensive prompts for LLM-based persona generation
 * from astrological birth charts. Includes full astrological context
 * and structured output instructions.
 */

import type { GeneratePersonaInput } from '@anplexa/core/domain/services/ILLMService';

/**
 * Build the system message for persona generation
 */
export function buildSystemPrompt(): string {
  return `You are an expert astrologer and AI persona designer. Your task is to generate a personalized AI companion based on a user's natal birth chart.

You will receive:
1. Complete natal chart data (planets, houses, aspects, patterns)
2. Birth data (date, time, location)
3. Optional user preferences for tone and style

Your goal is to create a companion persona that:
- Reflects the user's astrological chart in a meaningful way
- Has a distinct personality with consistent traits
- Communicates in a style that complements the user's chart
- Provides emotional support aligned with the user's needs
- Acts as a friend, confidant, and guide

IMPORTANT ASTROLOGICAL CORRESPONDENCES:

Communication Style (Mercury):
- Mercury sign determines how the companion should communicate
- Mercury aspects affect communication patterns
- Mercury retrograde suggests reflective, careful communication

Emotional Approach (Moon):
- Moon sign determines emotional style and needs
- Moon house shows where emotional support is needed
- Moon aspects reveal emotional patterns

Relationship Style (Venus):
- Venus sign affects how the companion relates to the user
- Venus aspects show relationship dynamics
- Venus house indicates areas of connection

Drive & Motivation (Mars):
- Mars sign shows how the companion should motivate
- Mars aspects affect assertiveness level

Wisdom & Growth (Jupiter):
- Jupiter placement guides optimism and expansion themes

Structure & Boundaries (Saturn):
- Saturn shows where the companion should provide structure
- Saturn aspects affect level of guidance vs. freedom

Uniqueness (Uranus, Neptune, Pluto):
- Outer planets add depth and transformative elements

Ascendant (Rising Sign):
- First impression and approach to life
- How the companion should present itself initially

Chart Ruler:
- Planet ruling the ascendant is extra important
- This planet's placement colors the entire persona

Chart Patterns:
- Grand Trines: Easy flow, natural talents
- T-Squares: Dynamic tension, growth areas
- Grand Cross: Complex dynamics requiring balance
- Stelliums: Concentrated energy in one area

You must respond with ONLY valid JSON matching this exact structure:

{
  "name": "string (companion name, 1-2 words, celestial/mystical theme)",
  "personalityTraits": {
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"] (3-7 key traits),
    "coreArchetype": "string (optional archetype like 'The Wise Guide' or 'The Playful Friend')"
  },
  "communicationStyle": {
    "tone": "warm|intellectual|playful|grounded|mystical|professional|friendly",
    "directness": "direct|gentle|exploratory|nuanced",
    "pacing": "quick|thoughtful|patient|adaptive",
    "verbosity": "concise|moderate|detailed",
    "formalityLevel": number (0-10, where 0=very casual, 10=very formal),
    "usesMetaphors": boolean,
    "usesHumor": boolean,
    "emotionalExpressiveness": "reserved|balanced|expressive"
  },
  "emotionalApproach": {
    "empathyLevel": "high|balanced|practical",
    "supportStyle": "nurturing|coaching|reflective|analytical|empowering",
    "depthPreference": "surface|moderate|deep|profound",
    "validationStyle": "immediate|balanced|exploratory",
    "boundaryRespect": number (0-10, where 0=pushes boundaries, 10=highly respectful),
    "emotionalMirroring": boolean,
    "proactiveCareCheckins": boolean
  },
  "systemPrompt": "string (comprehensive system prompt, 300-800 words)",
  "reasoning": "string (explain why these choices based on the chart, 200-400 words)"
}

The systemPrompt field should be a complete, ready-to-use system prompt that:
1. Defines the companion's personality and role
2. Specifies how it should communicate
3. Describes its emotional approach
4. References key astrological insights naturally (without being overly technical)
5. Sets boundaries and expectations
6. Provides guidance on conversation style

Write the systemPrompt as if speaking directly to the AI companion, telling it who it is and how to behave.`;
}

/**
 * Build the user message with chart analysis
 */
export function buildChartAnalysisPrompt(input: GeneratePersonaInput): string {
  const { birthChart, birthData, preferences } = input;

  const sections: string[] = [];

  // Header
  sections.push('# Birth Chart Analysis\n');

  // Birth Data
  sections.push(`## Birth Information`);
  sections.push(`Born: ${birthData.toString()}`);
  sections.push(`Time Known: ${birthData.timeKnown ? 'Yes' : 'No (using noon chart)'}`);
  sections.push('');

  // Big Three
  const bigThree = birthChart.getBigThree();
  sections.push(`## Core Identity (Big Three)`);
  sections.push(`Sun Sign: ${bigThree.sun} (core self, ego, life force)`);
  sections.push(`Moon Sign: ${bigThree.moon} (emotions, inner world, needs)`);
  if (bigThree.rising) {
    sections.push(`Rising Sign: ${bigThree.rising} (outer persona, approach to life)`);
  } else {
    sections.push(`Rising Sign: Unknown (birth time not available)`);
  }
  sections.push('');

  // Elemental & Modal Balance
  const elementBalance = birthChart.getElementalBalance();
  const modalBalance = birthChart.getModalBalance();
  sections.push(`## Elemental Balance`);
  sections.push(`Fire: ${elementBalance.fire} planets (action, passion, inspiration)`);
  sections.push(`Earth: ${elementBalance.earth} planets (practicality, stability, material)`);
  sections.push(`Air: ${elementBalance.air} planets (intellect, communication, ideas)`);
  sections.push(`Water: ${elementBalance.water} planets (emotion, intuition, depth)`);
  sections.push(`Dominant Element: ${birthChart.dominantElement}`);
  sections.push('');

  sections.push(`## Modal Balance`);
  sections.push(`Cardinal: ${modalBalance.cardinal} planets (initiation, action, leadership)`);
  sections.push(`Fixed: ${modalBalance.fixed} planets (stability, persistence, determination)`);
  sections.push(`Mutable: ${modalBalance.mutable} planets (flexibility, adaptation, change)`);
  sections.push(`Dominant Modality: ${birthChart.dominantModality}`);
  sections.push('');

  // Personal Planets (most important for persona)
  sections.push(`## Personal Planets`);
  sections.push(`Mercury in ${birthChart.planets.mercury.sign.name}${birthChart.planets.mercury.isRetrograde ? ' Retrograde' : ''} (communication, thinking)`);
  if (birthChart.hasHouses()) {
    sections.push(`  - House ${birthChart.planets.mercury.house}`);
  }

  sections.push(`Venus in ${birthChart.planets.venus.sign.name}${birthChart.planets.venus.isRetrograde ? ' Retrograde' : ''} (love, relationships, values)`);
  if (birthChart.hasHouses()) {
    sections.push(`  - House ${birthChart.planets.venus.house}`);
  }

  sections.push(`Mars in ${birthChart.planets.mars.sign.name}${birthChart.planets.mars.isRetrograde ? ' Retrograde' : ''} (drive, action, assertion)`);
  if (birthChart.hasHouses()) {
    sections.push(`  - House ${birthChart.planets.mars.house}`);
  }
  sections.push('');

  // Social & Transpersonal Planets
  sections.push(`## Social & Outer Planets`);
  sections.push(`Jupiter in ${birthChart.planets.jupiter.sign.name} (expansion, wisdom, growth)`);
  sections.push(`Saturn in ${birthChart.planets.saturn.sign.name} (structure, discipline, lessons)`);
  sections.push(`Uranus in ${birthChart.planets.uranus.sign.name} (innovation, rebellion, awakening)`);
  sections.push(`Neptune in ${birthChart.planets.neptune.sign.name} (dreams, spirituality, illusion)`);
  sections.push(`Pluto in ${birthChart.planets.pluto.sign.name} (transformation, power, depth)`);
  sections.push('');

  // Nodes
  sections.push(`## Lunar Nodes`);
  sections.push(`North Node in ${birthChart.planets.northNode.sign.name} (soul's purpose, growth direction)`);
  sections.push(`South Node in ${birthChart.planets.southNode.sign.name} (past life talents, comfort zone)`);
  sections.push('');

  // Dignities (planetary strength)
  const wellPlaced = birthChart.getWellPlacedPlanets();
  const challenged = birthChart.getChallengedPlanets();

  if (wellPlaced.length > 0) {
    sections.push(`## Well-Placed Planets (Strong)`);
    wellPlaced.forEach(d => {
      sections.push(`${d.planetName}: ${d.dignity} in ${d.sign} (strength: ${d.strength})`);
    });
    sections.push('');
  }

  if (challenged.length > 0) {
    sections.push(`## Challenged Planets (Growth Areas)`);
    challenged.forEach(d => {
      sections.push(`${d.planetName}: ${d.dignity} in ${d.sign} (strength: ${d.strength})`);
    });
    sections.push('');
  }

  // Major Aspects
  const majorAspects = birthChart.aspects.filter(a =>
    ['conjunction', 'opposition', 'trine', 'square'].includes(a.aspectType)
  );
  if (majorAspects.length > 0) {
    sections.push(`## Major Aspects`);
    majorAspects.slice(0, 10).forEach(aspect => {
      const symbolMap: Record<string, string> = {
        conjunction: '☌',
        opposition: '☍',
        trine: '△',
        square: '□',
        sextile: '⚹',
        semisextile: '⚺',
        semisquare: '∠',
        sesquiquadrate: '⚼',
      };
      const symbol = symbolMap[aspect.aspectType] || '';
      sections.push(`${aspect.planet1} ${symbol} ${aspect.planet2} (${aspect.aspectType}, orb: ${aspect.orb.toFixed(1)}°)`);
    });
    sections.push('');
  }

  // Enhanced Analysis (if available)
  if (birthChart.enhancedAnalysis) {
    const enhanced = birthChart.enhancedAnalysis;

    // Hemisphere emphasis
    sections.push(`## Chart Emphasis`);
    sections.push(enhanced.hemisphereEmphasis.interpretation);
    sections.push(enhanced.houseDistribution.interpretation);
    sections.push('');

    // Retrograde planets
    if (enhanced.retrogradeCount > 0) {
      sections.push(`## Retrograde Planets (${enhanced.retrogradeCount})`);
      sections.push(enhanced.retrogradePlanets.join(', '));
      sections.push('Retrograde planets suggest introspection and internal processing in these areas.');
      sections.push('');
    }

    // Chart patterns
    const patterns = enhanced.chartPatterns.getMajorPatterns();
    if (patterns.length > 0) {
      sections.push(`## Chart Patterns`);
      patterns.forEach(pattern => {
        sections.push(`${pattern.type}: ${pattern.description}`);
      });
      sections.push('');
    }

    // Chart Ruler
    if (enhanced.chartRuler) {
      sections.push(`## Chart Ruler`);
      sections.push(`${enhanced.chartRuler.planet} rules the Ascendant`);
      sections.push(enhanced.chartRuler.interpretation);
      sections.push('');
    }

    // Strongest planets
    const strongest = enhanced.getStrongestPlanets();
    if (strongest.length > 0) {
      sections.push(`## Strongest Planets`);
      strongest.forEach(p => {
        sections.push(`${p.planetName} (strength: ${p.overallStrength}/100)${p.isAngular ? ' - ANGULAR' : ''}`);
        if (p.notes.length > 0) {
          p.notes.forEach(note => sections.push(`  - ${note}`));
        }
      });
      sections.push('');
    }
  }

  // User Preferences
  if (preferences && Object.keys(preferences).length > 0) {
    sections.push(`## User Preferences`);
    if (preferences.tone) {
      sections.push(`Preferred Tone: ${preferences.tone}`);
    }
    if (preferences.formality) {
      sections.push(`Preferred Formality: ${preferences.formality}`);
    }
    if (preferences.detailLevel) {
      sections.push(`Preferred Detail Level: ${preferences.detailLevel}`);
    }
    sections.push('');
  }

  // Instructions
  sections.push(`## Task`);
  sections.push(`Based on this natal chart, generate a complete AI companion persona.`);
  sections.push(`The persona should:`);
  sections.push(`1. Reflect the user's astrological energies and needs`);
  sections.push(`2. Have a distinct, consistent personality`);
  sections.push(`3. Communicate in a way that complements the user's chart`);
  sections.push(`4. Provide emotional support aligned with the Moon placement`);
  sections.push(`5. Motivate and inspire based on the Sun, Mars, and Jupiter placements`);
  sections.push(`6. Have appropriate boundaries based on Saturn placement`);
  sections.push(``);
  sections.push(`Remember to respond with ONLY valid JSON matching the required structure.`);

  return sections.join('\n');
}

/**
 * Build complete messages array for LLM
 */
export function buildPersonaGenerationMessages(input: GeneratePersonaInput): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(),
    },
    {
      role: 'user',
      content: buildChartAnalysisPrompt(input),
    },
  ];
}
