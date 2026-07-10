import { expect, test } from "@playwright/test";

test.describe("Proof Ledger", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/proof/");
  });

  test("renders every validated claim with its source, excerpt, state, and freshness", async ({
    page
  }) => {
    await expect(page.getByRole("heading", { level: 1, name: "./proof-ledger" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(8);
    await expect(page.getByText("Exact supporting excerpt").first()).toBeVisible();
    await expect(page.getByText("Ledger reviewed").first()).toBeVisible();
    await expect(page.locator('a[href="/projects/discover-trident/"]')).toHaveCount(2);
    await expect(page.locator("time").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
  });

  test("uses cautious evidence language", async ({ page }) => {
    await expect(page.locator("main header p")).toContainText(
      "a listed source does not, by itself, independently verify a claim"
    );
    await expect(
      page.getByText(/traceability, not independent verification/i).first()
    ).toBeVisible();
  });

  test("filters by evidence state with pressed-state semantics", async ({ page }) => {
    const selfReported = page.getByRole("button", { name: "Self-reported" });
    await selfReported.click();
    await expect(selfReported).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.getByText("Showing 1 of 8 claims.")).toBeVisible();

    const externallyCorroborated = page.getByRole("button", { name: "Externally corroborated" });
    await externallyCorroborated.click();
    await expect(page.getByText("No claims currently use this evidence state.")).toBeVisible();
  });

  test("is prerendered with all claims before client filtering", async ({ request }) => {
    const response = await request.get("/proof/");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect((html.match(/<article/g) ?? []).length).toBe(8);
    expect(html).toContain("projects/discover-trident.md");
  });
});
