/* global console, setTimeout */
import { getResendClient, getFromEmail } from './client';
/**
 * Send email using Resend
 */
export async function sendEmail(options) {
    try {
        const client = await getResendClient();
        const fromEmail = await getFromEmail();
        const response = await client.emails.send({
            from: fromEmail,
            to: options.to,
            subject: options.subject,
            html: options.html,
            reply_to: options.reply_to,
            cc: options.cc,
            bcc: options.bcc,
            tags: options.tags,
        });
        if (response.error) {
            console.error(`Failed to send email to ${options.to}:`, response.error);
            return {
                success: false,
                error: response.error.message || 'Failed to send email',
            };
        }
        console.log(`Email sent successfully to ${options.to}. Message ID: ${response.data?.id}`);
        return {
            success: true,
            messageId: response.data?.id,
        };
    }
    catch (error) {
        console.error(`Error sending email to ${options.to}:`, error);
        return {
            success: false,
            error: error.message || 'Unknown error',
        };
    }
}
/**
 * Send templated email
 */
export async function sendTemplateEmail(to, template, options) {
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        ...options,
    });
}
/**
 * Send batch emails
 */
export async function sendBatchEmails(emails) {
    const results = await Promise.all(emails.map((email) => sendEmail(email)));
    return results;
}
/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(options, maxRetries = 3, delayMs = 1000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await sendEmail(options);
        if (result.success) {
            return result;
        }
        lastError = result;
        if (attempt < maxRetries) {
            console.log(`Email send attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return lastError || {
        success: false,
        error: 'Max retries exceeded',
    };
}
/**
 * Verify email address is valid (basic check)
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Sanitize email address
 */
export function sanitizeEmail(email) {
    return email.toLowerCase().trim();
}
