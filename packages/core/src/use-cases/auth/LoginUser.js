"use strict";
/**
 * Login User Use Case
 *
 * Orchestrates the login flow:
 * 1. Finds user by email
 * 2. Validates password
 * 3. Creates session with refresh token
 * 4. Returns access and refresh tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUser = void 0;
class LoginUser {
    userRepository;
    sessionRepository;
    constructor(userRepository, sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }
    async execute(request) {
        // TODO: Implement login logic
        // 1. Validate input
        // 2. Find user by email
        // 3. Validate password
        // 4. Create session
        // 5. Generate tokens
        // 6. Return response
        throw new Error('LoginUser.execute() must be implemented');
    }
}
exports.LoginUser = LoginUser;
