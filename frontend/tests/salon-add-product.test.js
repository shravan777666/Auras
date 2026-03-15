// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Salon Owner Add Product Verification', () => {
  test('logs in and verifies Add New Product modal fields', async ({ page }) => {
    // 1-4) Open app, login, and confirm salon dashboard redirect
    await page.goto('/login');

    await page.locator('input[name="email"]').fill('shravan@gmail.com');
    await page.locator('input[name="password"]').fill('Shravan@123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/salon\/dashboard/);

    // 5) Products section in dashboard menu
    const dashboardNav = page.locator('div.bg-white.rounded-xl.shadow-sm.mb-8.overflow-hidden').first();
    await dashboardNav.getByRole('button', { name: 'Products', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible();

    // 6) Manage All Products
    await page.getByRole('button', { name: 'Manage All Products' }).click();
    await expect(page).toHaveURL(/\/salon\/products/);
    await expect(page.getByRole('heading', { name: 'Manage Products' })).toBeVisible();

    // 7) Add Product
    await page.getByRole('button', { name: 'Add Product' }).click();

    // 8) Modal title
    const modal = page.locator('div.fixed.inset-0:has-text("Add New Product")').first();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Add New Product' })).toBeVisible();

    // 9) Required product detail fields
    await expect(modal.getByLabel(/Category/)).toBeVisible();
    await expect(modal.getByLabel(/Product Name/)).toBeVisible();
    await expect(modal.getByLabel('Brand')).toBeVisible();
    await expect(modal.getByLabel('Description')).toBeVisible();
    await expect(modal.getByLabel('Ingredients')).toBeVisible();

    // 10) Pricing and inventory fields
    await expect(modal.getByRole('spinbutton', { name: /^Price \(₹\) \*$/ })).toBeVisible();
    await expect(modal.getByRole('spinbutton', { name: /^Discounted Price \(₹\)$/ })).toBeVisible();
    await expect(modal.getByLabel('Quantity')).toBeVisible();
    await expect(modal.getByLabel('SKU')).toBeVisible();

    // 11) Image upload section and file note
    await expect(modal.getByText('Product Image')).toBeVisible();
    await expect(modal.locator('input#product-image')).toBeAttached();
    await expect(modal.locator('input#product-image')).toHaveAttribute('accept', 'image/*');
    await expect(modal.getByText('PNG, JPG, GIF up to 5MB')).toBeVisible();

    // 12) Action buttons
    await expect(modal.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Add Product' })).toBeVisible();
  });
});
