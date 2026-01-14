"use strict";
/**
 * Register User Use Case
 *
 * Orchestrates the user registration flow:
 * 1. Validates input
 * 2. Checks if email already exists
 * 3. Creates new user entity
 * 4. Persists user
 * 5. Returns user data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUser = void 0;
class RegisterUser {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        // TODO: Implement register logic
        // 1. Validate input
        // 2. Check if email exists
        // 3. Hash password
        // 4. Create user entity
        // 5. Persist user
        // 6. Return response
        throw new Error('RegisterUser.execute() must be implemented');
    }
}
exports.RegisterUser = RegisterUser;
