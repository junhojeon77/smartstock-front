export type WasteChartPoint = { label: string; value: number };

/** Number of tick intervals on the Y axis (so TICKS + 1 grid lines). */
const TICKS = 4;

/**
 * Round a maximum up to a "nice" axis ceiling (1, 2, 2.5, 5 or 10 x a power of
 * ten) so the tick labels land on readable numbers instead of the raw peak.
 */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1
    : normalized <= 2 ? 2
    : normalized <= 2.5 ? 2.5
    : normalized <= 5 ? 5
    : 10;
  return step * magnitude;
}

/** Compact tick text: integers stay whole, fractions get one decimal. */
function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function WasteTrendChart({ data }: { data: WasteChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value));

  if (data.length < 2 || max <= 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-600">
        Not enough waste data yet — log discarded stock to build the trend.
      </div>
    );
  }

  // Scale to a rounded ceiling so the top grid line carries a clean value.
  const axisMax = niceCeil(max);

  const w = 800;
  const h = 240;
  const padLeft = 64; // room for Y tick labels + the rotated axis title
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36; // room for the month labels
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;
  const stepX = plotW / (data.length - 1);

  // Zero sits on the bottom grid line; axisMax on the top one.
  const yFor = (value: number) => padTop + (1 - value / axisMax) * plotH;

  const points = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: yFor(d.value),
    ...d,
  }));

  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const value = (axisMax / TICKS) * i;
    return { value, y: yFor(value) };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const baselineY = yFor(0);
  const area = `${path} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Monthly waste trend from ${data[0].label} to ${data[data.length - 1].label}, peak ${formatTick(max)} units`}
      >
        <defs>
          <linearGradient id="wasteGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines with their values on the Y axis */}
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={padLeft}
              x2={w - padRight}
              y1={tick.y}
              y2={tick.y}
              className="stroke-slate-800"
              strokeWidth="1"
            />
            <text
              x={padLeft - 10}
              y={tick.y + 3.5}
              textAnchor="end"
              className="fill-slate-500"
              fontSize="11"
            >
              {formatTick(tick.value)}
            </text>
          </g>
        ))}

        {/* Y axis title */}
        <text
          transform={`rotate(-90 16 ${padTop + plotH / 2})`}
          x={16}
          y={padTop + plotH / 2}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize="11"
        >
          Quantity Wasted
        </text>

        <path d={area} fill="url(#wasteGradient)" />
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={p.x} cy={p.y} r="3" fill="#22d3ee" />
            {/* Larger transparent hit area so the native tooltip is easy to reach */}
            <circle cx={p.x} cy={p.y} r="12" fill="transparent">
              <title>
                {p.label}: {Math.round(p.value * 100) / 100} units wasted
              </title>
            </circle>
          </g>
        ))}

        {/* Month labels along the X axis */}
        {points.map((p, i) => (
          <text
            key={`${p.label}-label-${i}`}
            x={p.x}
            y={h - 12}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="11"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
