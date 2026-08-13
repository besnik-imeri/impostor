import { describe, expect, it } from "vitest";
import { getAvatarAssetPath, getAvatarLabel } from "./avatars";

describe("arcade avatars", () => {
  it("provides display labels for arcade character ids", () => {
    expect(getAvatarLabel("8-bit-bunny")).toBe("8-Bit Bunny");
    expect(getAvatarLabel("master-monkey")).toBe("Master Monkey");
    expect(getAvatarLabel("robo-shark")).toBe("Robo Shark");
  });

  it("resolves arcade characters from the public webp directory", () => {
    expect(getAvatarAssetPath("glitch-cat")).toBe("/arcade/characters/glitch-cat.webp");
  });

  it("keeps legacy room avatars renderable during the roster migration", () => {
    expect(getAvatarLabel("girl-3")).toBe("Girl avatar 3");
    expect(getAvatarAssetPath("girl-3")).toBe("/avatars/girl-3.svg");
  });
});
