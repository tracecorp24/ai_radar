import { expect, test } from "@playwright/test";

const routes = ["/", "/research", "/models", "/people", "/trends", "/bookmarks", "/sources", "/settings"];

test("all local routes render without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("responsive navigation remains usable", async ({ page }) => {
  await page.goto("/research");
  await expect(page.locator("main")).toContainText("Makale odaklı araştırma akışı");
  const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, offenders: [...document.querySelectorAll<HTMLElement>("body *")].filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 8).map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width) })) }));
  expect(layout.overflow, `horizontal viewport overflow: ${JSON.stringify(layout.offenders)}`).toBeLessThanOrEqual(1);
});
