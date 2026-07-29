import type { CSSProperties, ReactNode } from "react";

export function AnimatedWrapper({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style: CSSProperties | undefined = delay
    ? { animationDelay: `${delay}s` }
    : undefined;

  return (
    <div className={`reveal-on-load ${className || ""}`} style={style}>
      {children}
    </div>
  );
}
