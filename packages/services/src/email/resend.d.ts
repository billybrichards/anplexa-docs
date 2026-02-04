import type { EmailTemplate } from './templates';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    reply_to?: string;
    cc?: string[];
    bcc?: string[];
    tags?: {
        name: string;
        value: string;
    }[];
}
export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Send email using Resend
 */
export declare function sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
/**
 * Send templated email
 */
export declare function sendTemplateEmail(to: string, template: EmailTemplate, options?: {
    reply_to?: string;
    cc?: string[];
    bcc?: string[];
    tags?: {
        name: string;
        value: string;
    }[];
}): Promise<SendEmailResult>;
/**
 * Send batch emails
 */
export declare function sendBatchEmails(emails: SendEmailOptions[]): Promise<SendEmailResult[]>;
/**
 * Send email with retry logic
 */
export declare function sendEmailWithRetry(options: SendEmailOptions, maxRetries?: number, delayMs?: number): Promise<SendEmailResult>;
/**
 * Verify email address is valid (basic check)
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Sanitize email address
 */
export declare function sanitizeEmail(email: string): string;
//# sourceMappingURL=resend.d.ts.map