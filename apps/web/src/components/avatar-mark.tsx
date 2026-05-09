import type { AvatarId, PlayerColor } from "@impostor/domain";
import type { CSSProperties } from "react";

interface AvatarMarkProps {
  avatar: AvatarId;
  color: PlayerColor;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "picker";
}

export function AvatarMark({ avatar, color, size = "md" }: AvatarMarkProps) {
  return (
    <span
      className={`avatar-mark avatar-mark-${size}`}
      style={{ "--avatar-color": color } as CSSProperties}
    >
      <img alt="" aria-hidden="true" src={`/avatars/${avatar}.svg`} />
    </span>
  );
}
