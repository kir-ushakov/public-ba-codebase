import { test, expect } from '@playwright/test';

test('user can create a task', async ({ page }) => {
    await page.goto('/');
    
    // STEP 0: Pass Google Auth and go to Home Screen
    await expect(page.getByText('Sign in with Google')).toBeVisible();
    await page.click('text=Sign in with Google');
    await page.waitForURL('/');
    await expect(page.getByText('Sign in with Google')).not.toBeVisible();
    
    // Debug: Take screenshot to see the current state
    await page.screenshot({ path: 'test-results/home-screen-after-login.png' });
    
    // Check if the new task button is visible
    await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();
    
    // Now you can continue with your actual test logic
    //await page.click('[data-test=new-task-btn]');
    //await page.fill('input[name="title"]', 'My First Task');
    //await page.click('button[type="submit"]');
});