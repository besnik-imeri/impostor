import type { ArcadeAvatarId, AvatarId, LegacyAvatarId } from "@impostor/domain";

const arcadeAvatarLabels: Record<ArcadeAvatarId, string> = {
  "8-bit-bunny": "8-Bit Bunny",
  "arcade-owl": "Arcade Owl",
  "astro-koala": "Astro Koala",
  "cyber-fox": "Cyber Fox",
  "foggy-frog": "Foggy Frog",
  "glitch-cat": "Glitch Cat",
  "master-monkey": "Master Monkey",
  "neon-ninja": "Neon Ninja",
  "pixel-panda": "Pixel Panda",
  "punky-penguin": "Punky Penguin",
  "retro-rex": "Retro Rex",
  "robo-shark": "Robo Shark",
  "turbo-monkey": "Turbo Monkey"
};

export function getAvatarLabel(avatar: AvatarId): string {
  if (isArcadeAvatarId(avatar)) {
    return arcadeAvatarLabels[avatar];
  }

  const [group, number] = avatar.split("-");
  const groupLabel = group === "girl" ? "Girl" : "Boy";
  return `${groupLabel} avatar ${number}`;
}

export function getAvatarAssetPath(avatar: AvatarId): string {
  return isLegacyAvatarId(avatar) ? `/avatars/${avatar}.svg` : `/arcade/characters/${avatar}.webp`;
}

function isArcadeAvatarId(avatar: AvatarId): avatar is ArcadeAvatarId {
  return avatar in arcadeAvatarLabels;
}

function isLegacyAvatarId(avatar: AvatarId): avatar is LegacyAvatarId {
  return avatar.startsWith("boy-") || avatar.startsWith("girl-");
}
