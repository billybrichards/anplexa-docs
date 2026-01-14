/**
 * Domain Entities Barrel Export
 *
 * Central export point for all domain entities used in the companions app.
 */

export {
  createUserMessage,
  createAssistantMessage,
  isUserMessage,
  isAssistantMessage,
} from './Message';
export type { Message, MessageRole } from './Message';
