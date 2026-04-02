/**
 * E2E Test: Full Onboarding Flow
 *
 * Flow: Welcome → Birth Data → Calculating (~15s) → Chart Reveal → Trait Globe
 *       (analyzing ~50s) → Compatibility → Companion Creation → Signup
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('complete onboarding from welcome to signup', async ({ page }) => {
    // ── Step 1: Welcome ──────────────────────────────────────────────────
    await page.goto('/onboarding');
    await expect(page.getByText('Cosmic Blueprint')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /begin journey/i }).click();

    // ── Step 2: Birth Data ───────────────────────────────────────────────
    await expect(page).toHaveURL(/birth-data/, { timeout: 10_000 });

    // Date input (CosmicInput id="birth-date")
    const dateInput = page.locator('#birth-date');
    await expect(dateInput).toBeVisible({ timeout: 5000 });
    await dateInput.fill('1995-06-15');

    // Time input (visible by default, timeKnown=true)
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 5000 });
    await timeInput.fill('14:30');

    // City (CosmicInput id="birth-city")
    const cityInput = page.locator('#birth-city');
    await expect(cityInput).toBeVisible({ timeout: 5000 });
    await cityInput.fill('London');

    // Country (CosmicInput id="birth-country")
    const countryInput = page.locator('#birth-country');
    await expect(countryInput).toBeVisible({ timeout: 5000 });
    await countryInput.fill('United Kingdom');

    // Submit
    await page.getByRole('button', { name: /calculate my chart/i }).click();

    // ── Step 3: Calculating (~10-15s) ────────────────────────────────────
    await expect(page).toHaveURL(/calculating/, { timeout: 10_000 });

    // Wait for auto-redirect to chart-reveal
    await expect(page).toHaveURL(/chart-reveal/, { timeout: 30_000 });

    // ── Step 4: Chart Reveal ─────────────────────────────────────────────
    await expect(page.getByText(/cosmic blueprint/i).first()).toBeVisible({ timeout: 10_000 });

    // Button may be below the fold — scroll to it
    const exploreButton = page.getByRole('button', { name: /explore your personality/i });
    await exploreButton.scrollIntoViewIfNeeded();
    await expect(exploreButton).toBeVisible({ timeout: 5000 });
    await exploreButton.click();

    // ── Step 5: Trait Globe (analyzing ~50s+) ────────────────────────────
    await expect(page).toHaveURL(/trait-globe/, { timeout: 10_000 });

    // Analyzing phase shows progress messages
    await expect(
      page.getByText(/extracting|analyzing|calculating|mapping|enriching/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for exploring phase — globe loaded when "Switch to 2D" button appears
    await expect(
      page.getByRole('button', { name: /switch to 2d/i })
    ).toBeVisible({ timeout: 90_000 });

    // On mobile, open the sidebar (hamburger button) to access "Meet My Companion"
    const sidebarToggle = page.getByRole('button', { name: /open trait list/i });
    if (await sidebarToggle.isVisible({ timeout: 5000 })) {
      await sidebarToggle.click();
      await page.waitForTimeout(800); // sidebar slide animation
    }

    // "Meet My Companion" button appears at bottom of sidebar
    // Scroll the page to bring it into view
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const meetButton = page.getByRole('button', { name: /generate compatible companion/i });
    await expect(meetButton).toBeVisible({ timeout: 10_000 });
    await meetButton.click();

    // ── Step 6: Compatibility → Companion Creation ───────────────────────
    // Compatibility overlay appears - wait for loading to complete
    await expect(page.getByText(/generating your compatible companion/i)).toBeVisible({ timeout: 10_000 });

    // Wait for "Meet Your Companion" button to appear (loading complete)
    const meetYourCompanionButton = page.getByRole('button', { name: /meet your companion/i });
    await expect(meetYourCompanionButton).toBeVisible({ timeout: 60_000 });
    await meetYourCompanionButton.click();

    // Wait for navigation to companion-creation
    await expect(page).toHaveURL(/companion-creation/, { timeout: 60_000 });

    // Wait for generation animation to complete (~6s)
    const startChattingButton = page.getByRole('button', { name: /start chatting/i });
    await expect(startChattingButton).toBeVisible({ timeout: 20_000 });

    await startChattingButton.click();

    // ── Step 7: Signup ───────────────────────────────────────────────────
    await expect(page).toHaveURL(/signup/, { timeout: 10_000 });

    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@anplexa.com`;

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('At least 8 characters').fill('E2eTestPass123!');
    await page.getByPlaceholder('Confirm your password').fill('E2eTestPass123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should reach verification step
    await expect(
      page.getByRole('heading', { name: /verify your email/i })
    ).toBeVisible({ timeout: 15_000 });

    console.log(`✅ Onboarding complete → signup → verification. User: ${email}`);
  });
});
