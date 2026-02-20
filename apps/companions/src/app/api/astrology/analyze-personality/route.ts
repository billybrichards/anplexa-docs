import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * POST /api/astrology/analyze-personality - Analyze personality traits from natal chart
 *
 * TODO: Proxy to Express API or integrate with TraitExtractionService when migration lands.
 * Currently returns mock trait profile data for the onboarding flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockTraitProfile = {
      userId,
      birthChartId: `chart-${userId}`,
      traits: [
        {
          id: 'sun-leo',
          name: 'Bold Leadership',
          description: '',
          category: 'identity',
          strength: 85,
          eclipticLongitude: 135,
          eclipticLatitude: 0.5,
          sourcePosition: { planet: 'Sun', sign: 'Leo', degree: 15.3 },
        },
        {
          id: 'moon-pisces',
          name: 'Deep Empathy',
          description: '',
          category: 'emotional',
          strength: 78,
          eclipticLongitude: 352,
          eclipticLatitude: -1.2,
          sourcePosition: { planet: 'Moon', sign: 'Pisces', degree: 22.1 },
        },
        {
          id: 'mercury-cancer',
          name: 'Intuitive Communication',
          description: '',
          category: 'mental',
          strength: 72,
          eclipticLongitude: 118,
          eclipticLatitude: 2.1,
          sourcePosition: { planet: 'Mercury', sign: 'Cancer', degree: 28.5 },
        },
        {
          id: 'venus-leo',
          name: 'Generous Love',
          description: '',
          category: 'social',
          strength: 80,
          eclipticLongitude: 123,
          eclipticLatitude: -0.8,
          sourcePosition: { planet: 'Venus', sign: 'Leo', degree: 3.2 },
        },
        {
          id: 'mars-gemini',
          name: 'Versatile Drive',
          description: '',
          category: 'creative',
          strength: 68,
          eclipticLongitude: 79,
          eclipticLatitude: 1.5,
          sourcePosition: { planet: 'Mars', sign: 'Gemini', degree: 19.8 },
        },
        {
          id: 'jupiter-sagittarius',
          name: 'Expansive Wisdom',
          description: '',
          category: 'spiritual',
          strength: 90,
          eclipticLongitude: 260,
          eclipticLatitude: -0.3,
          sourcePosition: { planet: 'Jupiter', sign: 'Sagittarius', degree: 10.0 },
        },
        {
          id: 'saturn-capricorn',
          name: 'Disciplined Ambition',
          description: '',
          category: 'spiritual',
          strength: 82,
          eclipticLongitude: 290,
          eclipticLatitude: 0.7,
          sourcePosition: { planet: 'Saturn', sign: 'Capricorn', degree: 5.0 },
        },
        {
          id: 'uranus-aquarius',
          name: 'Innovative Vision',
          description: '',
          category: 'creative',
          strength: 75,
          eclipticLongitude: 315,
          eclipticLatitude: -1.0,
          sourcePosition: { planet: 'Uranus', sign: 'Aquarius', degree: 12.0 },
        },
        {
          id: 'neptune-pisces',
          name: 'Mystical Sensitivity',
          description: '',
          category: 'spiritual',
          strength: 88,
          eclipticLongitude: 345,
          eclipticLatitude: 0.2,
          sourcePosition: { planet: 'Neptune', sign: 'Pisces', degree: 20.0 },
        },
        {
          id: 'ascendant-virgo',
          name: 'Analytical Grace',
          description: '',
          category: 'identity',
          strength: 76,
          eclipticLongitude: 158,
          eclipticLatitude: 0,
          sourcePosition: { planet: 'Ascendant', sign: 'Virgo', degree: 8.7 },
        },
      ],
      personalitySummary:
        'A natural leader with deep emotional intelligence. Your Leo sun gives you magnetic charisma while your Pisces moon adds layers of empathy and intuition. You communicate with sensitivity and love generously.',
      dominantTraits: ['sun-leo', 'jupiter-sagittarius', 'neptune-pisces'],
      elementalNarrative:
        'Your chart shows a beautiful balance of fire and water elements, creating a personality that is both passionate and deeply feeling.',
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockTraitProfile);
  } catch (error) {
    console.error('Analyze personality error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze personality' },
      { status: 500 }
    );
  }
}
