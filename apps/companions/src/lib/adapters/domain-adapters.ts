/**
 * Domain Adapters
 *
 * Converts between @anplexa/core domain entities (with Date objects)
 * and JSON-serializable types for localStorage persistence.
 *
 * This follows the Adapter pattern from Clean Architecture, allowing
 * the domain layer to remain pure while the infrastructure layer
 * handles serialization concerns.
 */

import { Message, Conversation } from '@anplexa/core/domain/entities';

/**
 * Stored Message - JSON-serializable version for localStorage
 */
export interface StoredMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string; // ISO 8601 string instead of Date
}

/**
 * Stored Conversation - JSON-serializable version for localStorage
 */
export interface StoredConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string; // ISO 8601 string instead of Date
  updatedAt: string; // ISO 8601 string instead of Date
}

/**
 * Convert core Message entity to storable format
 */
export function messageToStored(message: Message): StoredMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

/**
 * Convert stored message to core Message entity
 */
export function storedToMessage(stored: StoredMessage): Message {
  return new Message(
    stored.id,
    stored.conversationId,
    stored.role,
    stored.content,
    new Date(stored.createdAt)
  );
}

/**
 * Convert core Conversation entity to storable format
 */
export function conversationToStored(conversation: Conversation): StoredConversation {
  return {
    id: conversation.id,
    userId: conversation.userId,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

/**
 * Convert stored conversation to core Conversation entity
 */
export function storedToConversation(stored: StoredConversation): Conversation {
  return new Conversation(
    stored.id,
    stored.userId,
    stored.title,
    new Date(stored.createdAt),
    new Date(stored.updatedAt)
  );
}

/**
 * Batch conversion helpers
 */
export function messagesToStored(messages: Message[]): StoredMessage[] {
  return messages.map(messageToStored);
}

export function storedToMessages(stored: StoredMessage[]): Message[] {
  return stored.map(storedToMessage);
}

export function conversationsToStored(conversations: Conversation[]): StoredConversation[] {
  return conversations.map(conversationToStored);
}

export function storedToConversations(stored: StoredConversation[]): Conversation[] {
  return stored.map(storedToConversation);
}
