/**
 * E2E Test: Sign In Flow
 *
 * Tests:
 * 1. Sign in page loads correctly
 * 2. Shows validation errors for empty/bad inputs
 * 3. Rejects wrong credentials
 * 4. Successful login redirects to /chat
 */

import { test, expect } from '@playwright/test';
import { API_URL, testEmail, TEST_PASSWORD } from './helpers';

test.describe('Sign In', () => {
  let registeredEmail: string;

  // Register + verify a user via API before tests
  test.beforeAll(async ({ request }) => {
    registeredEmail = testEmail();

    // Register
    const registerRes = await request.post(`${API_URL}/api/auth/register`, {
      data: { email: registeredEmail, password: TEST_PASSWORD },
    });
    expect(registerRes.ok()).toBeTruthy();

    // Bypass email verification directly in DB
    // (The API test helper sets is_verified = true)
    const verifyRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: registeredEmail, password: TEST_PASSWORD },
    });
    // Login should work even without verification for the test
    // If not, the test will catch it
  });

  test('page loads with correct elements', async ({ page }) => {
    await page.goto('/signin');

    await expect(page.getByText(/sign in/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/email|you@/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/don.*have.*account/i)).toBeVisible();
  });

  test('shows error for empty fields', async ({ page }) => {
    await page.goto('/signin');

    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/signin');

    await page.getByPlaceholder(/email|you@/i).fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(
      page.getByText(/invalid|incorrect|wrong|not found|credentials/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('successful login redirects to /chat', async ({ page }) => {
    await page.goto('/signin');

    await page.getByPlaceholder(/email|you@/i).fill(registeredEmail);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to chat (may take a moment for API + redirect)
    await expect(page).toHaveURL(/chat/, { timeout: 15_000 });

    console.log(`✅ Sign in successful for: ${registeredEmail}`);
  });

  test('enter key submits the form', async ({ page }) => {
    await page.goto('/signin');

    await page.getByPlaceholder(/email|you@/i).fill(registeredEmail);
    const passwordField = page.getByPlaceholder(/password/i);
    await passwordField.fill(TEST_PASSWORD);
    // Small delay to ensure state is set before Enter
    await page.waitForTimeout(200);
    await passwordField.press('Enter');

    await expect(page).toHaveURL(/chat/, { timeout: 15_000 });
  });

  test('"get started" link navigates to onboarding', async ({ page }) => {
    await page.goto('/signin');

    await page.getByText(/get started/i).click();
    await expect(page).toHaveURL(/onboarding|birth-data/, { timeout: 10_000 });
  });
});
