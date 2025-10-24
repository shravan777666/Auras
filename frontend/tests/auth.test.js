// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('customer can navigate to login page and see form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form is visible
    await expect(page.getByText('Welcome to Auracare')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
  
  test('customer can navigate to register page and see form elements', async ({ page }) => {
    await page.goto('/register');
    
    // Check that registration form is visible
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });
});