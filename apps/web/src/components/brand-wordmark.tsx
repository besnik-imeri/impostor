interface BrandWordmarkProps {
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function BrandWordmark({
  alt = "Impostor",
  className,
  priority = false
}: BrandWordmarkProps) {
  const classes = ["brand-wordmark", className].filter(Boolean).join(" ");

  return (
    <img
      alt={alt}
      className={classes}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      height="560"
      loading={priority ? "eager" : undefined}
      src="/arcade/wordmark-hq.webp"
      width="2103"
    />
  );
}
