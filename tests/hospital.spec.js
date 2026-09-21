import { test, expect } from '@playwright/test';
test('Sri Devi Children Hospital application opens successfully', async ({ page }) => {

  await page.goto('http://localhost:3000');

  await expect(page).toHaveTitle(/.*/);

  console.log('Application opened successfully');

  await page.screenshot({
    path: 'test-results/home-page.png',
    fullPage: true
  });

});