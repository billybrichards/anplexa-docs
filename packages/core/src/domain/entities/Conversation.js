"use strict";
/**
 * Conversation Domain Entity
 *
 * Represents a conversation in the Anplexa system.
 * A conversation is a container for messages between a user and the AI.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
class Conversation {
    id;
    userId;
    title;
    createdAt;
    updatedAt;
    constructor(id, userId, title = null, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    /**
     * Update the conversation title
     * @param title - New title
     * @returns Updated conversation entity
     */
    updateTitle(title) {
        return new Conversation(this.id, this.userId, title, this.createdAt, new Date());
    }
    /**
     * Create a new conversation instance
     * @param data - Conversation creation data
     * @returns New Conversation instance
     */
    static create(data) {
        return new Conversation(data.id, data.userId, data.title ?? null, data.createdAt ?? new Date(), data.updatedAt ?? new Date());
    }
}
exports.Conversation = Conversation;
