import { expect, test } from "@playwright/test";

const expectedSiteOrigin = new URL(process.env.PUBLIC_SITE_URL || "https://briananderson.xyz")
  .origin;

const publicSurfaces = [
  { path: "/proof/", heading: "Claims & evidence", footerLabel: "claims & evidence" },
  {
    path: "/trace-one-answer/",
    heading: "How this site's AI works",
    footerLabel: "how ai works"
  }
];

test.describe("visitor-oriented secondary pages", () => {
  for (const surface of publicSurfaces) {
    test(`${surface.path} is prerendered and linked from the footer`, async ({ page }) => {
      await page.goto(surface.path);
      await expect(page.getByRole("heading", { level: 1, name: surface.heading })).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Site and contact links" })
          .getByRole("link", { name: new RegExp(surface.footerLabel, "i") })
      ).toHaveAttribute("href", surface.path);
    });
  }

  test("machine-readable discovery includes canonical pages, not forwarding routes", async ({
    request
  }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const llms = await (await request.get("/llms.txt")).text();
    const llmsFull = await (await request.get("/llms-full.txt")).text();

    for (const surface of publicSurfaces) {
      expect(sitemap).toContain(`${expectedSiteOrigin}${surface.path}`);
      expect(llms).toContain(`${expectedSiteOrigin}${surface.path}`);
      expect(llmsFull).toContain(`${expectedSiteOrigin}${surface.path}`);
    }
    expect(sitemap).not.toContain(`${expectedSiteOrigin}/ai-evals/`);
    expect(sitemap).not.toContain(`${expectedSiteOrigin}/uses/`);
  });

  test("site metadata uses the human-facing page names", async ({ page }) => {
    await page.goto("/");
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();

    expect(structuredData).toContain("Claims & Evidence");
    expect(structuredData).toContain("How This Site's AI Works");
    expect(structuredData).not.toContain("AI Evaluation Trends");
  });

  test("terminal discovery uses plain visitor language", async ({ page }) => {
    await page.goto("/");
    const terminal = page.getByRole("combobox", { name: "Terminal command input" });

    await terminal.fill("claims");
    await expect(page.getByRole("option", { name: /claims & evidence/i })).toBeVisible();
    await terminal.press("Enter");
    await expect(page).toHaveURL(/\/proof\/$/);
  });

  test("uses forwards to the one canonical setup section", async ({ page }) => {
    await page.goto("/uses/");
    await expect(page).toHaveURL(/\/interests\/#setup$/);
    await expect(page.locator("#setup")).toBeVisible();
  });
});
