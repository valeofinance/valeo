// Leichte, servergerenderte SVG-Diagramme (kein Client-JS, keine Extra-Deps).
// Bewusst je Chart eine einzige Datenreihe -> farbfehlsichtigkeitssicher.
// Marken sitzen auf der Nulllinie, runde Enden, dezente Achsen.

export type Point = { label: string; value: number };

const W = 560;
const H = 190;
const PAD_X = 10;
const PAD_TOP = 26;
const PAD_BOTTOM = 26;
const PLOT_H = H - PAD_TOP - PAD_BOTTOM;

function niceLabel(fmt: (n: number) => string, v: number) {
  return fmt(v);
}

// Balkendiagramm (Magnitude über Zeit), z. B. Umsatz je Monat.
export function BarChart({
  data,
  format,
  color = "var(--accent)",
  ariaLabel,
}: {
  data: Point[];
  format: (n: number) => string;
  color?: string;
  ariaLabel: string;
}) {
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), 1);
  const band = (W - 2 * PAD_X) / n;
  const barW = Math.min(band * 0.56, 34);
  const baseY = PAD_TOP + PLOT_H;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1={PAD_X} y1={baseY} x2={W - PAD_X} y2={baseY} className="chart-axis" />
      {data.map((d, i) => {
        const h = (d.value / max) * PLOT_H;
        const x = PAD_X + i * band + (band - barW) / 2;
        const y = baseY - h;
        const last = i === n - 1;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 1)}
              rx={4}
              fill={color}
              opacity={last ? 1 : 0.42}
            >
              <title>{`${d.label}: ${niceLabel(format, d.value)}`}</title>
            </rect>
            {last && (
              <text x={x + barW / 2} y={y - 8} className="chart-val" textAnchor="middle">
                {format(d.value)}
              </text>
            )}
            <text x={x + barW / 2} y={baseY + 16} className="chart-lbl" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Flächendiagramm (Bestand/Verlauf ab 0), z. B. Liquidität.
export function AreaChart({
  data,
  format,
  color = "var(--pos)",
  ariaLabel,
  id,
}: {
  data: Point[];
  format: (n: number) => string;
  color?: string;
  ariaLabel: string;
  id: string;
}) {
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), 1);
  const baseY = PAD_TOP + PLOT_H;
  const step = (W - 2 * PAD_X) / Math.max(n - 1, 1);
  const xs = data.map((_, i) => PAD_X + i * step);
  const ys = data.map((d) => baseY - (d.value / max) * PLOT_H);
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[n - 1]},${baseY} L${xs[0]},${baseY} Z`;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={PAD_X} y1={baseY} x2={W - PAD_X} y2={baseY} className="chart-axis" />
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const last = i === n - 1;
        return (
          <g key={d.label}>
            <circle cx={xs[i]} cy={ys[i]} r={last ? 5 : 4} fill={color} stroke="#fff" strokeWidth={last ? 2 : 1.5}>
              <title>{`${d.label}: ${niceLabel(format, d.value)}`}</title>
            </circle>
            {last && (
              <text x={xs[i]} y={ys[i] - 12} className="chart-val" textAnchor="end">
                {format(d.value)}
              </text>
            )}
            {(i % 2 === 0 || last) && (
              <text x={xs[i]} y={baseY + 16} className="chart-lbl" textAnchor="middle">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Liniendiagramm für Raten (z. B. EBITDA-Marge in %), mit 0/Mitte/Max-Gitter.
export function LineChart({
  data,
  format,
  color = "var(--accent)",
  ariaLabel,
}: {
  data: Point[];
  format: (n: number) => string;
  color?: string;
  ariaLabel: string;
}) {
  const n = data.length;
  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const max = Math.ceil(rawMax / 10) * 10 || 10; // auf 10er runden (Prozent)
  const baseY = PAD_TOP + PLOT_H;
  const step = (W - 2 * PAD_X) / Math.max(n - 1, 1);
  const xs = data.map((_, i) => PAD_X + i * step);
  const ys = data.map((d) => baseY - (d.value / max) * PLOT_H);
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const grid = [0, max / 2, max];

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      {grid.map((g) => {
        const y = baseY - (g / max) * PLOT_H;
        return (
          <g key={g}>
            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} className="chart-grid" />
            <text x={PAD_X} y={y - 4} className="chart-lbl">
              {format(g)}
            </text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const last = i === n - 1;
        return (
          <g key={d.label}>
            <circle cx={xs[i]} cy={ys[i]} r={last ? 5 : 4} fill={color} stroke="#fff" strokeWidth={last ? 2 : 1.5}>
              <title>{`${d.label}: ${niceLabel(format, d.value)}`}</title>
            </circle>
            {last && (
              <text x={xs[i]} y={ys[i] - 12} className="chart-val" textAnchor="end">
                {format(d.value)}
              </text>
            )}
            {(i % 2 === 0 || last) && (
              <text x={xs[i]} y={baseY + 16} className="chart-lbl" textAnchor="middle">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
