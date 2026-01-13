import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as emailClient from './client.js';
import * as emailTemplates from './templates.js';
import * as emailResend from './resend.js';

// Mock Resend SDK
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      }),
    },
  })),
}));

describe('Email Client', () => {
  beforeEach(() => {
    emailClient.clearCache();
    process.env.RESEND_API_KEY = 're_test_123456789';
    process.env.RESEND_FROM_EMAIL = 'noreply@anplexa.com';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it('should get Resend client', async () => {
    const client = await emailClient.getResendClient();
    expect(client).toBeDefined();
  });

  it('should get from email address', async () => {
    const fromEmail = await emailClient.getFromEmail();
    expect(fromEmail).toBe('noreply@anplexa.com');
  });

  it('should cache credentials', async () => {
    const email1 = await emailClient.getFromEmail();
    const email2 = await emailClient.getFromEmail();
    expect(email1).toBe(email2);
  });

  it('should clear cache', async () => {
    await emailClient.getFromEmail();
    emailClient.clearCache();
    const email = await emailClient.getFromEmail();
    expect(email).toBe('noreply@anplexa.com');
  });

  it('should throw error if no credentials configured', async () => {
    emailClient.clearCache();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.REPLIT_CONNECTORS_HOSTNAME;

    await expect(emailClient.getFromEmail()).rejects.toThrow();
  });
});

describe('Email Templates', () => {
  it('should wrap email with Anplexa styling', () => {
    const content = '<p>Test content</p>';
    const wrapped = emailTemplates.wrapEmail(content);

    expect(wrapped).toContain('anplexa');
    expect(wrapped).toContain(content);
    expect(wrapped).toContain('<!DOCTYPE html>');
    expect(wrapped).toContain('Private. Intimate. Luxurious');
  });

  it('should build tracking URL correctly', () => {
    const url = emailTemplates.buildTrackingUrl(
      'https://anplexa.com/dash',
      'welcome',
      'user-123'
    );

    expect(url).toContain('src=email');
    expect(url).toContain('campaign=welcome');
    expect(url).toContain('uid=user-123');
  });

  it('should create welcome email template', () => {
    const email = emailTemplates.welcomeEmail('John Doe');

    expect(email.subject).toBe('Welcome to Anplexa');
    expect(email.html).toContain('John Doe');
    expect(email.html).toContain('10 messages');
  });

  it('should create subscription confirmation email template', () => {
    const email = emailTemplates.subscriptionConfirmationEmail('Jane Doe', 'pro');

    expect(email.subject).toBe('You\'re all set');
    expect(email.html).toContain('Jane Doe');
    expect(email.html).toContain('Unlimited conversations');
  });

  it('should create password reset email template', () => {
    const resetLink = 'https://anplexa.com/reset?token=abc123';
    const email = emailTemplates.passwordResetEmail(resetLink);

    expect(email.subject).toBe('Reset your password');
    expect(email.html).toContain(resetLink);
    expect(email.html).toContain('This link expires in 1 hour');
  });

  it('should create magic link email template', () => {
    const magicLink = 'https://anplexa.com/auth/magic-link/verify?token=xyz789';
    const email = emailTemplates.magicLinkEmail(magicLink);

    expect(email.subject).toBe('Your login link');
    expect(email.html).toContain(magicLink);
    expect(email.html).toContain('This link expires in 15 minutes');
  });

  it('should create email verification template', () => {
    const verificationLink = 'https://anplexa.com/verify?token=verify123';
    const email = emailTemplates.emailVerificationEmail(verificationLink);

    expect(email.subject).toBe('Verify your email address');
    expect(email.html).toContain(verificationLink);
    expect(email.html).toContain('24 hours');
  });

  it('should create refund confirmation email template', () => {
    const email = emailTemplates.refundConfirmationEmail();

    expect(email.subject).toBe('Thanks for trying Anplexa');
    expect(email.html).toContain('No hard feelings');
  });

  it('should create trial expiring email template', () => {
    const email = emailTemplates.trialExpiringEmail(3);

    expect(email.subject).toContain('3 days');
    expect(email.html).toContain('3 day');
  });

  it('should create invoice email template', () => {
    const email = emailTemplates.invoiceEmail(
      'https://invoice.anplexa.com/inv-123',
      '$9.99',
      'January 13, 2025'
    );

    expect(email.subject).toBe('Your Anplexa invoice');
    expect(email.html).toContain('$9.99');
    expect(email.html).toContain('January 13, 2025');
  });

  it('should create payment failed email template', () => {
    const email = emailTemplates.paymentFailedEmail('https://billing.anplexa.com/update');

    expect(email.subject).toContain('Payment failed');
    expect(email.html).toContain('payment method');
  });

  it('should create subscription canceled email template', () => {
    const email = emailTemplates.subscriptionCanceledEmail();

    expect(email.subject).toContain('canceled');
    expect(email.html).toContain('reactivate');
  });

  it('should create custom email template', () => {
    const email = emailTemplates.customEmail(
      'Custom Subject',
      '<p>Custom content</p>'
    );

    expect(email.subject).toBe('Custom Subject');
    expect(email.html).toContain('Custom content');
    expect(email.html).toContain('anplexa');
  });
});

describe('Email Service (Resend)', () => {
  beforeEach(() => {
    emailClient.clearCache();
    process.env.RESEND_API_KEY = 're_test_123456789';
    process.env.RESEND_FROM_EMAIL = 'noreply@anplexa.com';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it('should validate email addresses', () => {
    expect(emailResend.isValidEmail('test@example.com')).toBe(true);
    expect(emailResend.isValidEmail('invalid.email')).toBe(false);
    expect(emailResend.isValidEmail('test@')).toBe(false);
    expect(emailResend.isValidEmail('@example.com')).toBe(false);
  });

  it('should sanitize email addresses', () => {
    expect(emailResend.sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    expect(emailResend.sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    expect(emailResend.sanitizeEmail('TeSt@ExAmPlE.CoM')).toBe('test@example.com');
  });

  it('should send email', async () => {
    const result = await emailResend.sendEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('email_123');
  });

  it('should send template email', async () => {
    const template = emailTemplates.welcomeEmail('John');
    const result = await emailResend.sendTemplateEmail('user@example.com', template);

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should handle email sending options', async () => {
    const result = await emailResend.sendEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test</p>',
      replyTo: 'support@anplexa.com',
      cc: ['manager@anplexa.com'],
      bcc: ['log@anplexa.com'],
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'userId', value: 'user-123' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should send batch emails', async () => {
    const emails = [
      { to: 'user1@example.com', subject: 'Test 1', html: '<p>Test 1</p>' },
      { to: 'user2@example.com', subject: 'Test 2', html: '<p>Test 2</p>' },
      { to: 'user3@example.com', subject: 'Test 3', html: '<p>Test 3</p>' },
    ];

    const results = await emailResend.sendBatchEmails(emails);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should send email with retry logic', async () => {
    const result = await emailResend.sendEmailWithRetry(
      {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      },
      3,
      100
    );

    expect(result.success).toBe(true);
  });
});

describe('Email Integration', () => {
  beforeEach(() => {
    emailClient.clearCache();
    process.env.RESEND_API_KEY = 're_test_123456789';
    process.env.RESEND_FROM_EMAIL = 'noreply@anplexa.com';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it('should send welcome email to new user', async () => {
    const template = emailTemplates.welcomeEmail('Alice Smith');
    const result = await emailResend.sendTemplateEmail('alice@example.com', template);

    expect(result.success).toBe(true);
  });

  it('should send password reset email', async () => {
    const resetLink = 'https://anplexa.com/reset?token=abc123xyz';
    const template = emailTemplates.passwordResetEmail(resetLink);
    const result = await emailResend.sendTemplateEmail('user@example.com', template);

    expect(result.success).toBe(true);
  });

  it('should send subscription confirmation email', async () => {
    const template = emailTemplates.subscriptionConfirmationEmail('Bob Johnson', 'pro');
    const result = await emailResend.sendTemplateEmail('bob@example.com', template);

    expect(result.success).toBe(true);
  });

  it('should track email campaigns', async () => {
    const template = emailTemplates.welcomeEmail('Carol');
    const result = await emailResend.sendTemplateEmail('carol@example.com', template, {
      tags: [
        { name: 'campaign', value: 'launch' },
        { name: 'cohort', value: 'early-access' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
