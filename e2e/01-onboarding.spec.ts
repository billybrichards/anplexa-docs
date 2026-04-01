/**
 * E2E Test: Full Onboarding Flow
 *
 * Flow: Welcome → Birth Data → Calculating (~15s) → Chart Reveal → Trait Globe
 *       (analyzing ~50s) → Compatibility → Companion Creation → Signup
 *
 * This test walks through the entire onboarding experience as a new user.
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('complete onboarding from welcome to signup', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1: Welcome page
    // -----------------------------------------------------------------------
    await page.goto('/onboarding');
    await expect(page.getByText(/cosmic blueprint|welcome to anplexa/i).first()).toBeVisible({ timeout: 10_000 });

    // Click the CTA to start
    const startButton = page.getByRole('button', { name: /begin|start|discover|let.*go/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // -----------------------------------------------------------------------
    // Step 2: Birth Data entry
    // -----------------------------------------------------------------------
    await expect(page).toHaveURL(/birth-data/, { timeout: 10_000 });

    // Fill city
    const cityInput = page.getByPlaceholder(/new york|city/i).or(page.getByLabel(/birth city/i));
    await expect(cityInput).toBeVisible({ timeout: 5000 });
    await cityInput.fill('London');

    // Wait for autocomplete and select if dropdown appears
    const autocompleteOption = page.getByText('London', { exact: false }).first();
    try {
      await autocompleteOption.click({ timeout: 3000 });
    } catch {
      // City may have been accepted directly
    }

    // Fill country (may be auto-filled from city selection)
    const countryInput = page.getByPlaceholder(/united kingdom|country/i).or(page.getByLabel(/birth country/i));
    await expect(countryInput).toBeVisible({ timeout: 5000 });
    try {
      await countryInput.fill('United', { timeout: 3000 });
      // Select from autocomplete
      const countryOption = page.getByText(/united kingdom/i).first();
      await countryOption.click({ timeout: 3000 });
    } catch {
      // Country may have been auto-selected
    }

    // Fill date using the date picker input
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });
    // Format: YYYY-MM-DD for June 15, 1995
    await dateInput.fill('1995-06-15');

    // Time checkbox (uncheck it to enable time input)
    const timeUnknownCheckbox = page.getByLabel(/time unknown/i);
    await expect(timeUnknownCheckbox).toBeVisible({ timeout: 5000 });
    // Click to uncheck (it's checked by default)
    await timeUnknownCheckbox.click();

    // Fill time (HH:MM format)
    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toBeVisible({ timeout: 5000 });
    await timeInput.fill('14:30');

    // Submit birth data
    const calculateButton = page.getByRole('button', { name: /calculate|continue|next|reveal/i });
    await expect(calculateButton).toBeEnabled();
    await calculateButton.click();

    // -----------------------------------------------------------------------
    // Step 3: Calculating (birth chart) — ~10-15s
    // -----------------------------------------------------------------------
    await expect(page).toHaveURL(/calculating/, { timeout: 10_000 });
    await expect(page.getByText(/calculat|analyz|processing/i).first()).toBeVisible({ timeout: 10_000 });

    // Wait for auto-navigation to chart-reveal (up to 30s)
    await expect(page).toHaveURL(/chart-reveal/, { timeout: 30_000 });

    // -----------------------------------------------------------------------
    // Step 4: Chart Reveal
    // -----------------------------------------------------------------------
    await expect(page.getByText(/chart|natal|astro/i).first()).toBeVisible({ timeout: 10_000 });

    // Click continue to trait globe
    const continueToTraits = page.getByRole('button', { name: /continue|explore|trait|next/i });
    await expect(continueToTraits).toBeVisible({ timeout: 10_000 });
    await continueToTraits.click();

    // -----------------------------------------------------------------------
    // Step 5: Trait Globe — analyzing phase (~50s+ for API call)
    // -----------------------------------------------------------------------
    await expect(page).toHaveURL(/trait-globe/, { timeout: 10_000 });

    // The analyzing phase shows loader messages
    await expect(
      page.getByText(/extracting|analyzing|calculating|mapping|enriching|trait/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for exploring phase (globe/traits appear) — up to 90s for AI analysis
    await expect(
      page.getByText(/meet.*companion|companion|explore/i).first()
        .or(page.getByRole('button', { name: /meet|companion/i }))
    ).toBeVisible({ timeout: 90_000 });

    // Verify globe or fallback list rendered (at least one trait visible)
    const traitElement = page.locator('[data-testid="trait-node"]')
      .or(page.getByText(/trait|personality|strength/i).first());
    await expect(traitElement).toBeVisible({ timeout: 10_000 });

    // Click "Meet My Companion" button
    const meetCompanionButton = page.getByRole('button', { name: /meet.*companion/i });
    await expect(meetCompanionButton).toBeVisible({ timeout: 10_000 });
    await meetCompanionButton.click();

    // -----------------------------------------------------------------------
    // Step 6: Compatibility overlay → Companion Creation
    // -----------------------------------------------------------------------
    // Wait for compatibility generation and navigation
    await expect(page).toHaveURL(/companion-creation/, { timeout: 60_000 });

    // Wait for the companion generation to complete (6s animation)
    const getStartedButton = page.getByRole('button', { name: /get started|start chatting|sign up|create account/i });
    await expect(getStartedButton).toBeVisible({ timeout: 20_000 });

    // Verify companion name is displayed
    await expect(page.locator('text=/[A-Z][a-z]+/')).toBeVisible(); // Any capitalized name

    await getStartedButton.click();

    // -----------------------------------------------------------------------
    // Step 7: Signup
    // -----------------------------------------------------------------------
    await expect(page).toHaveURL(/signup/, { timeout: 10_000 });

    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@anplexa.com`;

    await page.getByPlaceholder(/email|you@/i).fill(email);
    await page.getByPlaceholder(/at least 8|password/i).first().fill('E2eTestPass123!');
    await page.getByPlaceholder(/confirm/i).fill('E2eTestPass123!');

    const createAccountButton = page.getByRole('button', { name: /create account/i });
    await expect(createAccountButton).toBeEnabled();
    await createAccountButton.click();

    // Should move to verification step
    await expect(
      page.getByText(/verify|code|sent/i).first()
    ).toBeVisible({ timeout: 15_000 });

    // Test passed — user reached verification step
    console.log(`✅ Onboarding complete. Test user: ${email}`);
  });
});
