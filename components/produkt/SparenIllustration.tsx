"use client";

// Nachgebaute, animierte Illustration: Münze fällt in die Hand (Werbebudget sparen)
export default function SparenIllustration({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 512 512" role="img" aria-label={label} className="h-full w-full max-w-[460px]" fill="none">
      <defs>
        <radialGradient id="spar-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="spar-glow" cx="256" cy="240" r="215" fill="url(#spar-glow)" />

      {/* fallende Striche */}
      <g stroke="#38bdf8" strokeWidth="14" strokeLinecap="round">
        <line className="spar-drop spar-drop-1" x1="200" y1="40" x2="200" y2="80" />
        <line className="spar-drop spar-drop-2" x1="262" y1="10" x2="262" y2="76" />
        <line className="spar-drop spar-drop-3" x1="324" y1="40" x2="324" y2="80" />
      </g>

      {/* Münze */}
      <g className="spar-coin-bob">
        <g className="spar-coin-turn">
          <circle cx="262" cy="232" r="118" fill="#ffffff" stroke="#2B4066" strokeWidth="14" />
          <circle cx="262" cy="232" r="92" stroke="#bae6fd" strokeWidth="5" />
          <text
            x="262"
            y="276"
            textAnchor="middle"
            fontSize="132"
            fontWeight="700"
            fill="#2B4066"
            style={{ fontFamily: "inherit" }}
          >
            €
          </text>
        </g>
      </g>

      {/* Hand */}
      <g stroke="#2B4066" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        <rect x="40" y="348" width="66" height="146" rx="6" fill="#ffffff" />
        <path d="M106 380 C158 360 202 372 238 392 L318 392 C352 392 362 422 330 430 L256 432" fill="#ffffff" />
        <path d="M330 430 L468 394 C482 390 484 402 474 410 L332 492 C300 510 266 510 236 500 L106 472" fill="#ffffff" />
      </g>

      {/* Glitzern */}
      <g fill="#38bdf8">
        <path className="spar-spark spar-spark-1" d="M92 190 l5 14 14 5 -14 5 -5 14 -5 -14 -14 -5 14 -5z" />
        <path className="spar-spark spar-spark-2" d="M430 150 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z" />
        <path className="spar-spark spar-spark-3" d="M410 300 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z" />
      </g>
    </svg>
  );
}
