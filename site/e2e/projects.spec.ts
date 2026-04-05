import { test, expect } from '@playwright/test';

test.describe('Projects List', () => {
  test('renders project cards', async ({ page }) => {
    await page.goto('/projects/');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('a[href*="/projects/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('shows featured image on cards that have one', async ({ page }) => {
    await page.goto('/projects/');
    await page.waitForLoadState('networkidle');
    const fairviewCard = page.locator('a[href*="fairview"]');
    await expect(fairviewCard.locator('img')).toBeVisible();
  });
});

test.describe('Project Detail - Visual Archive', () => {
  test('shows visual archive section when visualArchive frontmatter is set', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./visual-archive')).toBeVisible();
  });

  test('visual archive renders all images as clickable buttons', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    // Fairview has 7 images in visualArchive
    const galleryButtons = page.locator('section.not-prose button');
    await expect(galleryButtons).toHaveCount(7);
  });

  test('clicking a gallery image opens the lightbox', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await page.locator('section.not-prose button').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('lightbox closes on Escape', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await page.locator('section.not-prose button').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('lightbox navigates to next image with ArrowRight', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await page.locator('section.not-prose button').first().click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    // Main image has alt="Lightbox view"; thumbnails have alt="Thumbnail N"
    const mainImage = dialog.locator('img[alt="Lightbox view"]');
    const initialSrc = await mainImage.getAttribute('src');
    await page.keyboard.press('ArrowRight');
    const nextSrc = await mainImage.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);
  });

  test('lightbox navigates to prev image with ArrowLeft', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    // Open on second image so we can go back
    await page.locator('section.not-prose button').nth(1).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const mainImage = dialog.locator('img[alt="Lightbox view"]');
    const initialSrc = await mainImage.getAttribute('src');
    await page.keyboard.press('ArrowLeft');
    const prevSrc = await mainImage.getAttribute('src');
    expect(prevSrc).not.toBe(initialSrc);
  });

  test('lightbox closes when clicking backdrop', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await page.locator('section.not-prose button').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Click the backdrop (the dialog element itself, not the inner content)
    await page.locator('[role="dialog"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('project without visualArchive renders without gallery', async ({ page }) => {
    await page.goto('/projects/discover-trident/');
    await page.waitForLoadState('networkidle');
    // Should render content correctly
    await expect(page.locator('.prose h2').first()).toBeVisible();
    // Should NOT show the visual archive section
    await expect(page.getByText('./visual-archive')).not.toBeVisible();
  });

  test('fimb project shows visual archive with correct image count', async ({ page }) => {
    await page.goto('/projects/fill-in-my-blank/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./visual-archive')).toBeVisible();
    // FIMB has 8 images in visualArchive (3 designer-era + 5 original)
    const galleryButtons = page.locator('section.not-prose button');
    await expect(galleryButtons).toHaveCount(8);
  });
});

test.describe('Project Detail - Links', () => {
  test('shows links section when links frontmatter is set', async ({ page }) => {
    await page.goto('/projects/discover-trident/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./links')).toBeVisible();
  });

  test('renders link as an anchor with correct href', async ({ page }) => {
    await page.goto('/projects/discover-trident/');
    await page.waitForLoadState('networkidle');
    const link = page.locator('section.not-prose a', { hasText: 'Valtech Case Study' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.valtech.com/en-us/work/discover/');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('gfs ordering shows multiple links', async ({ page }) => {
    await page.goto('/projects/gfs-ordering-platform/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./links')).toBeVisible();
    const links = page.locator('section.not-prose a');
    await expect(links).toHaveCount(2);
  });

  test('project without links does not show links section', async ({ page }) => {
    await page.goto('/projects/fairview-childrens-center/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./links')).not.toBeVisible();
  });
});

test.describe('Blog Detail - Links', () => {
  test('shows links section on blog post with links frontmatter', async ({ page }) => {
    await page.goto('/blog/building-this-site/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('./links')).toBeVisible();
  });

  test('renders github links correctly', async ({ page }) => {
    await page.goto('/blog/building-this-site/');
    await page.waitForLoadState('networkidle');
    const links = page.locator('section.not-prose a');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute('href', /github\.com/);
  });
});
