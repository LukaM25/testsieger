import type { CSSProperties } from "react";

export function stagger(index: number): CSSProperties {
  return { ["--stagger-index" as string]: index } as CSSProperties;
}
