
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('Super Admin Login', async ({ page }) => {
        // 1. Navigate to Login
        await page.goto('/login');

        // 2. Fill Credentials
        // Input has id="login" and type="text" (not email)
        await page.fill('#login', 'simawasuper@example.com');
        await page.fill('#password', 'Kupukupu01');
        await page.click('button:has-text("Lanjut")');

        // 3. Handle OTP (if requested)
        // Wait for either OTP input or Dashboard
        const otpInput = page.locator('#otp');

        try {
            // Wait for OTP input to appear (it might take a moment after clicking Lanjut)
            await otpInput.waitFor({ state: 'visible', timeout: 5000 });
            if (await otpInput.isVisible()) {
                await otpInput.fill('150404');
                await page.click('button:has-text("Masuk Dashboard")');
            }
        } catch (e) {
            // If no OTP input appearing within timeout, check if we are already redirected?
            // Or maybe the button click failed?
        }

        // 4. Verify Dashboard
        // Wait for URL to change to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=Dashboard').first()).toBeVisible();
    });

    test('Regular User Login', async ({ page }) => {
        await page.goto('/login');

        await page.fill('#login', 'simawauser@example.com');
        await page.fill('#password', 'Kupukupu01');
        await page.click('button:has-text("Lanjut")');

        const otpInput = page.locator('#otp');
        try {
            await otpInput.waitFor({ state: 'visible', timeout: 5000 });
            if (await otpInput.isVisible()) {
                await otpInput.fill('150404');
                await page.click('button:has-text("Masuk Dashboard")');
            }
        } catch (e) {
            // Ignore
        }

        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=Dashboard').first()).toBeVisible();
    });

});
