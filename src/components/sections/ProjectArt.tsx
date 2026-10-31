import type { ProjectArtKind } from "@/data/site";

/** Simple generative covers per project, drawn in the card's ink colour. Swap for real screenshots later. */
export function ProjectArt({ kind, ink }: { kind: ProjectArtKind; ink: string }) {
  const stroke = { stroke: ink, fill: "none", strokeWidth: 3, strokeLinecap: "round" as const };
  if (kind === "waves") {
    return (
      <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx="230" cy="200" r={40 + i * 30} {...stroke} opacity={1 - i * 0.14} />)}
        <circle cx="230" cy="200" r="22" fill={ink} />
      </svg>
    );
  }
  if (kind === "flow") {
    const nodes = [[90, 90], [260, 70], [170, 200], [320, 220], [110, 320], [280, 340]];
    return (
      <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
        <path d="M90 90 C170 90 170 200 170 200 M260 70 C260 150 170 200 170 200 M170 200 C250 200 320 220 320 220 M170 200 C120 260 110 320 110 320 M320 220 C320 300 280 340 280 340" {...stroke} />
        {nodes.map(([x, y]) => <rect key={`${x}${y}`} x={x - 26} y={y - 18} width="52" height="36" rx="18" fill={ink} />)}
      </svg>
    );
  }
  if (kind === "bars") {
    return (
      <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
        {[120, 200, 150, 260, 210, 310].map((h, i) => <rect key={i} x={60 + i * 50} y={360 - h} width="34" height={h} rx="17" fill={ink} opacity={0.35 + i * 0.13} />)}
        <path d="M60 230 C140 210 200 150 330 70" {...stroke} />
      </svg>
    );
  }
  const pts = Array.from({ length: 14 }, (_, i) => [200 + Math.cos(i * 2.39) * (40 + i * 11), 200 + Math.sin(i * 2.39) * (40 + i * 11)]);
  const lines: [number[], number[]][] = [];
  pts.forEach((a, i) => pts.slice(i + 1).forEach((b) => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 120) lines.push([a, b]); }));
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
      {lines.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...stroke} opacity={0.55} />)}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={ink} />)}
    </svg>
  );
}

export const TONE_BG = { lime: "#C9F28C", lilac: "#B0A1F9", bone: "#E3E7D6", deep: "#2B4A30" } as const;
export const inkFor = (tone: keyof typeof TONE_BG) => (tone === "deep" ? "#C9F28C" : "#1E3422");
