"use strict";
/**
 * User Domain Entity
 *
 * Represents a user in the Anplexa system.
 * Contains domain behavior specific to users (password validation, etc.)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    email;
    passwordHash;
    isVerified;
    displayName;
    chatName;
    personalityMode;
    isAdmin;
    credits;
    stripeCustomerId;
    createdAt;
    updatedAt;
    constructor(id, email, passwordHash, isVerified, displayName = null, chatName = null, personalityMode = null, isAdmin = false, credits = 0, stripeCustomerId = null, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.isVerified = isVerified;
        this.displayName = displayName;
        this.chatName = chatName;
        this.personalityMode = personalityMode;
        this.isAdmin = isAdmin;
        this.credits = credits;
        this.stripeCustomerId = stripeCustomerId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    /**
     * Validate a password against the user's password hash
     * Implementation should use bcrypt.compare or similar
     * @param _password - Plain text password to validate (unused in placeholder)
     * @returns true if password is valid, false otherwise
     */
    async validatePassword(_password) {
        // This is a placeholder - actual implementation in infrastructure
        throw new Error('validatePassword must be implemented in infrastructure layer');
    }
    /**
     * Check if user has sufficient credits
     * @param requiredCredits - Number of credits needed
     * @returns true if user has sufficient credits
     */
    hasSufficientCredits(requiredCredits) {
        return this.credits >= requiredCredits;
    }
    /**
     * Create a new user instance
     * @param data - User creation data
     * @returns New User instance
     */
    static create(data) {
        return new User(data.id, data.email, data.passwordHash, data.isVerified ?? false, data.displayName ?? null, data.chatName ?? null, data.personalityMode ?? null, data.isAdmin ?? false, data.credits ?? 0, data.stripeCustomerId ?? null, data.createdAt ?? new Date(), data.updatedAt ?? new Date());
    }
}
exports.User = User;
