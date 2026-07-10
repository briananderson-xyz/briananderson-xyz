import { expect, test } from "@playwright/test";

test.describe("terminal command navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("exposes a keyboard-operated combobox without nested interactive controls", async ({
    page
  }) => {
    const combobox = page.getByRole("combobox", { name: "Terminal command input" });

    await expect(page.locator("button input")).toHaveCount(0);
    await expect(combobox).toHaveAttribute("aria-expanded", "false");

    await combobox.focus();
    await expect(combobox).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("listbox", { name: "Terminal commands" })).toBeVisible();

    await combobox.fill("blog");
    const option = page.getByRole("option", { name: /cd blog/i });
    await expect(option).toHaveAttribute("aria-selected", "true");
    await expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      await option.getAttribute("id")
    );

    await combobox.press("Enter");
    await expect(page).toHaveURL(/\/blog\/$/);
  });

  test("handles empty results and 100 repeated focus/type/Escape cycles without stalling", async ({
    page
  }) => {
    test.setTimeout(60_000);
    const combobox = page.getByRole("combobox", { name: "Terminal command input" });

    await combobox.focus();
    await combobox.fill("no-such-command");
    await expect(combobox).toHaveAttribute("aria-expanded", "false");
    await combobox.press("ArrowDown");
    await combobox.press("ArrowUp");
    await expect(combobox).toHaveValue("no-such-command");

    for (let cycle = 0; cycle < 100; cycle += 1) {
      await combobox.focus();
      await combobox.fill("help");
      await expect(combobox).toHaveAttribute("aria-expanded", "true");
      await combobox.press("ArrowDown");
      await combobox.press("Escape");
      await expect(combobox).toHaveValue("");
      await expect(combobox).toHaveAttribute("aria-expanded", "false");
    }
  });
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("announces state, closes with Escape, and restores toggle focus", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Open navigation menu" });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();

    const closeToggle = page.getByRole("button", { name: "Close navigation menu" });
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(closeToggle).toHaveAttribute("aria-expanded", "true");
    await expect(navigation).toBeVisible();

    await closeToggle.click();
    await expect(navigation).toBeHidden();
    await expect(toggle).toBeFocused();

    await toggle.click();
    await expect(navigation).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("closes after route navigation", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "./blog" })
      .click();

    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  });
});
