import { test, expect } from "@playwright/test";

test("paste fills all OTP inputs and triggers animation", async ({ page }) => {
  await page.goto("/forgot-password");

  // Fill email and send OTP
  await page.fill('input[type="email"]', "amanraj3567@gmail.com");
  await page.click('button:has-text("Send Verification OTP")');

  // Wait for OTP inputs to appear
  const inputs = page.locator('input[inputmode="numeric"]');
  await expect(inputs.first()).toBeVisible();

  // Write to clipboard in browser context then paste
  await page.evaluate(() => navigator.clipboard.writeText("123456"));

  // Focus first input and paste
  await inputs.first().focus();

  // Use Control+V for paste (works in non-Mac CI); Playwright will handle modifiers appropriately
  await page.keyboard.press("Control+V");

  // Assert all inputs filled
  for (let i = 0; i < 6; i++) {
    await expect(inputs.nth(i)).toHaveValue(String(1 + i));
  }

  // Assert container has animation class applied briefly
  const container = page.locator(".flex.justify-center.animate-paste-complete");
  await expect(container).toHaveCount(1);
});
