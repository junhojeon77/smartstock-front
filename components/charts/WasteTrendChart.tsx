const data = [
  { label: "Jan", value: 180 },
  { label: "Feb", value: 220 },
  { label: "Mar", value: 200 },
  { label: "Apr", value: 260 },
  { label: "May", value: 240 },
  { label: "Jun", value: 310 },
  { label: "Jul", value: 280 },
  { label: "Aug", value: 350 },
  { label: "Sep", value: 320 },
  { label: "Oct", value: 380 },
  { label: "Nov", value: 340 },
  { label: "Dec", value: 410 },
];

export function WasteTrendChart() {
  const w = 800;
  const h = 220;
  const padX = 30;
  const padY = 20;
  const max = Math.max(...data.map((d) => d.value));
  const stepX = (w - padX * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - d.value / max) * (h - padY * 2);
    return { x, y, ...d };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area = `${path} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wasteGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={padX}
            x2={w - padX}
            y1={padY + i * ((h - padY * 2) / 3)}
            y2={padY + i * ((h - padY * 2) / 3)}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#wasteGradient)" />
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3" fill="#22d3ee" />
        ))}

        {points.map((p) => (
          <text
            key={p.label}
            x={p.x}
            y={h - 4}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="10"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
