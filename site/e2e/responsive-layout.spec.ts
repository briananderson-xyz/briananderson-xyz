import { expect, test } from "@playwright/test";

const narrowRoutes = ["/", "/ops/", "/builder/", "/projects/"];
const narrowWidths = [320, 375, 390];

test.describe("narrow layouts", () => {
  for (const path of narrowRoutes) {
    for (const width of narrowWidths) {
      test(`${path} does not overflow a ${width}px viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height: 720 });
        await page.goto(path);

        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));

        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      });
    }
  }
});
