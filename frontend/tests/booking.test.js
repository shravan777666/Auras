// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Appointment Booking Flow', () => {
  test('customer can navigate to explore salons page', async ({ page }) => {
    // Navigate to the explore salons page
    await page.goto('/customer/explore-salons');
    
    // Check that the page loads (this will redirect to login since user is not authenticated)
    await expect(page).toHaveURL(/.*login/);
  });
  
  test('customer can see login page when visiting bookings', async ({ page }) => {
    await page.goto('/customer/bookings');
    
    // Check that we're redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Welcome to Auracare')).toBeVisible();
  });
});