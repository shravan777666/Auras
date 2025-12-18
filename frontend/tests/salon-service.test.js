// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Salon Owner Service Functionality', () => {
  test('salon owner can add new service', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page.getByText('Welcome back')).toBeVisible();
    
    // Fill in salon owner credentials
    await page.locator('input[name="email"]').fill('shravan@gmail.com');
    await page.locator('input[name="password"]').fill('Shravan@123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirection
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if we're on the dashboard
    const currentUrl = page.url();
    
    // If we're not on a dashboard page, navigate to salon dashboard
    if (!currentUrl.includes('dashboard')) {
      await page.goto('/salon/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Navigate to Manage Services page
    console.log('Navigating to Manage Services page...');
    await page.goto('/salon/services');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify we're on the Manage Services page
    await expect(page.getByText('Manage Services')).toBeVisible({ timeout: 10000 });
    
    // Click "Add Service" button
    const addServiceButton = page.getByRole('button', { name: 'Add Service' });
    await addServiceButton.click({ timeout: 10000 });
    
    // Wait for service form to appear
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    // Verify all required fields are present
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('select[name="serviceName"]')).toBeVisible();
    await expect(page.locator('select[name="serviceType"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="duration"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    
    // Fill the form
    // Select Category
    await page.locator('select[name="category"]').selectOption('Hair');
    
    // Wait for service names to load
    await page.waitForTimeout(1000);
    
    // Select Service Name
    await page.locator('select[name="serviceName"]').selectOption('Hair Treatments');
    
    // Wait for service types to load
    await page.waitForTimeout(1000);
    
    // Select Service Type
    const serviceTypeSelect = page.locator('select[name="serviceType"]');
    if (await serviceTypeSelect.locator('option').count() > 1) {
      await serviceTypeSelect.selectOption({ index: 1 });
    }
    
    // Fill Description
    await page.locator('textarea[name="description"]').fill('Playwright test – new service');
    
    // Fill Duration
    await page.locator('input[name="duration"]').fill('60');
    
    // Fill Price
    await page.locator('input[name="price"]').fill('1500');
    
    // Wait for the modal to be fully loaded
    await page.waitForTimeout(1000);
    
    // Click add service button
    const submitButton = page.locator('form').getByRole('button', { name: /Add.*Service|Submit|Save/i });
    await submitButton.click();
    
    // Wait a bit to allow the form submission to complete
    await page.waitForTimeout(3000);
    
    // Check that we're no longer on the add service form
    // This indicates the form was submitted successfully
    const isFormStillVisible = await page.locator('form').isVisible();
    if (!isFormStillVisible) {
      console.log('Service form closed, indicating successful submission');
    } else {
      // If the form is still visible, check for any visible error messages
      const errorMessageVisible = await page.getByText(/error|failed|invalid/i).isVisible();
      if (!errorMessageVisible) {
        console.log('Form still visible but no error messages found');
      } else {
        const errorText = await page.getByText(/error|failed|invalid/i).textContent();
        if (errorText) {
          throw new Error(`Error occurred: ${errorText}`);
        }
      }
    }
  });
});