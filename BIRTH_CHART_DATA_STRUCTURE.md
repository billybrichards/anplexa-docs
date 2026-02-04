# Birth Chart Data Structure

## Complete Astrological Data Stored for Each User

This document describes the comprehensive birth chart data structure used in Anplexa's AI companion system.

---

## 1. Core Birth Data (`BirthData`)

**Input data provided by user:**

```typescript
{
  date: Date,                    // Birth date
  time: string | null,           // Birth time (HH:MM) or null if unknown
  timeZone: string,              // IANA timezone (e.g., "America/New_York")
  latitude: number,              // Birth location latitude
  longitude: number,             // Birth location longitude
  placeName: string,             // City name
  country: string,               // Country name
  timeKnown: boolean            // Whether birth time is known
}
```

---

## 2. Natal Chart Data (`NatalChartData`)

**Calculated astrological positions and patterns:**

### 2.1 Planetary Placements

**All 12 major celestial bodies:**

```typescript
{
  sun: PlanetPlacement,          // Core identity, life purpose
  moon: PlanetPlacement,         // Emotions, instincts, needs
  mercury: PlanetPlacement,      // Communication, thinking style
  venus: PlanetPlacement,        // Love, values, relationships
  mars: PlanetPlacement,         // Drive, energy, action
  jupiter: PlanetPlacement,      // Growth, expansion, luck
  saturn: PlanetPlacement,       // Discipline, responsibility, lessons
  uranus: PlanetPlacement,       // Innovation, rebellion, change
  neptune: PlanetPlacement,      // Dreams, spirituality, illusion
  pluto: PlanetPlacement,        // Transformation, power, depth
  northNode: PlanetPlacement,    // Life path, destiny
  southNode: PlanetPlacement     // Past patterns, karma
}
```

**Each planet placement includes:**

```typescript
{
  planetName: string,            // Planet name
  sign: ZodiacSign,              // Zodiac sign (with element & modality)
  house: number | null,          // House position (1-12, null if time unknown)
  degree: number,                // Absolute ecliptic longitude (0-360°)
  speed: number,                 // Degrees per day (velocity)
  isRetrograde: boolean          // Whether planet is retrograde
}
```

### 2.2 Zodiac Sign Details

Each sign includes:

```typescript
{
  name: 'aries' | 'taurus' | ... | 'pisces',
  symbol: string,                // Glyph (♈, ♉, etc.)
  element: 'fire' | 'earth' | 'air' | 'water',
  modality: 'cardinal' | 'fixed' | 'mutable',
  rulingPlanet: string,         // Traditional ruler
  keywords: string[]            // Key themes
}
```

### 2.3 Houses (if birth time known)

**12 astrological houses:**

```typescript
{
  number: 1-12,                  // House number
  cuspDegree: number,            // Starting degree (0-360°)
  cuspSign: ZodiacSign,          // Sign on the cusp
  planets: string[]              // Planets in this house
}
```

**House meanings:**
- **House 1:** Self, identity, appearance (Ascendant/Rising sign)
- **House 4:** Home, family, roots (IC)
- **House 7:** Partnerships, marriage (Descendant)
- **House 10:** Career, public image (Midheaven/MC)
- etc.

### 2.4 Aspects

**Planetary relationships:**

```typescript
{
  planet1: string,               // First planet
  planet2: string,               // Second planet
  aspectType: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | ...,
  orb: number,                   // Degrees from exact (precision)
  strength: number,              // 0-1 (closeness to exact)
  isApplying: boolean           // Moving together or apart
}
```

**Aspect types:**
- **Conjunction (0°):** Blending of energies
- **Opposition (180°):** Tension, polarity
- **Trine (120°):** Harmony, ease
- **Square (90°):** Challenge, friction
- **Sextile (60°):** Opportunity, cooperation

### 2.5 Essential Dignities

**Planetary strength in signs:**

```typescript
{
  planetName: string,
  sign: ZodiacSignName,
  dignity: 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine',
  strength: number,              // -2 (fall) to +2 (domicile)
  interpretation: string         // Human-readable explanation
}
```

**Examples:**
- Sun in Leo = Domicile (+2) - "Operates at full strength"
- Moon in Taurus = Exaltation (+1) - "Expresses highest potential"
- Mars in Libra = Detriment (-1) - "Faces challenges"
- Saturn in Aries = Fall (-2) - "Requires extra effort"

### 2.6 Dominant Patterns

**Elemental balance:**

