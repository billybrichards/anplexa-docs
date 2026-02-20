import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * POST /api/astrology/calculate-chart - Calculate natal chart from birth data
 *
 * TODO: Proxy to Express API or integrate with AstrologyService when migration lands.
 * Currently returns mock chart data for the onboarding flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, location } = body;

    if (!date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: date, location' },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock natal chart data based on input
    const mockChart = {
      sun: { sign: 'Leo', house: 10, degree: 15.3 },
      moon: { sign: 'Pisces', house: 5, degree: 22.1 },
      rising: { sign: 'Virgo', degree: 8.7 },
      mercury: { sign: 'Cancer', house: 9, degree: 28.5 },
      venus: { sign: 'Leo', house: 10, degree: 3.2 },
      mars: { sign: 'Gemini', house: 8, degree: 19.8 },
      dominantElement: 'water',
      dominantModality: 'fixed',
      birthData: { date, time, location },
    };

    return NextResponse.json(mockChart);
  } catch (error) {
    console.error('Calculate chart error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate chart' },
      { status: 500 }
    );
  }
}
