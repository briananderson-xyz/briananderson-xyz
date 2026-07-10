import { expect, test } from "@playwright/test";

const expectedSiteOrigin = new URL(process.env.PUBLIC_SITE_URL || "https://briananderson.xyz")
  .origin;

const publicSurfaces = [
  { path: "/proof/", heading: "./proof-ledger" },
  { path: "/ai-evals/", heading: "./ai-evals" },
  { path: "/trace-one-answer/", heading: "./trace-one-answer" }
];

test.describe("public evidence surfaces", () => {
  for (const surface of publicSurfaces) {
    test(`${surface.path} is prerendered and linked from the footer`, async ({ page }) => {
      await page.goto(surface.path);

      await expect(page.getByRole("heading", { level: 1, name: surface.heading })).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Evidence and contact links" }).getByRole("link", {
          name: new RegExp(
            surface.heading.includes("proof")
              ? "proof"
              : surface.heading.includes("evals")
                ? "ai evals"
                : "ai trace",
            "i"
          )
        })
      ).toHaveAttribute("href", surface.path);
    });
  }

  test("machine-readable discovery indexes include every evidence surface", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const llms = await (await request.get("/llms.txt")).text();
    const llmsFull = await (await request.get("/llms-full.txt")).text();

    for (const surface of publicSurfaces) {
      expect(sitemap).toContain(`${expectedSiteOrigin}${surface.path}`);
      expect(llms).toContain(`${expectedSiteOrigin}${surface.path}`);
      expect(llmsFull).toContain(`${expectedSiteOrigin}${surface.path}`);
    }
  });

  test("site metadata identifies the evidence surfaces as first-class pages", async ({ page }) => {
    await page.goto("/");
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();

    expect(structuredData).toContain("Proof Ledger");
    expect(structuredData).toContain("AI Evaluation Trends");
    expect(structuredData).toContain("Trace One AI Answer");
  });

  test("terminal discovery finds the Proof Ledger without adding another desktop nav item", async ({
    page
  }) => {
    await page.goto("/");
    const terminal = page.getByRole("combobox", { name: "Terminal command input" });

    await terminal.fill("proof");
    await expect(page.getByRole("option", { name: /cat proof-ledger/i })).toBeVisible();
    await terminal.press("Enter");
    await expect(page).toHaveURL(/\/proof\/$/);
  });
});
