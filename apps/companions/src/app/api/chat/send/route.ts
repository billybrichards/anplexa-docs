import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * POST /api/chat/send - Send message to AI companion
 *
 * Endpoint for chat message submission. Integrates with SendMessageUseCase
 * to process messages and generate AI responses using the companion's
 * personalized system prompt.
 *
 * Request Body:
 * {
 *   conversationId: string;
 *   userId: string;
 *   content: string;
 * }
 *
 * Response:
 * {
 *   userMessage: Message;
 *   assistantMessage: Message;
 *   conversationId: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId, content } = body;

    // Validate input
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and content are required' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content must be a non-empty string' }, { status: 400 });
    }

    // TODO: Get use case from DI container when available
    // const useCase = container.resolve<SendMessageUseCase>('SendMessageUseCase');

    // For now, return a mock response until SendMessageUseCase integration is complete
    // This allows the UI to function while backend wiring is completed
    const mockResponse = {
      userMessage: {
        id: `msg-${Date.now()}-user`,
        conversationId: conversationId || `conv-${userId}-${Date.now()}`,
        userId,
        content,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
      },
      assistantMessage: {
        id: `msg-${Date.now()}-assistant`,
        conversationId: conversationId || `conv-${userId}-${Date.now()}`,
        userId,
        content: `I understand you said: "${content}". I'm your AI companion, and I'm here to provide personalized support based on your astrological profile. How can I help you today?`,
        role: 'assistant' as const,
        createdAt: new Date().toISOString(),
      },
      conversationId: conversationId || `conv-${userId}-${Date.now()}`,
    };

    return NextResponse.json(mockResponse);

    // When DI container is ready, use this instead:
    /*
    const result = await useCase.execute({
      conversationId,
      userId,
      content,
    });

    return NextResponse.json({
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      conversationId: result.conversationId,
    });
    */
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: 'Failed to send message', details: errorMessage },
      { status: 500 }
    );
  }
}
