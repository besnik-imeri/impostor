import { expect, test, type Page } from "@playwright/test";

test("landing page routes into the play setup on mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Impostor", exact: true })).toBeVisible();
  await page
    .locator(".arcade-cabinet__deck")
    .getByRole("link", { name: /Join game/u })
    .click();
  await expect(page).toHaveURL(/\/play/u);
  await expect(page.getByLabel("Room code")).toBeVisible();
});

test("theme toggle persists across landing and play", async ({ page }) => {
  await page.goto("/play");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("landing lobby and mode controls expose their selected state", async ({ page }) => {
  await page.goto("/");

  const retroRex = page.getByRole("button", { name: /RetroRex/u });
  await retroRex.click();
  await expect(retroRex).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("RetroRex selected")).toBeVisible();

  const suspicion = page.getByRole("button", { name: /Suspicion/u });
  await suspicion.click();
  await expect(suspicion).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Cartridge selected:/u)).toContainText("Suspicion");
});

test("reverse psychology mode is visible but unavailable", async ({ page }) => {
  await page.goto("/play");
  await ensureHostSetupVisible(page);

  const setupFlow = page.getByRole("group", { name: "Choose setup flow" });
  await expect(setupFlow).toBeVisible();
  await expect(setupFlow.getByRole("button", { name: "Host" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: /^Accusation/u })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  const reverseMode = page.getByRole("button", { name: /Reverse Psychology/u });
  await expect(reverseMode).toBeVisible();
  await expect(reverseMode).toBeDisabled();
});

test("mobile setup moves focus in and restores it on return", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Mobile Chrome", "Mobile focus behavior only.");
  await page.goto("/play");

  const hostAction = page.locator(".quick-action-card.is-host");
  await expect(hostAction).not.toBeFocused();
  await hostAction.click();

  const backButton = page.getByRole("button", { name: "Back to game menu" });
  await expect(backButton).toBeFocused();
  await backButton.click();
  await expect(hostAction).toBeFocused();

  await page.goto("/play?room=ABC123");
  await expect(backButton).toBeFocused();
  await backButton.click();
  await expect(hostAction).toBeFocused();
});

test("landing and play screens do not overflow horizontally", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(await hasHorizontalOverflow(page)).toBe(false);

  await page.goto("/play");
  await expect(page.locator(".play-home")).toBeVisible();
  await expect(await hasHorizontalOverflow(page)).toBe(false);
});

test("landing and play screens emit no browser errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Impostor", exact: true })).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);

  await page.goto("/play");
  await expect(page.locator(".play-home")).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);

  expect(browserErrors).toEqual([]);
});

test("legacy room query opens the play join flow", async ({ page }) => {
  await page.goto("/?room=ABC123");

  await expect(page).toHaveURL(/\/play\?room=ABC123/u);
  await expect(page.getByLabel("Room code")).toHaveValue("ABC123");
});

test("room request failures stay in setup with an actionable error", async ({ page }) => {
  await page.route("**/api/rooms", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: "Room service unavailable." }),
      contentType: "application/json",
      status: 503
    });
  });

  await page.goto("/play");
  await ensureHostSetupVisible(page);
  await page.getByLabel("Nickname").fill("Host");
  const createButton = page.getByRole("button", { name: "Create room" });
  await createButton.click();

  await expect(page.getByRole("alert")).toHaveText("Room service unavailable.");
  await expect(createButton).toBeEnabled();
});

test("host can create a room and start a three-player round", async ({ browser, page }) => {
  await page.goto("/play");
  await ensureHostSetupVisible(page);
  await page.getByLabel("Nickname").fill("Host");
  await page.getByRole("button", { name: "Create room" }).click();

  const roomCode = await page.locator(".room-code").innerText({ timeout: 10_000 });
  await expect(page.getByText("Lobby", { exact: true })).toBeVisible();
  await expect(page.locator(".connection-pill.is-online:visible").first()).toContainText("Live");
  await expect(page.locator("button.topbar-leave-button")).toBeVisible();
  await expect(page.locator("button.topbar-leave-button")).toHaveAccessibleName("Leave room");

  const playerTwoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerThreeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerTwo = await playerTwoContext.newPage();
  const playerThree = await playerThreeContext.newPage();

  try {
    await playerTwo.goto(`/play?room=${roomCode}`);
    await playerTwo.getByLabel("Nickname").fill("Blair");
    await playerTwo.getByRole("button", { name: "Join room" }).click();
    await expect(playerTwo.locator(".connection-pill.is-online:visible").first()).toContainText(
      "Live"
    );

    await playerThree.goto(`/play?room=${roomCode}`);
    await playerThree.getByLabel("Nickname").fill("Casey");
    await playerThree.getByRole("button", { name: "Join room" }).click();
    await expect(playerThree.locator(".connection-pill.is-online:visible").first()).toContainText(
      "Live"
    );

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
  await ensureHostSetupVisible(page);
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

    await accuser.page.getByRole("button", { name: impostor.name }).click();
    await accuser.page.getByRole("button", { name: "Accuse", exact: true }).click();

    await expect(page.getByRole("button", { name: "Next round" })).toBeVisible();
    const resetTrigger = page.getByRole("button", { name: "Set up another game" });
    await resetTrigger.click();
    const resetDialog = page.getByRole("dialog", { name: "Set up another game?" });
    await expect(resetDialog).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(resetDialog).toBeHidden();
    await expect(resetTrigger).toBeFocused();

    await resetTrigger.click();
    await expect(resetDialog).toBeFocused();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(resetTrigger).toBeFocused();
    await expect(page.getByRole("button", { name: "Next round" })).toBeVisible();

    await resetTrigger.click();
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
  await ensureHostSetupVisible(page);
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

    await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled({
      timeout: 10_000
    });
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
    await expect(
      accuser.page.getByRole("dialog", { name: `Accuse ${impostor.name}?` })
    ).toBeFocused();
    await accuser.page.getByRole("button", { name: "Accuse", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Set up another game" })).toBeVisible();
    await page.getByRole("button", { name: "Set up another game" }).click();

    await expect(page.getByText("Gather the suspects.")).toBeVisible({ timeout: 10_000 });
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

async function ensureHostSetupVisible(page: Page) {
  const nickname = page.getByLabel("Nickname");
  if (await nickname.isVisible()) return;

  await page.getByRole("button", { name: "Host game", exact: true }).click();
  await expect(nickname).toBeVisible();
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
