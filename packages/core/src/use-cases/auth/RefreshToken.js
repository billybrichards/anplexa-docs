"use strict";
/**
 * Refresh Token Use Case
 *
 * Orchestrates the token refresh flow:
 * 1. Validates refresh token
 * 2. Checks session validity
 * 3. Generates new access token
 * 4. Optionally rotates refresh token
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
class RefreshToken {
    sessionRepository;
    userRepository;
    constructor(sessionRepository, userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }
    async execute(request) {
        // TODO: Implement refresh token logic
        // 1. Find session by refresh token
        // 2. Validate session is active and not expired
        // 3. Load user
        // 4. Generate new access token
        // 5. Optionally rotate refresh token
        // 6. Return response
        throw new Error('RefreshToken.execute() must be implemented');
    }
}
exports.RefreshToken = RefreshToken;
