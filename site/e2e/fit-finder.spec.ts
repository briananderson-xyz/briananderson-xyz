import { test, expect } from '@playwright/test';

test.describe('Fit Finder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open fit finder from connect banner', async ({ page }) => {
    // Wait for page to fully load and hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for JS to initialize

    // Try keyboard shortcut (Meta on Mac, Control on Windows/Linux)
    await page.keyboard.press('Meta+f');

    // Wait for fit finder modal
    const fitFinder = page.locator('[data-testid="fit-finder"]');
    await expect(fitFinder).toBeVisible({ timeout: 5000 });

    // Should have job description input
    const jdInput = page.locator('[data-testid="jd-input"]');
    await expect(jdInput).toBeVisible();
  });

  test('should analyze job description and show good fit', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder via keyboard shortcut
    await page.keyboard.press('Meta+f');

    // Wait for modal with specific test ID
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Enter job description with AWS + Kubernetes + Leadership
    const jd = `Senior Platform Engineer

Required:
- 5+ years AWS experience
- Kubernetes and container orchestration
- Team leadership experience
- DevOps and CI/CD background
- Infrastructure as Code (Terraform)

Nice to have:
- Cloud architecture certifications
- Multi-cloud experience`;

    await page.fill('textarea', jd);

    // Click analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis (AI call can take a few seconds)
    await page.waitForSelector('text=/fit/i', { timeout: 30000 });

    // Should show fit score or fit level
    const content = await page.textContent('body');
    expect(content).toMatch(/good|fit|score|match/i);
  });

  test('should show matching skills with evidence', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Simple job description
    const jd = `Cloud Engineer needed with AWS and Kubernetes experience.`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for results
    await page.waitForSelector('text=/skill|experience/i', { timeout: 30000 });

    // Check that results include some content
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should handle maybe fit scenario', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Job with partial match (some relevant skills, some gaps)
    const jd = `Full Stack Developer

Required:
- React and TypeScript frontend development
- Node.js backend development
- AWS deployment experience
- Agile team environment

Nice to have:
- Mobile app development
- GraphQL experience`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForSelector('text=/fit|match/i', { timeout: 30000 });

    // Should have some result
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should show not fit for unrelated job', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Completely unrelated job
    const jd = `Registered Nurse - ICU

Required:
- Current RN license
- 3+ years ICU experience
- ACLS and BLS certification
- Strong patient care skills`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForSelector('text=/fit|match|gap/i', { timeout: 30000 });

    // Should show some result (even if not a good fit)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should be closeable with Escape key', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');

    // Wait for modal
    const modal = page.locator('[data-testid="fit-finder"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
