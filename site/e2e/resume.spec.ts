import { test, expect } from '@playwright/test';
import { getExpectedContent } from './helpers/resumeHelper';

test.describe('Resume Variant System', () => {
  test('visiting /ops/ shows ops homepage variant', async ({ page }) => {
    const expected = getExpectedContent('ops');
    await page.goto('/ops/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText(expected.title);
  });

  test('visiting /builder/ shows builder homepage variant', async ({ page }) => {
    const expected = getExpectedContent('builder');
    await page.goto('/builder/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText(expected.title);
  });

  test('visiting /ops/resume/ shows ops resume', async ({ page }) => {
    const expected = getExpectedContent('ops');
    await page.goto('/ops/resume/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Brian Anderson');
    await expect(page.locator('p').first()).toContainText(expected.title);
  });

  test('visiting /builder/resume/ shows builder resume', async ({ page }) => {
    const expected = getExpectedContent('builder');
    await page.goto('/builder/resume/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Brian Anderson');
    await expect(page.locator('p').first()).toContainText(expected.title);
  });

  test('visiting /resume?v=ops ends up at /ops/resume/', async ({ page }) => {
    await page.goto('/resume?v=ops');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ops\/resume/);
  });

  test('visiting /resume?v=builder ends up at /builder/resume/', async ({ page }) => {
    await page.goto('/resume?v=builder');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/builder\/resume/);
  });

  test('visiting /?v=ops ends up at /ops/', async ({ page }) => {
    await page.goto('/?v=ops');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ops/);
  });

  test('visiting /?v=builder ends up at /builder/', async ({ page }) => {
    await page.goto('/?v=builder');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/builder/);
  });

  test('footer shows correct variant name', async ({ page }) => {
    await page.goto('/ops/resume/');
    await page.waitForLoadState('networkidle');
    const footer = page.locator('footer');
    await expect(footer).toContainText('[Ops]');
  });

  test('footer variant links work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const builderLink = page.locator('footer a').filter({ hasText: '[Builder]' }).first();
    await builderLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/builder/);
  });

  test('canonical homepage routes work', async ({ page }) => {
    const expectedOps = getExpectedContent('ops');
    await page.goto('/ops/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText(expectedOps.title);

    const expectedBuilder = getExpectedContent('builder');
    await page.goto('/builder/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText(expectedBuilder.title);
  });

  test('canonical resume routes work', async ({ page }) => {
    await page.goto('/ops/resume/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Brian Anderson');

    await page.goto('/builder/resume/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Brian Anderson');
  });

  test('canonical URLs are correct', async ({ page }) => {
    const tests = [
      ['/', 'https://briananderson.xyz/'],
      ['/resume/', 'https://briananderson.xyz/resume/'],
      ['/ops/', 'https://briananderson.xyz/ops/'],
      ['/builder/', 'https://briananderson.xyz/builder/'],
      ['/ops/resume/', 'https://briananderson.xyz/ops/resume/'],
      ['/builder/resume/', 'https://briananderson.xyz/builder/resume/'],
    ];

    for (const [path, expectedUrl] of tests) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(expectedUrl);
    }
  });

  test('default resume loads correctly', async ({ page }) => {
    const expected = getExpectedContent('default');
    await page.goto('/resume/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Brian Anderson');
    await expect(page.locator('p').first()).toContainText(expected.title);
  });
});
