import type { AvatarId, PlayerColor } from "@imposter/domain";
import type { CSSProperties } from "react";

const avatarLabels: Record<AvatarId, string> = {
  comet: "Co",
  spark: "Sp",
  mask: "Ma",
  moon: "Mo",
  pulse: "Pu",
  orbit: "Or",
  nova: "No",
  echo: "Ec",
  riddle: "Ri",
  cipher: "Ci",
  mimic: "Mi",
  glimmer: "Gl"
};

interface AvatarMarkProps {
  avatar: AvatarId;
  color: PlayerColor;
  size?: "sm" | "md" | "lg";
}

export function AvatarMark({ avatar, color, size = "md" }: AvatarMarkProps) {
  return (
    <span
      className={`avatar-mark avatar-mark-${size}`}
      style={{ "--avatar-color": color } as CSSProperties}
    >
      {avatarLabels[avatar]}
    </span>
  );
}
