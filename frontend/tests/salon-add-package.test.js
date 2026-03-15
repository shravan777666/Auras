// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Salon Owner Package Modal Verification', () => {
  test('logs in and verifies Add New Package modal fields', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill('shravan@gmail.com');
    await page.locator('input[name="password"]').fill('Shravan@123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/salon\/dashboard/);

    await page.getByRole('button', { name: 'Packages' }).click();
    await expect(page.getByRole('heading', { name: 'Package Management' })).toBeVisible();

    await page.getByRole('button', { name: 'Add New Package' }).click();

    const modal = page.locator('div.fixed.inset-0:has-text("Create New Package")').first();
    await expect(modal).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Create New Package' })).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
    await expect(modal.getByText('Package Name *')).toBeVisible();
    await expect(modal.locator('input[name="name"]')).toBeVisible();
    await expect(modal.getByText('Occasion Type *')).toBeVisible();
    await expect(modal.locator('select[name="occasionType"]')).toBeVisible();
    await expect(modal.getByText('Category')).toBeVisible();
    await expect(modal.locator('select[name="category"]')).toBeVisible();
    await expect(modal.getByText('Target Audience')).toBeVisible();
    await expect(modal.locator('select[name="targetAudience"]')).toBeVisible();
    await expect(modal.getByText('Description *')).toBeVisible();
    await expect(modal.locator('textarea[name="description"]')).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Included Services *' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Add Service' })).toBeVisible();

    await modal.getByRole('button', { name: 'Add Service' }).click();

    const serviceRow = modal.locator('div.flex.items-center.space-x-3.p-4.bg-gray-50.rounded-lg').first();
    await expect(serviceRow).toBeVisible();
    await expect(serviceRow.getByText('Service', { exact: true })).toBeVisible();
    await expect(serviceRow.getByText('Quantity', { exact: true })).toBeVisible();
    await expect(serviceRow.getByText('Price (₹)', { exact: true })).toBeVisible();
    await expect(serviceRow.locator('select')).toBeVisible();
    await expect(serviceRow.getByRole('spinbutton').first()).toBeVisible();
    await expect(serviceRow.getByRole('spinbutton').nth(1)).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Tags' })).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Discount Options' })).toBeVisible();
    await expect(modal.getByText('Discount Percentage (%)')).toBeVisible();
    await expect(modal.getByText('Or Fixed Discounted Price')).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Additional Options' })).toBeVisible();
    await expect(modal.getByText('Featured Package')).toBeVisible();
    await expect(modal.getByText('Seasonal Package')).toBeVisible();

    await expect(modal.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Create Package' })).toBeVisible();
  });
});
