// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Customer Home Service Booking', () => {
  test('logs in, opens Home Service page, enters address, and triggers booking flow', async ({ page }) => {
    // 1-4) Open app, login, and verify customer dashboard redirect
    await page.goto('/login');

    await page.locator('input[name="email"]').fill('rono@gmail.com');
    await page.locator('input[name="password"]').fill('Rono@123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/customer\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // 5) Click Home Service from dashboard
    await page.getByRole('link', { name: 'Home Service', exact: true }).click();

    // 6) Verify Home Service page opens
    await expect(page).toHaveURL(/\/customer\/home-service/);
    await expect(page.getByRole('heading', { name: 'Home Service', level: 1, exact: true })).toBeVisible();

    // 7) Enter home address in required field
    await expect(page.locator('label:has-text("Your Home Address")').first()).toBeVisible();
    const addressInput = page.locator('textarea[placeholder*="Enter your complete home address"]').first();
    await expect(addressInput).toBeVisible();
    await addressInput.fill('221B Baker Street, Near Central Park, Kochi, Kerala 682001');

    // 8) Click Book Home Service (first available provider card)
    const bookHomeServiceButton = page.getByRole('button', { name: 'Book Home Service', exact: true }).first();
    await expect(bookHomeServiceButton).toBeVisible({ timeout: 15000 });
    await expect(bookHomeServiceButton).toBeEnabled();
    await bookHomeServiceButton.click();

    // Expected result: booking flow is triggered and booking page for home service opens
    await expect(page).toHaveURL(/\/customer\/book-appointment\/[^/?]+\?homeService=true/);
    await expect(page.getByRole('button', { name: 'Book Home Service', exact: true })).toBeVisible();
  });
});
