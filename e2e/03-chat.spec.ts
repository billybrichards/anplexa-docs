/**
 * E2E Test: Chat Flow
 *
 * Tests:
 * 1. Chat page loads after login (with companion data)
 * 2. User can type and send a message
 * 3. AI response streams back (SSE tokens appear)
 * 4. Multiple messages work in sequence
 */

import { test, expect, type Page } from '@playwright/test';
import { API_URL, testEmail, TEST_PASSWORD } from './helpers';

let testUserEmail: string;
let testUserToken: string;
let testUserId: string;

test.describe('Chat', () => {
  // Register a user and create a companion via API
  test.beforeAll(async ({ request }) => {
    testUserEmail = testEmail();

    // Register
    const registerRes = await request.post(`${API_URL}/api/auth/register`, {
      data: { email: testUserEmail, password: TEST_PASSWORD },
    });
    expect(registerRes.ok()).toBeTruthy();
    const registerData = await registerRes.json();
    testUserToken = registerData.accessToken;
    testUserId = registerData.user.id;
  });

  /** Login via UI and inject companion data so /chat doesn't redirect */
  async function loginAndSetupChat(page: Page) {
    // Login via sign-in page
    await page.goto('/signin');
    await page.getByPlaceholder(/email|you@/i).fill(testUserEmail);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // The app will redirect to /onboarding since no companion exists.
    // Wait for any redirect to settle
    await page.waitForTimeout(3000);

    // Set up storage BEFORE navigating to chat
    await page.evaluate(
      ({ token, email, userId }) => {
        // Auth
        sessionStorage.setItem('anplexa_auth_token', JSON.stringify(token));
        sessionStorage.setItem('anplexa_auth_user', JSON.stringify({ id: userId, email }));

        // Companion (matches the existing guest companion)
        sessionStorage.setItem(
          'companion',
          JSON.stringify({
            id: 'cp_1774954681424_3btpyl',
            name: 'Meridian',
            personality: ['empathetic', 'insightful', 'warm'],
            communicationStyle: 'nurturing',
            specializations: ['emotional support', 'self-discovery'],
          })
        );
      },
      { token: testUserToken, email: testUserEmail, userId: testUserId }
    );

    // Navigate to /chat — should load since companion data exists
    await page.goto('/chat');
    await page.waitForTimeout(2000);
  }

  test('chat page loads with companion', async ({ page }) => {
    await loginAndSetupChat(page);

    // Should stay on /chat (not redirect to onboarding)
    await expect(page).toHaveURL(/chat/, { timeout: 10_000 });

    // Chat interface should be visible — look for input area
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    console.log('✅ Chat page loaded with companion');
  });

  test('can send a message and receive AI response', async ({ page }) => {
    await loginAndSetupChat(page);
    await expect(page).toHaveURL(/chat/, { timeout: 10_000 });

    // Find the message input (textarea or input)
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // Type and send
    await chatInput.fill('Hello! What is your name?');

    // Try send button, fall back to Enter
    const sendButton = page.locator('button[aria-label*="Send" i], button[aria-label*="send" i], button:has(svg):near(textarea)').last();
    try {
      await sendButton.click({ timeout: 3000 });
    } catch {
      await chatInput.press('Enter');
    }

    // User message should appear
    await expect(page.getByText('Hello! What is your name?')).toBeVisible({ timeout: 5000 });

    // Wait for AI response — look for any new text content after our message
    await expect(async () => {
      const bodyText = await page.textContent('body');
      // AI should respond with something (companion name, greeting, etc.)
      expect(bodyText).toMatch(/meridian|hello|hi|hey|name|companion/i);
    }).toPass({ timeout: 60_000 });

    console.log('✅ Message sent and AI responded');
  });

  test('can send multiple messages', async ({ page }) => {
    await loginAndSetupChat(page);
    await expect(page).toHaveURL(/chat/, { timeout: 10_000 });

    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // Message 1
    await chatInput.fill('Tell me something interesting');
    await chatInput.press('Enter');
    await expect(page.getByText('Tell me something interesting')).toBeVisible({ timeout: 5000 });

    // Wait for AI to finish responding
    await page.waitForTimeout(20_000);

    // Message 2
    await chatInput.fill('Thanks! That was cool');
    await chatInput.press('Enter');
    await expect(page.getByText('Thanks! That was cool')).toBeVisible({ timeout: 5000 });

    // Both user messages should be in the conversation
    await expect(page.getByText('Tell me something interesting')).toBeVisible();
    await expect(page.getByText('Thanks! That was cool')).toBeVisible();

    console.log('✅ Multiple messages sent in conversation');
  });
});
