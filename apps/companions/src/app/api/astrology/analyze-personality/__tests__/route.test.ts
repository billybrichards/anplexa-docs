import { POST } from '../route';
import { NextRequest } from 'next/server';

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/astrology/analyze-personality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/astrology/analyze-personality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function callHandler(body: object) {
    const request = createRequest(body);
    const responsePromise = POST(request);
    await vi.advanceTimersByTimeAsync(2000);
    return responsePromise;
  }

  it('returns 400 when userId is missing', async () => {
    const response = await callHandler({});

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 200 with trait profile for valid userId', async () => {
    const response = await callHandler({ userId: 'user-123' });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.error).toBeUndefined();
  });

  it('response includes traits array with at least 10 traits', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();

    expect(Array.isArray(data.traits)).toBe(true);
    expect(data.traits.length).toBeGreaterThanOrEqual(10);
  });

  it('each trait has required fields: id, name, category, strength, eclipticLongitude, eclipticLatitude, sourcePosition', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();

    for (const trait of data.traits) {
      expect(trait).toHaveProperty('id');
      expect(typeof trait.id).toBe('string');

      expect(trait).toHaveProperty('name');
      expect(typeof trait.name).toBe('string');

      expect(trait).toHaveProperty('category');
      expect(typeof trait.category).toBe('string');

      expect(trait).toHaveProperty('strength');
      expect(typeof trait.strength).toBe('number');

      expect(trait).toHaveProperty('eclipticLongitude');
      expect(typeof trait.eclipticLongitude).toBe('number');

      expect(trait).toHaveProperty('eclipticLatitude');
      expect(typeof trait.eclipticLatitude).toBe('number');

      expect(trait).toHaveProperty('sourcePosition');
      expect(trait.sourcePosition).toHaveProperty('planet');
      expect(trait.sourcePosition).toHaveProperty('sign');
      expect(trait.sourcePosition).toHaveProperty('degree');
    }
  });

  it('response includes personalitySummary string', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();

    expect(data.personalitySummary).toBeDefined();
    expect(typeof data.personalitySummary).toBe('string');
    expect(data.personalitySummary.length).toBeGreaterThan(0);
  });

  it('response includes dominantTraits array', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();

    expect(Array.isArray(data.dominantTraits)).toBe(true);
    expect(data.dominantTraits.length).toBeGreaterThan(0);
    for (const traitId of data.dominantTraits) {
      expect(typeof traitId).toBe('string');
    }
  });

  it('response includes generatedAt timestamp', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();

    expect(data.generatedAt).toBeDefined();
    expect(typeof data.generatedAt).toBe('string');
    // Verify it is a valid ISO date string
    const parsedDate = new Date(data.generatedAt);
    expect(parsedDate.toISOString()).toBe(data.generatedAt);
  });

  it('userId in response matches input', async () => {
    const userId = 'user-abc-456';
    const response = await callHandler({ userId });
    const data = await response.json();

    expect(data.userId).toBe(userId);
  });
});