```typescript
{
  fire: number,     // Aries, Leo, Sagittarius (passion, action)
  earth: number,    // Taurus, Virgo, Capricorn (practical, grounded)
  air: number,      // Gemini, Libra, Aquarius (intellectual, social)
  water: number     // Cancer, Scorpio, Pisces (emotional, intuitive)
}
```

**Modal balance:**

```typescript
{
  cardinal: number,  // Initiative, leadership (Aries, Cancer, Libra, Capricorn)
  fixed: number,     // Stability, persistence (Taurus, Leo, Scorpio, Aquarius)
  mutable: number    // Adaptability, flexibility (Gemini, Virgo, Sagittarius, Pisces)
}
```

### 2.7 Key Points

```typescript
{
  ascendant: ZodiacSign,        // Rising sign - outer personality
  midheaven: ZodiacSign,        // MC - career, public image
  descendant: ZodiacSign,       // DC - relationship style (opposite ascendant)
  imumCoeli: ZodiacSign         // IC - home, roots (opposite midheaven)
}
```

---

## 3. Enhanced Chart Analysis (`EnhancedChartAnalysis`)

**Deep psychological and pattern analysis:**

### 3.1 Hemisphere Emphasis

```typescript
{
  northern: number,              // Houses 1-6 (private, inner life)
  southern: number,              // Houses 7-12 (public, outer life)
  eastern: number,               // Houses 10-12, 1-3 (independent, self-directed)
  western: number,               // Houses 4-9 (relationship-focused)
  emphasis: 'northern' | 'southern' | 'eastern' | 'western' | 'balanced',
  interpretation: string         // What this means psychologically
}
```

### 3.2 House Distribution

```typescript
{
  angular: number,               // Houses 1, 4, 7, 10 (action-oriented leaders)
  succedent: number,             // Houses 2, 5, 8, 11 (stability-focused builders)
  cadent: number,                // Houses 3, 6, 9, 12 (adaptable thinkers)
  emphasis: 'angular' | 'succedent' | 'cadent' | 'balanced',
  interpretation: string
}
```

### 3.3 Retrograde Planets

```typescript
{
  retrogradeCount: number,       // Total retrograde planets
  retrogradePlanets: string[],   // Which planets are retrograde
  interpretation: string         // Psychological meaning
}
```

**Retrograde interpretation:**
- 0-1 retrogrades: Outward focus
- 2-3 retrogrades: Balanced
- 4+ retrogrades: Introspective, internal processing

### 3.4 Planetary Strength Scores

**For each planet:**

```typescript
{
  planetName: string,
  overallStrength: number,       // 0-100 (composite score)
  dignityStrength: number,       // Based on sign placement
  aspectStrength: number,        // Based on harmonious/challenging aspects
  houseStrength: number,         // Based on angular/succedent/cadent
  isRetrograde: boolean,
  isAngular: boolean,            // In powerful angular house
  notes: string[]                // Key points about this planet
}
```

### 3.5 Chart Patterns

**Major configurations:**

```typescript
{
  patterns: [
    {
      type: 'grand_trine' | 'grand_cross' | 't_square' | 'yod' | 'stellium' | ...,
      planets: string[],         // Planets involved
      description: string,       // What the pattern means
      element: 'fire' | 'earth' | 'air' | 'water',
      houses: number[],          // Houses involved
      significance: 'high' | 'medium' | 'low'
    }
  ],
  shapeDescription: string,      // Overall chart shape (splash, bowl, bundle, etc.)
  focusAreas: string[]          // Key life themes emphasized
}
```

**Pattern types:**
- **Grand Trine:** Three planets in 120° harmony (talent, ease)
- **Grand Cross:** Four planets forming square (major challenges, cardinal energy)
- **T-Square:** Three planets, two opposed, one square (intense drive)
- **Yod:** "Finger of God" - fated destiny pattern
- **Stellium:** 3+ planets in one sign/house (concentrated focus)

### 3.6 Chart Ruler

**The planet ruling the rising sign:**

```typescript
{
  planet: string,                // Chart ruler planet
  sign: ZodiacSignName,          // Sign it's placed in
  house: number,                 // House it's placed in
  interpretation: string         // How this shapes overall personality
}
```

### 3.7 Sensitive Points

**Additional astrological points:**

