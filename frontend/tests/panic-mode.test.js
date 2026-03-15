// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Customer Panic Mode Flow', () => {
  test('logs in, lands on customer dashboard, and processes panic mode request', async ({ page, context }) => {
    // Ensure geolocation can be used by panic mode in browser automation.
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 9.528, longitude: 76.819 });

    await page.goto('/login');

    await page.locator('input[name="email"]').fill('rono@gmail.com');
    await page.locator('input[name="password"]').fill('Rono@123');

    const dashboardResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/customer/dashboard') && response.request().method() === 'GET'
    );

    const recentSalonsResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/customer/recent-salons') && response.request().method() === 'GET'
    );

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/customer\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    const dashboardResponse = await dashboardResponsePromise;
    expect(dashboardResponse.ok()).toBeTruthy();

    const recentSalonsResponse = await recentSalonsResponsePromise;
    expect(recentSalonsResponse.ok()).toBeTruthy();

    const recentSalonsBody = await recentSalonsResponse.json();
    expect(recentSalonsBody?.success).toBeTruthy();
    expect(Array.isArray(recentSalonsBody?.data)).toBeTruthy();

    // Trigger Panic Mode and assert the panic request is processed.
    const panicRequestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/customer/panic-mode') && request.method() === 'POST'
    );

    const panicResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/customer/panic-mode') && response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: /panic mode/i }).first().click();

    const panicRequest = await panicRequestPromise;
    const panicPayload = panicRequest.postDataJSON();
    expect(panicPayload).toMatchObject({
      location: {
        latitude: expect.any(Number),
        longitude: expect.any(Number)
      }
    });

    const panicResponse = await panicResponsePromise;
    expect(panicResponse.ok()).toBeTruthy();

    const panicBody = await panicResponse.json();
    expect(panicBody?.success).toBeTruthy();

    // UI should show either successful result or graceful "not found"/error state,
    // which confirms the request was fully processed.
    const successState = page.getByText(/nearest available salon found/i);
    const emptyState = page.getByText(/no nearby salons available|no salons found|no available slots/i);
    const errorState = page.getByText(/unable to locate you or find nearby salons/i);

    await expect(successState.or(emptyState).or(errorState)).toBeVisible();
  });
});
