interface Props {
  className?: string;
  height?: number;
}

/** Decorative guilloche line divider — a passport-style ornamental rule. */
export function Guilloche({ className, height = 14 }: Props) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height,
        backgroundImage: "var(--guilloche)",
        opacity: 0.55,
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)",
      }}
    />
  );
}