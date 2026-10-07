import { test, expect } from "@playwright/test";
test("real app navigation, session isolation, fresh values, mobile and logout", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const page = await a.newPage(),
    other = await b.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A small app. Real support." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start my demo" }).click();
  await expect(page.getByText("3,760", { exact: true })).toBeVisible();
  await other.goto("/");
  await other.getByRole("button", { name: "Start my demo" }).click();
  await expect(other.getByText("3,760", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Record demo activity" }).click();
  await expect(page.getByText("3,750", { exact: true })).toBeVisible();
  await other.reload();
  await expect(other.getByText("3,760", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "output/playwright/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 375);
  await page.screenshot({
    path: "output/playwright/mobile-375.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to Sandbox" }).click();
  await expect(page.getByText("88", { exact: true })).toBeVisible();
  await expect(page.getByText("A clean slate.")).toBeVisible();
  await page.getByRole("button", { name: "End demo session" }).click();
  await expect(
    page.getByRole("button", { name: "Start my demo" }),
  ).toBeVisible();
  const response = await page.request.get("/api/onetwoagent/identity");
  expect(response.status()).toBe(401);
  expect(errors).toEqual([]);
  await a.close();
  await b.close();
});
