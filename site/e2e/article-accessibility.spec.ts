import { expect, test } from "@playwright/test";

const mobileViewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 }
];

test.describe("article accessibility", () => {
  for (const viewport of mobileViewports) {
    test(`long-form content does not overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/blog/taxes-verify-every-number/");

      await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        html: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));

      expect(overflow.html).toBeLessThanOrEqual(overflow.viewport);
      expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
    });
  }

  test("shortcuts dialog traps focus, closes on Escape, and restores its opener", async ({
    page
  }) => {
    await page.goto("/");
    const opener = page.getByRole("button", { name: "View keyboard shortcuts" });
    await opener.focus();
    await opener.click();

    const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);

    await page
      .locator("main a")
      .first()
      .evaluate((element: HTMLElement) => element.focus());
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("featured images open by keyboard and the lightbox restores meaningful focus", async ({
    page
  }) => {
    await page.goto("/projects/fairview-childrens-center/");
    const trigger = page.getByRole("button", { name: /View full size:/ }).first();
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Image lightbox" });
    await expect(dialog).toBeVisible();
    const expandedImage = dialog.locator('[role="group"] > img');
    await expect(expandedImage).toHaveAttribute("alt", /\S+/);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Space");
    await expect(dialog).toBeVisible();
  });
});
