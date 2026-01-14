/**
 * Password Service Configuration
 */
export interface PasswordConfig {
    saltRounds?: number;
    minLength?: number;
}
/**
 * API Key generation result
 */
export interface GeneratedApiKey {
    key: string;
    keyHash: string;
    keyPrefix: string;
}
/**
 * Password Service
 * Handles password hashing, verification, and API key generation
 *
 * @example
 * const passwordService = new PasswordService();
 *
 * // Hash a password
 * const hash = await passwordService.hashPassword('user-password');
 *
 * // Verify a password
 * const isValid = await passwordService.verifyPassword('user-password', hash);
 *
 * // Generate an API key
 * const apiKey = await passwordService.generateApiKey();
 */
export declare class PasswordService {
    private saltRounds;
    private minLength;
    constructor(config?: PasswordConfig);
    /**
     * Hash a password
     * @param password - The plain text password to hash
     * @returns Promise<string> - The bcrypt hash
     * @throws Error if password is invalid
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify a password against its hash
     * @param password - The plain text password to verify
     * @param hash - The hash to verify against
     * @returns Promise<boolean> - True if password matches
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate a random API key
     * Format: tc_{32-char-random-string}
     * @returns Promise<GeneratedApiKey> - Object with key, hash, and prefix
     */
    generateApiKey(): Promise<GeneratedApiKey>;
    /**
     * Verify an API key against its hash
     * @param key - The plain text API key
     * @param hash - The stored hash to verify against
     * @returns Promise<boolean> - True if key matches
     */
    verifyApiKey(key: string, hash: string): Promise<boolean>;
    /**
     * Validate a password strength
     * Returns validation result with details
     * @param password - The password to validate
     * @returns Validation result object
     */
    validatePasswordStrength(password: string): {
        valid: boolean;
        errors: string[];
        score: number;
    };
}
/**
 * Create a singleton password service instance
 */
export declare function createPasswordService(config?: PasswordConfig): PasswordService;
/**
 * Get or create the singleton password service instance
 */
export declare function getPasswordService(): PasswordService;
//# sourceMappingURL=password.d.ts.map