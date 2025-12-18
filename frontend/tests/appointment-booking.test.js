// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Appointment Booking Flow', () => {
  test('customer can book an appointment after logging in', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in login credentials
    await page.locator('input[name="email"]').fill('rono@gmail.com');
    await page.locator('input[name="password"]').fill('Rono@123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirection to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByText('Customer Dashboard')).toBeVisible();
    
    // Navigate to explore salons
    await page.goto('/customer/explore-salons');
    await expect(page.getByText('Explore Salons')).toBeVisible();
    
    // Select a salon (assuming first salon in the list)
    await page.locator('.salon-card').first().click();
    
    // On salon details page, select a service
    await expect(page.getByText('Salon Services')).toBeVisible();
    await page.locator('.service-item').first().click();
    
    // Select date and time slot
    await page.locator('[data-testid="date-picker"]').click();
    // Select tomorrow's date
    await page.locator('[data-testid="tomorrow-date"]').click();
    
    // Select first available time slot
    await page.locator('.time-slot').first().click();
    
    // Proceed to booking confirmation
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    
    // Verify booking confirmation
    await expect(page.getByText('Booking Confirmed')).toBeVisible();
    await expect(page.getByText('Appointment scheduled')).toBeVisible();
  });

  test('customer can view their upcoming appointments', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('customer@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirection to dashboard
    await page.waitForURL(/.*dashboard/);
    
    // Navigate to bookings page
    await page.goto('/customer/bookings');
    
    // Verify bookings page loads
    await expect(page.getByText('My Bookings')).toBeVisible();
    
    // Check that upcoming appointments are displayed
    await expect(page.locator('.upcoming-appointments')).toBeVisible();
    
    // Verify at least one appointment is shown (or display appropriate message)
    const appointmentCount = await page.locator('.appointment-card').count();
    if (appointmentCount > 0) {
      await expect(page.locator('.appointment-card').first()).toBeVisible();
    } else {
      await expect(page.getByText('No upcoming appointments')).toBeVisible();
    }
  });
});