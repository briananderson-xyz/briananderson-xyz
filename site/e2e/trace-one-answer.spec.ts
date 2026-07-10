import { expect, test } from "@playwright/test";

test.describe("Trace One Answer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/trace-one-answer/");
  });

  test("renders a semantic, candid architecture flow", async ({ page }) => {
    await expect(page).toHaveTitle(/Trace One AI Answer/);
    await expect(page.getByRole("heading", { level: 1, name: "./trace-one-answer" })).toBeVisible();

    const flow = page.getByRole("list").filter({
      has: page.getByRole("heading", { name: "Browser client prepares the request" })
    });
    await expect(flow.locator(":scope > li")).toHaveCount(6);
    await expect(page.getByText("External contract", { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/in-memory limiter is per Cloud Run instance/i)).toBeVisible();
    await expect(page.getByText(/sanitized in the browser before rendering/i)).toBeVisible();
  });

  test("is prerendered with canonical metadata and limitations", async ({ request }) => {
    const response = await request.get("/trace-one-answer/");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(html).toContain('rel="canonical" href="https://briananderson.xyz/trace-one-answer/"');
    expect(html).toContain("What this trace cannot prove");
    expect(html).toContain("live Cloudflare routing");
    expect(html).toContain("Do not submit");
    expect(html).toContain("secrets or confidential hiring material.");
  });

  test("does not overflow a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.reload();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
