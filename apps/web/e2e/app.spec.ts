import { expect, test, type Page } from "@playwright/test";

test("landing page routes into the play setup on mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Impostor" })).toBeVisible();
  await page.getByRole("link", { name: "Start playing" }).first().click();
  await expect(page).toHaveURL(/\/play/u);
  await expect(page.getByRole("button", { name: "Host", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Join", exact: true }).click();
  await expect(page.getByLabel("Room code")).toBeVisible();
});

test("theme toggle persists across landing and play", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.goto("/play");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("reverse psychology mode is visible but unavailable", async ({ page }) => {
  await page.goto("/play");

  const reverseMode = page.getByRole("button", { name: /Reverse Psychology/u });
  await expect(reverseMode).toBeVisible();
  await expect(reverseMode).toBeDisabled();
});

test("landing and play screens do not overflow horizontally", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(await hasHorizontalOverflow(page)).toBe(false);

  await page.goto("/play");
  await expect(page.getByRole("button", { name: "Host", exact: true })).toBeVisible();
  await expect(await hasHorizontalOverflow(page)).toBe(false);
});

test("legacy room query opens the play join flow", async ({ page }) => {
  await page.goto("/?room=ABC123");

  await expect(page).toHaveURL(/\/play\?room=ABC123/u);
  await expect(page.getByLabel("Room code")).toHaveValue("ABC123");
});

test("host can create a room and start a three-player round", async ({ browser, page }) => {
  await page.goto("/play");
  await page.getByLabel("Nickname").fill("Host");
  await page.getByRole("button", { name: "Create room" }).click();

  const roomCode = await page.locator(".room-code").innerText({ timeout: 10_000 });
  await expect(page.getByText("Lobby", { exact: true })).toBeVisible();
  await expect(page.getByText("Live")).toBeVisible();

  const playerTwoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerThreeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerTwo = await playerTwoContext.newPage();
  const playerThree = await playerThreeContext.newPage();

  try {
    await playerTwo.goto(`/play?room=${roomCode}`);
    await playerTwo.getByLabel("Nickname").fill("Blair");
    await playerTwo.getByRole("button", { name: "Join room" }).click();
    await expect(playerTwo.getByText("Live")).toBeVisible();

    await playerThree.goto(`/play?room=${roomCode}`);
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

test("host can reset from round results after confirmation", async ({ browser, page }) => {
  await page.goto("/play");
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

    await page.getByRole("button", { name: "Start game" }).click();

    const players = [
      { name: "Host", page },
      { name: "Blair", page: playerTwo },
      { name: "Casey", page: playerThree }
    ];
    const impostor = await findPlayerWithText(players, "You are the impostor");
    const accuser = players.find((player) => player.name !== impostor.name);

    if (!accuser) {
      throw new Error("No non-impostor player was available to accuse.");
    }

    await accuser.page.getByRole("button", { name: impostor.name }).click();
    await accuser.page.getByRole("button", { name: "Accuse" }).click();

    await expect(page.getByRole("button", { name: "Next round" })).toBeVisible();
    await page.getByRole("button", { name: "Set up another game" }).click();
    await expect(page.getByRole("dialog", { name: "Set up another game?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Next round" })).toBeVisible();

    await page.getByRole("button", { name: "Set up another game" }).click();
    await page.getByRole("button", { name: "Reset game" }).click();

    await expect(page.getByText("Gather the suspects.")).toBeVisible();
    await expect(page.getByText("3/6 joined. 0 ready.")).toBeVisible();
  } finally {
    await playerTwoContext.close();
    await playerThreeContext.close();
  }
});

test("final results can return the same room to lobby", async ({ browser, page }) => {
  await page.goto("/play");
  await page.getByLabel("Nickname").fill("Host");
  await page.getByRole("button", { name: "Create room" }).click();

  const roomCode = await page.locator(".room-code").innerText({ timeout: 10_000 });
  await page.getByLabel("Rounds").fill("1");
  await page.getByRole("button", { name: "Apply settings" }).click();

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

    await page.getByRole("button", { name: "Start game" }).click();

    const players = [
      { name: "Host", page },
      { name: "Blair", page: playerTwo },
      { name: "Casey", page: playerThree }
    ];

    for (const player of players) {
      await expect(player.page.getByText("Round 1")).toBeVisible();
    }

    const impostor = await findPlayerWithText(players, "You are the impostor");
    const accuser = players.find((player) => player.name !== impostor.name);

    if (!accuser) {
      throw new Error("No non-impostor player was available to accuse.");
    }

    const impostorAccuseTarget = players.find((player) => player.name !== impostor.name);
    if (!impostorAccuseTarget) {
      throw new Error("No non-impostor target was available for the impostor view.");
    }
    await expect(
      impostor.page.getByRole("button", { name: impostorAccuseTarget.name })
    ).toBeDisabled();

    await accuser.page.getByRole("button", { name: impostor.name }).click();
    await accuser.page.getByRole("button", { name: "Accuse" }).click();

    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Set up another game" })).toBeVisible();
    await page.getByRole("button", { name: "Set up another game" }).click();

    await expect(page.getByText("Gather the suspects.")).toBeVisible();
    await expect(page.getByText("3/6 joined. 0 ready.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeHidden();

    await page.getByRole("button", { name: "Show leaderboard" }).click();
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  } finally {
    await playerTwoContext.close();
    await playerThreeContext.close();
  }
});

async function findPlayerWithText(players: Array<{ name: string; page: Page }>, text: string) {
  for (const player of players) {
    if (await player.page.getByText(text).isVisible()) {
      return player;
    }
  }

  throw new Error(`No player page contained ${text}.`);
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
