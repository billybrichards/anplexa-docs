"use strict";
/**
 * Message Domain Entity
 *
 * Represents a message in a conversation.
 * Messages can be from the user or the assistant.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
class Message {
    id;
    conversationId;
    role;
    content;
    createdAt;
    constructor(id, conversationId, role, content, createdAt = new Date()) {
        this.id = id;
        this.conversationId = conversationId;
        this.role = role;
        this.content = content;
        this.createdAt = createdAt;
    }
    /**
     * Check if this is a user message
     * @returns true if message is from user
     */
    isUserMessage() {
        return this.role === 'user';
    }
    /**
     * Check if this is an assistant message
     * @returns true if message is from assistant
     */
    isAssistantMessage() {
        return this.role === 'assistant';
    }
    /**
     * Get the display name for the message role
     * @returns Human-readable role name
     */
    getRoleDisplayName() {
        switch (this.role) {
            case 'user':
                return 'You';
            case 'assistant':
                return 'Anplexa';
            case 'system':
                return 'System';
            default:
                return 'Unknown';
        }
    }
    /**
     * Create a new message instance
     * @param data - Message creation data
     * @returns New Message instance
     */
    static create(data) {
        return new Message(data.id, data.conversationId, data.role, data.content, data.createdAt ?? new Date());
    }
}
exports.Message = Message;
