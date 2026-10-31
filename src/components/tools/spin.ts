export type Spin = { vx: number; vy: number; dragging: boolean };

/**
 * Evenly spread points on a sphere, kept out of the polar caps: near the poles the labels
 * are packed so tightly that they overlap (that’s what made “Python” sit on “TypeScript”).
 */
export function fibonacciSphere(n: number, cap = 0.78) {
  return Array.from({ length: n }, (_, i) => {
    const phi = Math.acos(cap * (1 - (2 * (i + 0.5)) / n));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return { x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) };
  });
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
