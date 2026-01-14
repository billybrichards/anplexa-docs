"use strict";
/**
 * Conversation Repository Implementation
 *
 * Implements IConversationRepository using Drizzle ORM for data access.
 * Handles conversation persistence with PostgreSQL and SQLite support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationRepository = exports.ConversationRepositoryError = exports.ConversationNotFoundError = void 0;
const database_1 = require("@anplexa/database");
/**
 * Repository errors
 */
class ConversationNotFoundError extends Error {
    constructor(id) {
        super(`Conversation with id "${id}" not found`);
        this.name = 'ConversationNotFoundError';
    }
}
exports.ConversationNotFoundError = ConversationNotFoundError;
class ConversationRepositoryError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'ConversationRepositoryError';
    }
}
exports.ConversationRepositoryError = ConversationRepositoryError;
/**
 * Conversation repository implementation using Drizzle ORM
 */
class ConversationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get a conversation by ID
     */
    async getById(id) {
        try {
            const result = await this.db
                .select()
                .from(database_1.conversations)
                .where((0, database_1.eq)(database_1.conversations.id, id))
                .limit(1);
            return result[0] || null;
        }
        catch (error) {
            throw new ConversationRepositoryError(`Failed to get conversation by id: ${id}`, error);
        }
    }
    /**
     * Get all conversations for a user with optional pagination
     */
    async getByUserId(userId, options) {
        try {
            const { limit = 50, offset = 0 } = options || {};
            const result = await this.db
                .select()
                .from(database_1.conversations)
                .where((0, database_1.eq)(database_1.conversations.userId, userId))
                .orderBy((0, database_1.desc)(database_1.conversations.updatedAt))
                .limit(limit)
                .offset(offset);
            return result;
        }
        catch (error) {
            throw new ConversationRepositoryError(`Failed to get conversations for user: ${userId}`, error);
        }
    }
    /**
     * Search conversations by content in messages
     * Searches through message content and conversation titles
     */
    async searchByContent(userId, searchTerm) {
        try {
            // Search in conversation titles and message content
            // Using a subquery to find conversations with matching messages
            const searchPattern = `%${searchTerm}%`;
            const result = await this.db
                .selectDistinct({
                id: database_1.conversations.id,
                userId: database_1.conversations.userId,
                title: database_1.conversations.title,
                createdAt: database_1.conversations.createdAt,
                updatedAt: database_1.conversations.updatedAt,
            })
                .from(database_1.conversations)
                .leftJoin(database_1.messages, (0, database_1.eq)(database_1.conversations.id, database_1.messages.conversationId))
                .where((0, database_1.and)((0, database_1.eq)(database_1.conversations.userId, userId), (0, database_1.sql) `(${database_1.conversations.title} LIKE ${searchPattern} OR ${database_1.messages.content} LIKE ${searchPattern})`))
                .orderBy((0, database_1.desc)(database_1.conversations.updatedAt));
            return result;
        }
        catch (error) {
            throw new ConversationRepositoryError(`Failed to search conversations for user: ${userId}`, error);
        }
    }
    /**
     * Create a new conversation
     */
    async create(conversationData) {
        try {
            const now = new Date().toISOString();
            const newConversation = {
                id: conversationData.id,
                userId: conversationData.userId,
                title: conversationData.title || null,
                createdAt: conversationData.createdAt || now,
                updatedAt: conversationData.updatedAt || now,
            };
            const result = await this.db
                .insert(database_1.conversations)
                .values(newConversation)
                .returning();
            return result[0];
        }
        catch (error) {
            throw new ConversationRepositoryError('Failed to create conversation', error);
        }
    }
    /**
     * Update an existing conversation
     */
    async update(id, updates) {
        try {
            // First check if conversation exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new ConversationNotFoundError(id);
            }
            // Update with new timestamp
            const updateData = {
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            const result = await this.db
                .update(database_1.conversations)
                .set(updateData)
                .where((0, database_1.eq)(database_1.conversations.id, id))
                .returning();
            return result[0];
        }
        catch (error) {
            if (error instanceof ConversationNotFoundError) {
                throw error;
            }
            throw new ConversationRepositoryError(`Failed to update conversation: ${id}`, error);
        }
    }
    /**
     * Delete a conversation and its associated messages
     */
    async delete(id) {
        try {
            // Check if conversation exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new ConversationNotFoundError(id);
            }
            // Delete associated messages first (foreign key constraint)
            await this.db.delete(database_1.messages).where((0, database_1.eq)(database_1.messages.conversationId, id));
            // Delete the conversation
            await this.db.delete(database_1.conversations).where((0, database_1.eq)(database_1.conversations.id, id));
        }
        catch (error) {
            if (error instanceof ConversationNotFoundError) {
                throw error;
            }
            throw new ConversationRepositoryError(`Failed to delete conversation: ${id}`, error);
        }
    }
}
exports.ConversationRepository = ConversationRepository;
