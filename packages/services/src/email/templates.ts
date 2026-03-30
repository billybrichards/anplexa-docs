/**
 * Email template definitions for Anplexa
 */

const ANPLEXA_BRAND_COLOR = '#7B2CBF';
const ANPLEXA_DARK_BG = '#121212';
const ANPLEXA_CARD_BG = '#1a1a1a';
const ANPLEXA_TEXT = '#E0E1DD';
const ANPLEXA_MUTED = '#9CA3AF';
const ANPLEXA_BORDER = '#333';

const anplexaStyles = `
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${ANPLEXA_DARK_BG};
    color: ${ANPLEXA_TEXT};
    margin: 0;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: ${ANPLEXA_CARD_BG};
    border-radius: 12px;
    padding: 40px;
    border: 1px solid ${ANPLEXA_BORDER};
  }
  .logo {
    color: ${ANPLEXA_BRAND_COLOR};
    font-size: 24px;
    font-weight: 300;
    margin-bottom: 30px;
    letter-spacing: 2px;
  }
  h1 {
    color: ${ANPLEXA_TEXT};
    font-size: 22px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  p {
    line-height: 1.7;
    color: ${ANPLEXA_MUTED};
    margin-bottom: 16px;
    font-size: 15px;
  }
  .btn {
    display: inline-block;
    background: ${ANPLEXA_BRAND_COLOR};
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 500;
    margin: 24px 0;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .btn-secondary {
    display: inline-block;
    background: transparent;
    border: 1px solid ${ANPLEXA_BRAND_COLOR};
    color: ${ANPLEXA_BRAND_COLOR} !important;
    text-decoration: none;
    padding: 12px 28px;
    border-radius: 8px;
    font-weight: 500;
    margin: 16px 8px 16px 0;
    font-size: 14px;
  }
  .highlight {
    background: ${ANPLEXA_DARK_BG};
    border-left: 3px solid ${ANPLEXA_BRAND_COLOR};
    padding: 16px 20px;
    margin: 24px 0;
    border-radius: 0 8px 8px 0;
  }
  .highlight p { margin: 0; }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid ${ANPLEXA_BORDER};
    font-size: 12px;
    color: #666;
  }
  .footer a { color: #666; text-decoration: none; }
  .muted { color: #666; font-size: 13px; }
  .price { color: ${ANPLEXA_BRAND_COLOR}; font-weight: 600; }
`;

/**
 * Wrap email content with Anplexa styling and layout
 */
export function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${anplexaStyles}</style>
</head>
<body>
  <div class="container">
    <div class="logo">anplexa</div>
    ${content}
    <div class="footer">
      <p>&copy; 2025 Anplexa. Private. Intimate. Luxurious.</p>
      <p><a href="https://anplexa.com/privacy">Privacy</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Build tracking URL for email campaigns
 */
