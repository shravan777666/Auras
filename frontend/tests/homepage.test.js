// @ts-check
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page title contains "Auracare"
  await expect(page).toHaveTitle(/Auracare/);
  
  // Check that the main navigation elements are visible
  // Use more specific selectors to avoid conflicts
  await expect(page.locator('header').getByText('AuraCares')).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Sign In' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Sign Up' })).toBeVisible();
});

test('customer can navigate to login page', async ({ page }) => {
  await page.goto('/');
  
  // Click on the "Sign In" link in the header
  await page.locator('header').getByRole('link', { name: 'Sign In' }).click();
  
  // Check that we're on the login page
  await expect(page).toHaveURL(/.*login/);
  await expect(page.getByText('Welcome to Auracare')).toBeVisible();
});