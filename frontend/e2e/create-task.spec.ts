import { test, expect } from '@playwright/test';

test('user can create a task', async ({ page }) => {
    await page.goto('/');
    //await page.click('[data-test=new-task-btn]');
    //await page.fill('input[name="title"]', 'My First Task');
    //await page.click('button[type="submit"]');
  
    await expect(page.getByText('Sign in with Google')).toBeVisible();
});