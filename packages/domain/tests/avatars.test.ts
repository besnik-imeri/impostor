import { describe, expect, it } from "vitest";
import { AVATARS } from "../src";

const expectedArcadeAvatars = [
  "8-bit-bunny",
  "arcade-owl",
  "astro-koala",
  "cyber-fox",
  "foggy-frog",
  "glitch-cat",
  "master-monkey",
  "neon-ninja",
  "pixel-panda",
  "punky-penguin",
  "retro-rex",
  "robo-shark",
  "turbo-monkey"
] as const;

describe("arcade avatars", () => {
  it("exports the complete stable character roster", () => {
    expect(AVATARS).toEqual(expectedArcadeAvatars);
    expect(new Set(AVATARS).size).toBe(AVATARS.length);
    expect(AVATARS.every((avatar) => /^[a-z0-9]+(?:-[a-z0-9]+)+$/u.test(avatar))).toBe(true);
  });
});
