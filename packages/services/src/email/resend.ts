import { getResendClient, getFromEmail } from './client.js';
import type { EmailTemplate } from './templates.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
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
  } catch (error: any) {
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
export async function sendTemplateEmail(
  to: string,
  template: EmailTemplate,
  options?: {
    reply_to?: string;
    cc?: string[];
    bcc?: string[];
    tags?: { name: string; value: string }[];
  }
): Promise<SendEmailResult> {
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
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  const results = await Promise.all(
    emails.map((email) => sendEmail(email))
  );
  return results;
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: SendEmailOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<SendEmailResult> {
  let lastError: SendEmailResult | null = null;

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
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
