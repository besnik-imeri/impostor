import type { AvatarId } from "@impostor/domain";

export function getAvatarLabel(avatar: AvatarId): string {
  const [group, number] = avatar.split("-");
  const groupLabel = group === "girl" ? "Girl" : "Boy";
  return `${groupLabel} avatar ${number}`;
}
