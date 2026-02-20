/**
 * Email template definitions for Anplexa
 */
/**
 * Wrap email content with Anplexa styling and layout
 */
export declare function wrapEmail(content: string): string;
/**
 * Build tracking URL for email campaigns
 */
export declare function buildTrackingUrl(baseUrl: string, campaign: string, userId: string): string;
export interface EmailTemplate {
    subject: string;
    html: string;
}
/**
 * Welcome email for new users
 */
export declare function welcomeEmail(displayName: string): EmailTemplate;
/**
 * Subscription confirmation email
 */
export declare function subscriptionConfirmationEmail(displayName: string, _plan: string): EmailTemplate;
/**
 * Password reset email
 */
export declare function passwordResetEmail(resetLink: string): EmailTemplate;
/**
 * Magic link login email
 */
export declare function magicLinkEmail(magicLink: string): EmailTemplate;
/**
 * Email verification email
 */
export declare function emailVerificationEmail(verificationLink: string): EmailTemplate;
/**
 * Refund confirmation email
 */
export declare function refundConfirmationEmail(): EmailTemplate;
/**
 * Free trial expiring soon notification
 */
export declare function trialExpiringEmail(daysLeft: number): EmailTemplate;
/**
 * Invoice email
 */
export declare function invoiceEmail(invoiceUrl: string, amount: string, date: string): EmailTemplate;
/**
 * Payment failed notification
 */
export declare function paymentFailedEmail(retryUrl: string): EmailTemplate;
/**
 * Subscription canceled confirmation
 */
export declare function subscriptionCanceledEmail(): EmailTemplate;
/**
 * Custom email template
 */
export declare function customEmail(subject: string, content: string): EmailTemplate;
//# sourceMappingURL=templates.d.ts.map