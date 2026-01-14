"use strict";
/**
 * Message Repository Implementation
 *
 * Implements the IMessageRepository interface using Drizzle ORM.
 * Handles all database operations for message entities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const crypto_1 = require("crypto");
const database_1 = require("@anplexa/database");
/**
 * Message Repository
 *
 * Provides data access operations for messages using Drizzle ORM.
 * Optimized for bulk operations and large message histories.
 */
class MessageRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get messages by conversation ID with optional pagination
     * Returns messages ordered by creation date (oldest first)
     */
    async getByConversationId(conversationId, options) {
        try {
            let query = this.db
                .select()
                .from(database_1.messages)
                .where((0, database_1.eq)(database_1.messages.conversationId, conversationId))
                .orderBy((0, database_1.asc)(database_1.messages.createdAt));
            // Apply pagination if provided (offset must come after limit in SQLite)
            if (options?.limit !== undefined) {
                query = query.limit(options.limit);
                if (options?.offset !== undefined) {
                    query = query.offset(options.offset);
                }
            }
            else if (options?.offset !== undefined) {
                // If only offset is provided, apply a default limit to make SQLite happy
                query = query.limit(100).offset(options.offset);
            }
            const results = await query;
            return results.map(this.toDTO);
        }
        catch (error) {
            throw new Error(`Failed to get messages for conversation ${conversationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Search messages within a conversation
     * Searches for the term in message content (case-insensitive)
     */
    async search(conversationId, searchTerm) {
        try {
            // Use case-insensitive LIKE search
            const searchPattern = `%${searchTerm}%`;
            const results = await this.db
                .select()
                .from(database_1.messages)
                .where((0, database_1.and)((0, database_1.eq)(database_1.messages.conversationId, conversationId), (0, database_1.like)(database_1.messages.content, searchPattern)))
                .orderBy((0, database_1.asc)(database_1.messages.createdAt));
            return results.map(this.toDTO);
        }
        catch (error) {
            throw new Error(`Failed to search messages in conversation ${conversationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a single message
     */
    async create(messageData) {
        try {
            const id = (0, crypto_1.randomUUID)();
            const createdAt = new Date().toISOString();
            const newMessage = {
                id,
                conversationId: messageData.conversationId,
                role: messageData.role,
                content: messageData.content,
                createdAt,
            };
            await this.db.insert(database_1.messages).values(newMessage);
            return this.toDTO(newMessage);
        }
        catch (error) {
            throw new Error(`Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create multiple messages in bulk
     * Uses a transaction for atomicity and better performance
     */
    async bulkCreate(messageDataArray) {
        try {
            if (messageDataArray.length === 0) {
                return [];
            }
            const createdAt = new Date().toISOString();
            // Prepare all messages with IDs and timestamps
            const newMessages = messageDataArray.map((messageData) => ({
                id: (0, crypto_1.randomUUID)(),
                conversationId: messageData.conversationId,
                role: messageData.role,
                content: messageData.content,
                createdAt,
            }));
            // Insert all messages in a single query (Drizzle handles batching)
            await this.db.insert(database_1.messages).values(newMessages);
            return newMessages.map(this.toDTO);
        }
        catch (error) {
            throw new Error(`Failed to bulk create messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a message by ID
     */
    async delete(id) {
        try {
            await this.db.delete(database_1.messages).where((0, database_1.eq)(database_1.messages.id, id));
        }
        catch (error) {
            throw new Error(`Failed to delete message ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Convert database message to DTO
     * @private
     */
    toDTO(message) {
        return {
            id: message.id,
            conversationId: message.conversationId,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt,
        };
    }
}
exports.MessageRepository = MessageRepository;
