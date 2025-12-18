// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Staff Dashboard Access', () => {
  test('staff member can login and access dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in staff login credentials
    await page.locator('input[name="email"]').fill('staff@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirection based on user role
    await page.waitForURL(/.*(staff|dashboard)/);
    
    // Verify staff dashboard is loaded
    await expect(page.getByText('Staff Dashboard')).toBeVisible();
    
    // Check that key dashboard elements are present
    await expect(page.getByText('Today\'s Appointments')).toBeVisible();
    await expect(page.getByText('Upcoming Schedule')).toBeVisible();
    await expect(page.locator('[data-testid="staff-profile-section"]')).toBeVisible();
  });

  test('staff member can view and update their schedule', async ({ page }) => {
    // Login as staff member
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('staff@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirection to dashboard
    await page.waitForURL(/.*(staff|dashboard)/);
    
    // Navigate to schedule page
    await page.goto('/staff/schedule');
    
    // Verify schedule page loads
    await expect(page.getByText('My Schedule')).toBeVisible();
    
    // Check that calendar is visible
    await expect(page.locator('[data-testid="schedule-calendar"]')).toBeVisible();
    
    // Check that time slots are displayed
    const timeSlotCount = await page.locator('.time-slot').count();
    expect(timeSlotCount).toBeGreaterThan(0);
    
    // Mark availability for a time slot
    const firstAvailableSlot = page.locator('.time-slot.available').first();
    if (await firstAvailableSlot.count() > 0) {
      await firstAvailableSlot.click();
      await expect(firstAvailableSlot).toHaveClass(/selected/);
    }
  });
});