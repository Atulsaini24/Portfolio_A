export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

export const PALETTE = {
  forest: "#1E3422",
  forestDeep: "#132217",
  lime: "#C9F28C",
  lilac: "#B0A1F9",
  bone: "#F1F3EA",
  ink: "#0F1C12",
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
