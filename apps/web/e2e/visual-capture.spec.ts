import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(process.cwd(), "..", "..", "output", "playwright");

test.describe("design QA captures", () => {
  test.skip(process.env.CAPTURE_VISUALS !== "1", "Set CAPTURE_VISUALS=1 to refresh screenshots.");

  test.beforeAll(async () => {
    await mkdir(outputDirectory, { recursive: true });
  });

  test("captures landing and setup surfaces", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.setViewportSize({ width: 841, height: 1870 });
    await page.goto("/");
    await settleVisuals(page);
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: resolve(outputDirectory, "landing-arcade-841.png")
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await settleVisuals(page);
    await page.screenshot({
      animations: "disabled",
      fullPage: false,
      path: resolve(outputDirectory, "landing-arcade-mobile.png")
    });

    await page.goto("/play");
    await settleVisuals(page);
    await page.screenshot({
      animations: "disabled",
      fullPage: false,
      path: resolve(outputDirectory, "play-arcade-mobile.png")
    });

    await page.getByRole("button", { name: "Host game", exact: true }).click();
    await expect(page.getByLabel("Nickname")).toBeVisible();
    await page.screenshot({
      animations: "disabled",
      fullPage: false,
      path: resolve(outputDirectory, "play-host-mobile.png")
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/play");
    await settleVisuals(page);
    await page.screenshot({
      animations: "disabled",
      fullPage: false,
      path: resolve(outputDirectory, "play-host-desktop.png")
    });
  });

  test("captures a live desktop round", async ({ browser, page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/play");
    await page.getByRole("button", { name: /^Suspicion/u }).click();
    await page.getByLabel("Nickname").fill("Host");
    await page.getByRole("button", { name: "Create room" }).click();

    const roomCode = await page.locator(".room-code").innerText({ timeout: 10_000 });
    const playerTwoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const playerThreeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const playerTwo = await playerTwoContext.newPage();
    const playerThree = await playerThreeContext.newPage();

    try {
      await playerTwo.goto(`/play?room=${roomCode}`);
      await playerTwo.getByLabel("Nickname").fill("Blair");
      await playerTwo.getByRole("button", { name: "Join room" }).click();

      await playerThree.goto(`/play?room=${roomCode}`);
      await playerThree.getByLabel("Nickname").fill("Casey");
      await playerThree.getByRole("button", { name: "Join room" }).click();

      await page.getByRole("button", { name: "Ready up" }).click();
      await playerTwo.getByRole("button", { name: "Ready up" }).click();
      await playerThree.getByRole("button", { name: "Ready up" }).click();
      await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled({
        timeout: 10_000
      });
      await page.getByRole("button", { name: "Start game" }).click();
      const roundPages = [page, playerTwo, playerThree];
      for (const roundPage of roundPages) {
        await expect(roundPage.getByText("Round 1")).toBeVisible();
      }

      let capturePage = page;
      for (const roundPage of roundPages) {
        if (!(await roundPage.getByText("You are the impostor").isVisible())) {
          capturePage = roundPage;
          break;
        }
      }

      await capturePage.emulateMedia({ reducedMotion: "reduce" });
      await capturePage.setViewportSize({ width: 1440, height: 900 });
      await settleVisuals(capturePage);
      await capturePage.screenshot({
        animations: "disabled",
        fullPage: false,
        path: resolve(outputDirectory, "play-round-desktop.png")
      });
    } finally {
      await playerTwoContext.close();
      await playerThreeContext.close();
    }
  });
});

async function settleVisuals(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(250);
}
