import { expect, test } from "@playwright/test";

test("home screen exposes host and join flows on mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /run the round/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Host" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join" })).toBeVisible();

  await page.getByRole("button", { name: "Join" }).click();
  await expect(page.getByLabel("Room code")).toBeVisible();
});

test("host can create a room and start a three-player round", async ({ browser, page }) => {
  await page.goto("/");
  await page.getByLabel("Nickname").fill("Host");
  await page.getByRole("button", { name: "Create room" }).click();

  const roomCode = await page.locator(".room-code").innerText({ timeout: 10_000 });
  await expect(page.getByText("Lobby")).toBeVisible();
  await expect(page.getByText("Live")).toBeVisible();

  const playerTwoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerThreeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerTwo = await playerTwoContext.newPage();
  const playerThree = await playerThreeContext.newPage();

  try {
    await playerTwo.goto(`/?room=${roomCode}`);
    await playerTwo.getByLabel("Nickname").fill("Blair");
    await playerTwo.getByRole("button", { name: "Join room" }).click();
    await expect(playerTwo.getByText("Live")).toBeVisible();

    await playerThree.goto(`/?room=${roomCode}`);
    await playerThree.getByLabel("Nickname").fill("Casey");
    await playerThree.getByRole("button", { name: "Join room" }).click();
    await expect(playerThree.getByText("Live")).toBeVisible();

    await page.getByRole("button", { name: "Ready up" }).click();
    await playerTwo.getByRole("button", { name: "Ready up" }).click();
    await playerThree.getByRole("button", { name: "Ready up" }).click();

    await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled({
      timeout: 10_000
    });
    await page.getByRole("button", { name: "Start game" }).click();

    await expect(page.getByText("Round 1")).toBeVisible();
    await expect(page.getByText(/Starting speaker:/)).toBeVisible();
  } finally {
    await playerTwoContext.close();
    await playerThreeContext.close();
  }
});
