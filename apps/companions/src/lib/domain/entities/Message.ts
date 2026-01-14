/**
 * Message Entity
 *
 * Represents a message in a conversation.
 * This is a frontend representation that mirrors the backend MessageDTO.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

/**
 * Create a new user message
 */
export function createUserMessage(
  conversationId: string,
  content: string,
  id?: string
): Message {
  return {
    id: id || crypto.getRandomValues(new Uint8Array(16)).join(''),
    conversationId,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a new assistant message
 */
export function createAssistantMessage(
  conversationId: string,
  content: string,
  id?: string
): Message {
  return {
    id: id || crypto.getRandomValues(new Uint8Array(16)).join(''),
    conversationId,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check if a message is from the user
 */
export function isUserMessage(message: Message): boolean {
  return message.role === 'user';
}

/**
 * Check if a message is from the assistant
 */
export function isAssistantMessage(message: Message): boolean {
  return message.role === 'assistant';
}
