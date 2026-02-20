import { POST } from '../route';
import { NextRequest } from 'next/server';

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/companion/generate-with-compatibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/companion/generate-with-compatibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function callHandler(body: object) {
    const request = createRequest(body);
    const responsePromise = POST(request);
    await vi.advanceTimersByTimeAsync(3000);
    return responsePromise;
  }

  it('returns 400 when userId is missing', async () => {
    const response = await callHandler({});

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 200 with persona and compatibility data', async () => {
    const response = await callHandler({ userId: 'user-123' });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.persona).toBeDefined();
    expect(data.compatibility).toBeDefined();
  });

  it('persona has required fields: id, userId, name, personality array, communicationStyle, specializations', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();
    const { persona } = data;

    expect(persona).toHaveProperty('id');
    expect(typeof persona.id).toBe('string');

    expect(persona).toHaveProperty('userId');
    expect(persona.userId).toBe('user-123');

    expect(persona).toHaveProperty('name');
    expect(typeof persona.name).toBe('string');

    expect(Array.isArray(persona.personality)).toBe(true);
    expect(persona.personality.length).toBeGreaterThan(0);

    expect(persona).toHaveProperty('communicationStyle');
    expect(typeof persona.communicationStyle).toBe('string');

    expect(Array.isArray(persona.specializations)).toBe(true);
    expect(persona.specializations.length).toBeGreaterThan(0);
  });

  it('compatibility has scores with overall, elementalHarmony, etc.', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();
    const { compatibility } = data;

    expect(compatibility.scores).toBeDefined();
    expect(typeof compatibility.scores.overall).toBe('number');
    expect(typeof compatibility.scores.elementalHarmony).toBe('number');
    expect(typeof compatibility.scores.emotionalResonance).toBe('number');
    expect(typeof compatibility.scores.intellectualCompatibility).toBe('number');
    expect(typeof compatibility.scores.valuesAlignment).toBe('number');
  });

  it('compatibility has synastryHighlights array', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();
    const { compatibility } = data;

    expect(Array.isArray(compatibility.synastryHighlights)).toBe(true);
    expect(compatibility.synastryHighlights.length).toBeGreaterThan(0);

    for (const highlight of compatibility.synastryHighlights) {
      expect(highlight).toHaveProperty('aspect');
      expect(highlight).toHaveProperty('planets');
      expect(Array.isArray(highlight.planets)).toBe(true);
      expect(highlight).toHaveProperty('orb');
      expect(typeof highlight.orb).toBe('number');
      expect(highlight).toHaveProperty('description');
      expect(typeof highlight.description).toBe('string');
    }
  });

  it('compatibility has narrative string', async () => {
    const response = await callHandler({ userId: 'user-123' });
    const data = await response.json();
    const { compatibility } = data;

    expect(compatibility.narrative).toBeDefined();
    expect(typeof compatibility.narrative).toBe('string');
    expect(compatibility.narrative.length).toBeGreaterThan(0);
  });
});
