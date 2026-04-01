/**
 * E2E Test Helpers for Anplexa Companions
 */

export const API_URL = process.env.E2E_API_URL || 'https://api-develop-f1bc.up.railway.app';
export const BASE_URL = process.env.E2E_BASE_URL || 'https://companions-develop.up.railway.app';

/** Generate a unique test email */
export function testEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@anplexa.com`;
}

export const TEST_PASSWORD = 'E2eTestPass123!';

/** Birth data for onboarding tests */
export const TEST_BIRTH_DATA = {
  city: 'London',
  country: 'United Kingdom',
  day: '15',
  month: 'June',
  year: '1995',
  hour: '14',
  minute: '30',
};