export function buildTrackingUrl(baseUrl: string, campaign: string, userId: string): string {
  return `${baseUrl}?src=email&campaign=${campaign}&uid=${userId}`;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Welcome email for new users
 */
export function welcomeEmail(displayName: string): EmailTemplate {
  return {
    subject: 'Welcome to Anplexa',
    html: wrapEmail(`
      <h1>Welcome, ${displayName}.</h1>
      <p>You now have access to your private AI companion.</p>
      <p>Your free tier includes <strong>10 messages</strong> to see if it feels right.</p>
      <div class="highlight">
        <p>Everything stays between you and your companion. No tracking. No judgment.</p>
      </div>
    `),
  };
}

/**
 * Subscription confirmation email
 */
export function subscriptionConfirmationEmail(displayName: string, _plan: string): EmailTemplate {
  return {
    subject: 'You\'re all set',
    html: wrapEmail(`
      <h1>You're all set, ${displayName}.</h1>
      <p>Your subscription is now active.</p>
      <p>Unlimited conversations. No restrictions.</p>
      <div class="highlight">
        <p>Private. Intimate. Yours.</p>
      </div>
      <a href="https://anplexa.com/dash" class="btn">Open Anplexa</a>
    `),
  };
}

/**
 * Password reset email
 */
export function passwordResetEmail(resetLink: string): EmailTemplate {
  return {
    subject: 'Reset your password',
    html: wrapEmail(`
      <h1>Reset your password</h1>
      <p>We received a request to reset your password.</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <div class="highlight">
        <p><strong>This link expires in 1 hour.</strong></p>
        <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <p class="muted">Or copy this link: ${resetLink}</p>
    `),
  };
}

/**
 * Magic link login email
 */
export function magicLinkEmail(magicLink: string): EmailTemplate {
  return {
    subject: 'Your login link',
    html: wrapEmail(`
      <h1>Your login link</h1>
      <p>Click below to sign in to Anplexa. No password needed.</p>
      <a href="${magicLink}" class="btn">Sign In</a>
      <div class="highlight">
        <p><strong>This link expires in 15 minutes.</strong></p>
        <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <p class="muted">Or copy this link: ${magicLink}</p>
    `),
  };
}

/**
 * Email verification email
 */
export function emailVerificationEmail(verificationLink: string): EmailTemplate {
  return {
    subject: 'Verify your email address',
    html: wrapEmail(`
      <h1>Verify your email address</h1>
      <p>Click below to verify your email and activate your account.</p>
      <a href="${verificationLink}" class="btn">Verify Email</a>
      <div class="highlight">
        <p><strong>This link expires in 24 hours.</strong></p>
        <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `),
  };
}

/**
 * Email verification code email (6-digit code for inline verification)
 */
export function emailVerificationCodeEmail(code: string): EmailTemplate {
  return {
    subject: `${code} is your Anplexa verification code`,
    html: wrapEmail(`
      <h1>Your verification code</h1>
      <p>Enter this code to verify your email and start chatting with your cosmic companion.</p>
      <div class="highlight" style="text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: 700; padding: 20px;">
        ${code}
      </div>
      <p class="muted">This code expires in 15 minutes. If you didn't sign up for Anplexa, you can safely ignore this email.</p>
    `),
  };
}

/**
 * Refund confirmation email
 */
export function refundConfirmationEmail(): EmailTemplate {
  return {
    subject: 'Thanks for trying Anplexa',
    html: wrapEmail(`
      <h1>Thanks for trying Anplexa</h1>
      <p>No hard feelings.</p>
      <p>If you ever want to try again, you're welcome back.</p>
    `),
  };
}

/**
 * Free trial expiring soon notification
 */
export function trialExpiringEmail(daysLeft: number): EmailTemplate {
  return {
    subject: `Your free trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: wrapEmail(`
      <h1>Your trial is expiring soon</h1>
      <p>You have <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> left to use Anplexa for free.</p>
      <p>Ready to continue? Choose a plan:</p>
      <div class="highlight">
        <p><span class="price">£0.99/month</span> — Locked in forever (early access)</p>
        <p><span class="price">£2.99/month</span> — Standard</p>
      </div>
      <a href="https://anplexa.com/subscribe" class="btn">Choose a Plan</a>
    `),
  };
}

/**
 * Invoice email
 */
export function invoiceEmail(invoiceUrl: string, amount: string, date: string): EmailTemplate {
  return {
    subject: 'Your Anplexa invoice',
    html: wrapEmail(`
      <h1>Invoice</h1>
      <p>Here's a summary of your recent payment.</p>
      <div class="highlight">
        <p>Amount: <span class="price">${amount}</span></p>
        <p>Date: ${date}</p>
      </div>
      <a href="${invoiceUrl}" class="btn">View Invoice</a>
    `),
  };
}

/**
 * Payment failed notification
 */
export function paymentFailedEmail(retryUrl: string): EmailTemplate {
  return {
    subject: 'Payment failed for your Anplexa subscription',
    html: wrapEmail(`
      <h1>Payment failed</h1>
      <p>We couldn't process your payment for your Anplexa subscription.</p>
      <p>Your account access may be limited. Please update your payment method to continue.</p>
      <a href="${retryUrl}" class="btn">Update Payment Method</a>
      <p class="muted">If you have questions, contact us at support@anplexa.com</p>
    `),
  };
}

/**
 * Subscription canceled confirmation
 */
export function subscriptionCanceledEmail(): EmailTemplate {
  return {
    subject: 'Your Anplexa subscription has been canceled',
    html: wrapEmail(`
      <h1>We'll miss you</h1>
      <p>Your subscription has been canceled.</p>
      <p>You can reactivate your subscription at any time if you change your mind.</p>
      <a href="https://anplexa.com/reactivate" class="btn">Reactivate</a>
    `),
  };
}

/**
 * Custom email template
 */
export function customEmail(subject: string, content: string): EmailTemplate {
  return {
    subject,
    html: wrapEmail(content),
  };
}
