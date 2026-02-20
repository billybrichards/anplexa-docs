import { POST } from '../route';
import { NextRequest } from 'next/server';

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/astrology/calculate-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/astrology/calculate-chart', () => {
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

  it('returns 400 when date is missing', async () => {
    const response = await callHandler({ location: 'New York, NY' });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 when location is missing', async () => {
    const response = await callHandler({ date: '1990-07-15' });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 200 with chart data for valid input', async () => {
    const response = await callHandler({
      date: '1990-07-15',
      time: '14:30',
      location: 'New York, NY',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.error).toBeUndefined();
  });

  it('response includes all expected planetary fields', async () => {
    const response = await callHandler({
      date: '1990-07-15',
      time: '14:30',
      location: 'New York, NY',
    });

    const data = await response.json();
    expect(data.sun).toBeDefined();
    expect(data.sun).toHaveProperty('sign');
    expect(data.sun).toHaveProperty('house');
    expect(data.sun).toHaveProperty('degree');

    expect(data.moon).toBeDefined();
    expect(data.moon).toHaveProperty('sign');

    expect(data.rising).toBeDefined();
    expect(data.rising).toHaveProperty('sign');

    expect(data.mercury).toBeDefined();
    expect(data.mercury).toHaveProperty('sign');

    expect(data.venus).toBeDefined();
    expect(data.venus).toHaveProperty('sign');

    expect(data.mars).toBeDefined();
    expect(data.mars).toHaveProperty('sign');
  });

  it('response includes dominantElement and dominantModality', async () => {
    const response = await callHandler({
      date: '1990-07-15',
      time: '14:30',
      location: 'New York, NY',
    });

    const data = await response.json();
    expect(data.dominantElement).toBeDefined();
    expect(typeof data.dominantElement).toBe('string');
    expect(data.dominantModality).toBeDefined();
    expect(typeof data.dominantModality).toBe('string');
  });

  it('response echoes back birthData from input', async () => {
    const input = {
      date: '1990-07-15',
      time: '14:30',
      location: 'New York, NY',
    };
    const response = await callHandler(input);

    const data = await response.json();
    expect(data.birthData).toBeDefined();
    expect(data.birthData.date).toBe(input.date);
    expect(data.birthData.time).toBe(input.time);
    expect(data.birthData.location).toBe(input.location);
  });

  it('works without time field (time is optional)', async () => {
    const response = await callHandler({
      date: '1990-07-15',
      location: 'New York, NY',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sun).toBeDefined();
    expect(data.birthData.date).toBe('1990-07-15');
    expect(data.birthData.location).toBe('New York, NY');
  });
});
