import { POST } from '../route';
import { NextRequest } from 'next/server';

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat/send', () => {
  it('returns 400 when userId is missing', async () => {
    const request = createRequest({ content: 'Hello' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 when content is missing', async () => {
    const request = createRequest({ userId: 'user-123' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 when content is empty string', async () => {
    const request = createRequest({ userId: 'user-123', content: '' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 when content is whitespace only', async () => {
    const request = createRequest({ userId: 'user-123', content: '   ' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 200 with userMessage and assistantMessage', async () => {
    const request = createRequest({
      conversationId: 'conv-1',
      userId: 'user-123',
      content: 'Hello there',
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userMessage).toBeDefined();
    expect(data.assistantMessage).toBeDefined();
  });

  it('userMessage has correct role user and echoes content', async () => {
    const content = 'Tell me about my chart';
    const request = createRequest({
      conversationId: 'conv-1',
      userId: 'user-123',
      content,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.userMessage.role).toBe('user');
    expect(data.userMessage.content).toBe(content);
  });

  it('assistantMessage has role assistant', async () => {
    const request = createRequest({
      conversationId: 'conv-1',
      userId: 'user-123',
      content: 'Hello',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.assistantMessage.role).toBe('assistant');
    expect(typeof data.assistantMessage.content).toBe('string');
    expect(data.assistantMessage.content.length).toBeGreaterThan(0);
  });

  it('response includes conversationId', async () => {
    const request = createRequest({
      conversationId: 'conv-1',
      userId: 'user-123',
      content: 'Hello',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.conversationId).toBeDefined();
    expect(typeof data.conversationId).toBe('string');
  });

  it('uses provided conversationId when given', async () => {
    const conversationId = 'my-conv-id-999';
    const request = createRequest({
      conversationId,
      userId: 'user-123',
      content: 'Hello',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.conversationId).toBe(conversationId);
    expect(data.userMessage.conversationId).toBe(conversationId);
    expect(data.assistantMessage.conversationId).toBe(conversationId);
  });

  it('generates conversationId when not provided', async () => {
    const request = createRequest({
      userId: 'user-123',
      content: 'Hello',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.conversationId).toBeDefined();
    expect(typeof data.conversationId).toBe('string');
    expect(data.conversationId.length).toBeGreaterThan(0);
    // Generated conversation IDs should contain the userId
    expect(data.conversationId).toContain('user-123');
  });
});
