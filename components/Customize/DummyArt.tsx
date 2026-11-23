// Placeholder artwork for the empty card. Drawn with your theme colors, so it follows dark mode.
export default function DummyArt({ ratio = 1 / Math.SQRT2 }: { ratio?: number }) {
  const landscape = ratio >= 1;
  const w = landscape ? 141.4 : 100;
  const h = landscape ? 100 : 141.4;
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${x * w},${y * h}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <rect width={w} height={h} className="fill-muted" />
      <circle
        cx={w * 0.5}
        cy={h * (landscape ? 0.36 : 0.35)}
        r={Math.min(w, h) * 0.22}
        className="fill-accent stroke-foreground"
        strokeWidth={2}
      />
      <polygon
        points={pts([[0, 1], [0, 0.68], [0.24, 0.5], [0.44, 0.65], [0.66, 0.42], [1, 0.7], [1, 1]])}
        className="fill-foreground"
      />
      <polygon
        points={pts([[0, 1], [0, 0.82], [0.3, 0.71], [0.58, 0.83], [1, 0.74], [1, 1]])}
        className="fill-card stroke-foreground"
        strokeWidth={2}
      />
    </svg>
  );
}