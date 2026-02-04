import { Resend } from 'resend';
/**
 * Get Resend client instance
 */
export declare function getResendClient(): Promise<Resend>;
/**
 * Get the from email address configured for Resend
 */
export declare function getFromEmail(): Promise<string>;
/**
 * Clear cached credentials and client (useful for testing)
 */
export declare function clearEmailCache(): void;
//# sourceMappingURL=client.d.ts.map