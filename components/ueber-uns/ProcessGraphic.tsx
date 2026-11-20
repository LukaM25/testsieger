'use client';

import { useInView } from './useInView';

const INK = '#2B4066';
const SKY = '#0ea5e9';

const CSS = `
.dpi-proc[data-in="false"] * { animation-play-state: paused !important; }
.dpi-proc .line { stroke-dasharray: 200; stroke-dashoffset: 0; animation: dpiLine 1s ease-out both; }
@keyframes dpiLine { from { stroke-dashoffset: 200; } }
.dpi-proc .node { animation: dpiNode .8s cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
@keyframes dpiNode { from { opacity: 0; transform: scale(.7); } }
.dpi-proc .label { animation: dpiFade .9s ease-out both; }
@keyframes dpiFade { from { opacity: 0; transform: translateY(5px); } }
.dpi-proc .loop { stroke-dasharray: 760; stroke-dashoffset: 0; animation: dpiLoop 2.4s ease-out 2.4s both; }
@keyframes dpiLoop { from { stroke-dashoffset: 760; } }
.dpi-proc .flow { stroke-dasharray: 3 9; animation: dpiFlow 4s linear 4.8s infinite; }
@keyframes dpiFlow { to { stroke-dashoffset: -12; } }
.dpi-proc .tag { animation: dpiFade 1s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .dpi-proc * { animation: none !important; }
}
`;

const steps = [
  { x: 80, title: 'Erfassen', sub: 'Ist-Zustand klären' },
  { x: 240, title: 'Bewerten', sub: 'nach festen Kriterien' },
  { x: 400, title: 'Dokumentieren', sub: 'nachvollziehbar' },
  { x: 560, title: 'Verbessern', sub: 'dauerhaft' },
];

export default function ProcessGraphic() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={ref} data-in={inView ? 'true' : 'false'} className="dpi-proc relative">
      <style>{CSS}</style>
      <svg viewBox="0 0 640 300" role="img" aria-labelledby="dpi-proc-title" className="block h-auto w-full">
        <title id="dpi-proc-title">Grafik: Der DPI-Prozess aus Erfassen, Bewerten, Dokumentieren und Verbessern, gültig für Produkttest und Arbeitssicherheit</title>
        <defs>
          <radialGradient id="proc-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="320" cy="150" rx="300" ry="130" fill="url(#proc-glow)" />

        {/* Haarlinie */}
        <path d="M80 80 H560" stroke={INK} strokeOpacity="0.14" strokeWidth="1" />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            className="line"
            d={`M${steps[i].x + 22} 80 H${steps[i + 1].x - 22}`}
            stroke={SKY}
            strokeOpacity="0.8"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animationDelay: `${0.6 + i * 0.6}s` }}
          />
        ))}

        {steps.map((s, i) => (
          <g key={s.title}>
            <g className="node" style={{ animationDelay: `${0.3 + i * 0.6}s` }}>
              <circle cx={s.x} cy="80" r="22" fill="#ffffff" stroke={INK} strokeOpacity="0.55" strokeWidth="1.2" />
              <circle cx={s.x} cy="80" r="28" fill="none" stroke={SKY} strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="1.5 5" />
              <text x={s.x} y="85.5" fontSize="15" fontWeight="600" fill={INK} textAnchor="middle" fontFamily="inherit">{i + 1}</text>
            </g>
            <g className="label" style={{ animationDelay: `${0.6 + i * 0.6}s` }}>
              <text x={s.x} y="132" fontSize="14" fontWeight="600" fill={INK} textAnchor="middle" fontFamily="inherit">{s.title}</text>
              <text x={s.x} y="150" fontSize="11.5" fill="#64748b" textAnchor="middle" fontFamily="inherit">{s.sub}</text>
            </g>
          </g>
        ))}

        {/* Kreislauf */}
        <path className="loop" d="M560 170 C560 270 80 270 80 170" fill="none" stroke={INK} strokeOpacity="0.28" strokeWidth="1" strokeLinecap="round" />
        <path className="flow" d="M560 170 C560 270 80 270 80 170" fill="none" stroke={SKY} strokeOpacity="0.75" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M74.5 178 L80 168 L86.5 177" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        <g className="tag" style={{ animationDelay: '3.6s' }}>
          <text x="320" y="214" fontSize="11" fontWeight="600" fill={INK} fillOpacity="0.75" textAnchor="middle" fontFamily="inherit" letterSpacing="2.6">
            PRODUKTTEST
          </text>
          <circle cx="320" cy="226" r="1.6" fill={SKY} />
          <text x="320" y="244" fontSize="11" fontWeight="600" fill={INK} fillOpacity="0.75" textAnchor="middle" fontFamily="inherit" letterSpacing="2.6">
            ARBEITSSICHERHEIT
          </text>
        </g>
      </svg>
    </div>
  );
}