```typescript
{
  sensitivePoints: [
    {
      name: 'Part of Fortune',   // Luck, success, joy
      degree: number,
      sign: ZodiacSignName,
      house: number,
      interpretation: string
    },
    {
      name: 'Vertex',            // Fated encounters
      degree: number,
      sign: ZodiacSignName,
      house: number,
      interpretation: string
    },
    {
      name: 'Chiron',            // The wounded healer
      degree: number,
      sign: ZodiacSignName,
      house: number,
      interpretation: string
    }
  ]
}
```

---

## 4. Complete User Birth Chart Object

**Final stored structure:**

```typescript
{
  id: "chart_123456789",
  userId: "user_xyz",

  // Input data
  birthData: {
    date: "1990-03-15",
    time: "14:30",
    timeZone: "America/New_York",
    latitude: 40.7128,
    longitude: -74.0060,
    placeName: "New York",
    country: "United States"
  },

  // Calculated natal chart
  chartData: {
    planets: { /* all 12 planets with full details */ },
    houses: [ /* 12 houses with cusps */ ],
    aspects: [ /* all planetary aspects */ ],
    dominantElement: "water",
    dominantModality: "cardinal",
    ascendant: { /* Rising sign */ },
    midheaven: { /* MC */ },

    // Enhanced deep analysis
    enhancedAnalysis: {
      hemisphereEmphasis: { /* ... */ },
      houseDistribution: { /* ... */ },
      retrogradeCount: 2,
      retrogradePlanets: ["mercury", "saturn"],
      planetStrengths: [ /* strength scores for all planets */ ],
      sensitivePoints: [ /* Part of Fortune, Vertex, etc. */ ],
      chartPatterns: {
        patterns: [ /* Grand Trine, T-Square, etc. */ ],
        shapeDescription: "Bowl shape",
        focusAreas: ["relationships", "creativity"]
      },
      chartRuler: {
        planet: "venus",
        sign: "pisces",
        house: 7,
        interpretation: "Chart ruled by Venus in Pisces suggests..."
      }
    }
  },

  displayName: "My Natal Chart",
  isActive: true,
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

---

## 5. Usage in Companion Persona Generation

All this data is available to the LLM for generating personalized companion personas:

### Key Data Points Used:

1. **Communication Style** (Mercury):
   - Sign placement
   - House placement
   - Aspects to other planets
   - Retrograde status
   - Dignity strength

2. **Emotional Needs** (Moon):
   - Sign (how you process emotions)
   - House (where you seek security)
   - Aspects (emotional complexity)

3. **Relationship Patterns** (Venus):
   - Sign (what you value)
   - House (where you find harmony)
   - Aspects (relationship dynamics)

4. **Energy & Drive** (Mars):
   - Sign (how you assert yourself)
   - House (where you take action)
   - Aspects (aggression vs. passivity)

5. **Life Purpose** (Sun + North Node):
   - Core identity direction
   - Destiny path
   - Growth areas

6. **Overall Pattern**:
   - Element balance (thinking vs. feeling vs. doing)
   - Modality balance (initiating vs. sustaining vs. adapting)
   - Hemisphere emphasis (inner vs. outer focus)
   - Major chart patterns (life themes)

---

## 6. API Response Format

When calculating a birth chart, the API returns:

```json
{
  "message": "Birth chart calculated successfully",
  "birthChart": {
    "id": "chart_123456789",
    "displayName": "My Chart",
    "isActive": true
  },
  "sunSign": "pisces",
  "moonSign": "cancer",
  "risingSign": "scorpio",
  "interpretation": "With Sun in Pisces, Moon in Cancer...",
  "companionContext": "For an AI companion, emphasize emotional intelligence..."
}
```

The full `chartData` with all details is stored in the database and retrieved when generating the companion persona.

---

## Summary

**Total Data Points Captured:**

- ✅ 12 planetary positions (sign, house, degree, speed, retrograde)
- ✅ 12 house cusps with signs
- ✅ 50+ aspects between planets
- ✅ Essential dignities for all planets
- ✅ Element & modality distribution
- ✅ Ascendant, Midheaven, Descendant, IC
- ✅ Hemisphere emphasis (4 quadrants)
- ✅ House distribution (angular/succedent/cadent)
- ✅ Planetary strength scores (12 planets)
- ✅ Chart patterns (Grand Trine, T-Square, Stellium, etc.)
- ✅ Chart shape analysis
- ✅ Chart ruler analysis
- ✅ Sensitive points (Part of Fortune, Vertex, Chiron)
- ✅ Retrograde analysis

**This comprehensive data enables:**
- Deep personality insights
- Communication style analysis
- Emotional needs understanding
- Relationship pattern recognition
- Life purpose identification
- Optimal AI companion persona generation
