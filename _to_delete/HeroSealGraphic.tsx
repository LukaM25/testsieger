'use client';

import { useInView } from './useInView';

const INK = '#2B4066';
const SKY = '#0ea5e9';

const CSS = `
.dpi-hero[data-in="false"] * { animation-play-state: paused !important; }
.dpi-hero .float-a { animation: dpiFloat 11s ease-in-out infinite; }
.dpi-hero .float-b { animation: dpiFloat 12s ease-in-out -5s infinite; }
@keyframes dpiFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.dpi-hero .spin-a { transform-box: fill-box; transform-origin: center; animation: dpiSpin 140s linear infinite; }
.dpi-hero .spin-b { transform-box: fill-box; transform-origin: center; animation: dpiSpin 100s linear infinite reverse; }
@keyframes dpiSpin { to { transform: rotate(360deg); } }
.dpi-hero .ring { stroke-dasharray: 654; stroke-dashoffset: 0; animation: dpiRing 3s cubic-bezier(.22,1,.36,1) .2s both; }
@keyframes dpiRing { from { stroke-dashoffset: 654; } }
.dpi-hero .draw { stroke-dasharray: 260; stroke-dashoffset: 0; animation: dpiDraw 1.6s ease-out both; }
@keyframes dpiDraw { from { stroke-dashoffset: 260; } }
.dpi-hero .check { stroke-dasharray: 60; stroke-dashoffset: 0; animation: dpiCheck .9s ease-out 1.6s both; }
@keyframes dpiCheck { from { stroke-dashoffset: 60; } }
.dpi-hero .fade-in { animation: dpiFade 1.2s ease-out both; }
@keyframes dpiFade { from { opacity: 0; } }
.dpi-hero .fade-up { animation: dpiFadeUp 1s ease-out both; }
@keyframes dpiFadeUp { from { opacity: 0; transform: translateY(8px); } }
.dpi-hero .twinkle { animation: dpiTwinkle 6s ease-in-out infinite; }
@keyframes dpiTwinkle { 0%,100% { opacity: .1; } 50% { opacity: .7; } }
.dpi-hero .flow { stroke-dasharray: 3 9; animation: dpiFlow 3.4s linear infinite; }
@keyframes dpiFlow { to { stroke-dashoffset: -12; } }
.dpi-hero .breathe { transform-box: fill-box; transform-origin: center; animation: dpiBreathe 7s ease-in-out infinite; }
@keyframes dpiBreathe { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.04); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .dpi-hero * { animation: none !important; }
}
`;

function Node({
  cx,
  cy,
  title,
  sub,
  float,
  delay,
  children,
}: {
  cx: number;
  cy: number;
  title: string;
  sub: string;
  float: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <g className={float}>
      <g className="fade-in" style={{ animationDelay: `${delay}s` }}>
        <circle cx={cx} cy={cy} r="40" fill="url(#hero-node)" stroke={INK} strokeOpacity="0.3" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="46" fill="none" stroke={SKY} strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="1.5 5" />
        <g transform={`translate(${cx} ${cy}) scale(1.15)`} fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
        <text x={cx} y={cy + 78} fontSize="20" fontWeight="600" fill={INK} textAnchor="middle" fontFamily="inherit">{title}</text>
        <text x={cx} y={cy + 99} fontSize="15" fill="#64748b" textAnchor="middle" fontFamily="inherit">{sub}</text>
      </g>
    </g>
  );
}

export default function HeroSealGraphic() {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);

  const ticks = Array.from({ length: 72 }, (_, i) => i);
  const r2d = (n: number) => Math.round(n * 100) / 100;
  const sparks = [
    [70, 60, 0], [535, 70, 1.4], [300, 18, 2.4], [575, 300, 0.8], [26, 290, 2], [150, 410, 1.1], [455, 405, 2.8],
  ];
  const words = [
    { x: 150, label: 'QUALITÄT' },
    { x: 300, label: 'SICHERHEIT' },
    { x: 450, label: 'PROZESS' },
  ];

  return (
    <div ref={ref} data-in={inView ? 'true' : 'false'} className="dpi-hero relative mx-auto w-full max-w-[360px]">
      <style>{CSS}</style>
      <svg viewBox="0 0 600 440" role="img" aria-labelledby="dpi-hero-title" className="block h-auto w-full">
        <title id="dpi-hero-title">Grafik: Produkttest und Arbeitssicherheit, verbunden durch Qualität, Sicherheit und Prozess</title>
        <defs>
          <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#93c5fd" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-node" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="hero-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="hero-rule" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={INK} stopOpacity="0" />
            <stop offset="50%" stopColor={INK} stopOpacity="0.35" />
            <stop offset="100%" stopColor={INK} stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="300" cy="190" r="200" fill="url(#hero-glow)" />

        {sparks.map(([cx, cy, d], i) => (
          <circle key={i} className="twinkle" cx={cx} cy={cy} r="1.8" fill={SKY} style={{ animationDelay: `${d}s` }} />
        ))}

        {/* feine Ringe */}
        <circle cx="300" cy="190" r="168" fill="none" stroke={INK} strokeOpacity="0.07" strokeWidth="1" />
        <g className="spin-b">
          <circle cx="300" cy="190" r="140" fill="none" stroke={INK} strokeOpacity="0.2" strokeWidth="0.8" strokeDasharray="1 7" strokeLinecap="round" />
          <circle cx="300" cy="50" r="2.6" fill={SKY} />
        </g>
        <g className="spin-a">
          {ticks.map((i) => {
            const a = (i * 5 * Math.PI) / 180;
            const long = i % 6 === 0;
            const r1 = 116;
            const r2 = long ? 124 : 120;
            return (
              <line
                key={i}
                x1={r2d(300 + r1 * Math.sin(a))}
                y1={r2d(190 - r1 * Math.cos(a))}
                x2={r2d(300 + r2 * Math.sin(a))}
                y2={r2d(190 - r2 * Math.cos(a))}
                stroke={INK}
                strokeOpacity={long ? 0.5 : 0.22}
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <circle cx="300" cy="190" r="104" fill="none" stroke={INK} strokeOpacity="0.12" strokeWidth="1" />
        <circle
          className="ring"
          cx="300"
          cy="190"
          r="104"
          fill="none"
          stroke="url(#hero-ring)"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform="rotate(-90 300 190)"
        />

        {/* Verbindungen */}
        <path className="flow" d="M137 190 H196" stroke={SKY} strokeOpacity="0.7" strokeWidth="1.1" strokeLinecap="round" />
        <path className="flow" d="M463 190 H404" stroke={SKY} strokeOpacity="0.7" strokeWidth="1.1" strokeLinecap="round" style={{ animationDirection: 'reverse' }} />

        {/* Siegel */}
        <g className="breathe">
          <circle cx="300" cy="190" r="78" fill="#ffffff" fillOpacity="0.8" stroke={INK} strokeOpacity="0.18" strokeWidth="1" />
          <g transform="translate(300 188)">
            <path
              className="draw"
              d="M0 -44 L36 -30 V3 C36 27 17 42 0 50 C-17 42 -36 27 -36 3 V-30 Z"
              fill="url(#hero-shield)"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="check" d="M-15 3 L-4 14 L17 -11" fill="none" stroke={SKY} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* Fachgebiete */}
        <Node cx={95} cy={190} title="Produkttest" sub="Prüfsiegel für Händler" float="float-a" delay={0.8}>
          <path className="draw" d="M0 -17 L16 -8 V10 L0 19 L-16 10 V-8 Z" style={{ animationDelay: '1s' }} />
          <path className="draw" d="M0 -17 V2 M-16 -8 L0 2 L16 -8" style={{ animationDelay: '1.4s' }} />
        </Node>
        <Node cx={505} cy={190} title="Arbeitssicherheit" sub="Praxisnah im Betrieb" float="float-b" delay={1.1}>
          <path className="draw" d="M-17 7 C-17 -6 -9 -15 0 -15 C9 -15 17 -6 17 7 Z" style={{ animationDelay: '1.3s' }} />
          <path className="draw" d="M-21 7 H21 M0 -15 V7" style={{ animationDelay: '1.7s' }} />
        </Node>

        {/* Leitgedanken */}
        <rect x="100" y="352" width="400" height="1" fill="url(#hero-rule)" />
        {words.map((w, i) => (
          <g key={w.label} className="fade-up" style={{ animationDelay: `${2 + i * 0.25}s` }}>
            <text x={w.x} y="388" fontSize="16" fontWeight="600" fill={INK} fillOpacity="0.75" textAnchor="middle" fontFamily="inherit" letterSpacing="3">
              {w.label}
            </text>
          </g>
        ))}
        <circle cx="225" cy="383" r="1.8" fill={SKY} />
        <circle cx="375" cy="383" r="1.8" fill={SKY} />
      </svg>
    </div>
  );
}
