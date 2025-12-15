import type { RatingComputed, RatingCriterion, RatingSectionKey, RatingValues } from '@/lib/ratingV1';

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(digits).replace('.', ',');
}

function fmtGrade(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(1).replace('.', ',');
}

export function buildRatingPdfHtmlV1(opts: {
  productId: string;
  productName: string;
  processNumber?: string | null;
  logoDataUrl?: string | null;
  criteria: RatingCriterion[];
  values: RatingValues;
  computed: RatingComputed;
}) {
  const { productId, productName, processNumber, logoDataUrl, criteria, values, computed } = opts;

  const bySection = new Map<RatingSectionKey, RatingCriterion[]>();
  for (const c of criteria) {
    const list = bySection.get(c.section) || [];
    list.push(c);
    bySection.set(c.section, list);
  }
  const sections = (Array.from(bySection.keys()) as RatingSectionKey[]).sort((a, b) => a.localeCompare(b));

  const now = new Date();
  const generatedAt = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const sectionLabel: Record<RatingSectionKey, string> = {
    A: 'A · Produktschutz',
    B: 'B · Verarbeitung & Erscheinungsbild',
    C: 'C · Praxistest',
    D: 'D · Preis/Leistung & Bewertungen',
  };

  const headerLogo = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="DPI" style="height:44px; width:auto; display:block;" />`
    : `<div style="font-weight:800; letter-spacing:0.08em;">DPI</div>`;

  const sectionBlocks = sections
    .map((section) => {
      const items = bySection.get(section) || [];
      const rows = items
        .map((c) => {
          const v = (values as any)?.[c.id] as { score?: number | null; note?: string | null } | undefined;
          const score = typeof v?.score === 'number' && Number.isFinite(v.score) ? String(Math.round(v.score)) : '—';
          const note = v?.note ? escapeHtml(String(v.note)) : '—';
          return `
            <tr>
              <td class="cell crit">${escapeHtml(c.label)}</td>
              <td class="cell score">${escapeHtml(score)}</td>
              <td class="cell note">${note}</td>
            </tr>
          `;
        })
        .join('');

      const avg = computed.sectionAverage[section];
      const grade = computed.sectionGrade[section];
      const cat = computed.sectionCategory[section];

      return `
        <section class="section">
          <div class="section-head">
            <h2 class="h2">${escapeHtml(sectionLabel[section])}</h2>
            <div class="pill-row">
              <span class="pill">Punkte: <strong>${escapeHtml(fmtNumber(avg, 2))}</strong> / 10</span>
              <span class="pill">Note: <strong>${escapeHtml(fmtGrade(grade))}</strong></span>
              <span class="pill">Ergebnis: <strong>${escapeHtml(cat || '—')}</strong></span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th class="th">Kriterium</th>
                <th class="th th-score">Bewertung</th>
                <th class="th">Bemerkung</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </section>
      `;
    })
    .join('');

  const overallAvg = computed.overallAverage;
  const overallGrade = computed.overallGrade;
  const overallCat = computed.overallCategory;

  return `<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Prüfergebnis</title>
      <style>
        :root { --ink:#0f172a; --muted:#475569; --line:#e2e8f0; --bg:#ffffff; --soft:#f8fafc; }
        * { box-sizing: border-box; }
        body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: var(--ink); background: var(--bg); }
        .wrap { width: 100%; }
        .top { display:flex; align-items:center; justify-content:space-between; gap:16px; padding: 4px 0 14px; border-bottom: 1px solid var(--line); }
        .meta { text-align:right; font-size:12px; color: var(--muted); line-height: 1.4; }
        .title { margin: 18px 0 2px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .subtitle { margin: 0; font-size: 13px; color: var(--muted); }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin-top: 14px; padding: 12px 14px; background: var(--soft); border: 1px solid var(--line); border-radius: 10px; }
        .kv { font-size: 12px; color: var(--muted); }
        .kv strong { display:block; margin-top:2px; font-size: 13px; color: var(--ink); font-weight: 700; }
        .summary { margin-top: 14px; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
        .summary h2 { margin: 0 0 6px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .summary .big { font-size: 18px; font-weight: 800; margin: 0; }
        .summary .small { margin: 4px 0 0; font-size: 12px; color: var(--muted); }
        .section { margin-top: 16px; page-break-inside: avoid; }
        .section-head { display:flex; align-items:flex-end; justify-content:space-between; gap: 14px; margin-bottom: 8px; }
        .h2 { margin:0; font-size: 14px; font-weight: 800; }
        .pill-row { display:flex; gap: 8px; flex-wrap: wrap; justify-content:flex-end; }
        .pill { font-size: 11px; color: var(--muted); background: var(--soft); border: 1px solid var(--line); padding: 6px 8px; border-radius: 999px; }
        .pill strong { color: var(--ink); font-weight: 800; }
        table { width: 100%; border-collapse: collapse; }
        .table { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .th { text-align:left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: var(--soft); padding: 10px 10px; border-bottom: 1px solid var(--line); }
        .th-score { width: 90px; text-align:center; }
        .cell { padding: 10px 10px; border-bottom: 1px solid var(--line); vertical-align: top; font-size: 12px; }
        .cell:last-child { border-bottom: 1px solid var(--line); }
        .crit { width: 44%; font-weight: 600; }
        .score { width: 90px; text-align:center; font-weight: 800; }
        .note { color: var(--ink); }
        .footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line); display:flex; justify-content:space-between; font-size: 10px; color: var(--muted); }
        @page { size: A4; margin: 18mm 16mm; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="top">
          <div>${headerLogo}</div>
          <div class="meta">
            Deutsches Prüfsiegel Institut (DPI)<br/>
            Prüfergebnis · Generiert: ${escapeHtml(generatedAt)}
          </div>
        </div>

        <div class="title">Prüfergebnis</div>
        <p class="subtitle">Interne Bewertungsmatrix (Testsieger Check)</p>

        <div class="grid">
          <div class="kv">Produkt<strong>${escapeHtml(productName || '—')}</strong></div>
          <div class="kv">Produkt-ID<strong>${escapeHtml(productId)}</strong></div>
          <div class="kv">Vorgangsnummer<strong>${escapeHtml(processNumber || '—')}</strong></div>
          <div class="kv">Ergebnis<strong>${escapeHtml(overallCat || '—')}</strong></div>
        </div>

        <div class="summary">
          <h2>Gesamtergebnis</h2>
          <p class="big">Note: ${escapeHtml(fmtGrade(overallGrade))} · ${escapeHtml(overallCat || '—')}</p>
          <p class="small">Punkte: ${escapeHtml(fmtNumber(overallAvg, 2))} / 10</p>
        </div>

        ${sectionBlocks}

        <div class="footer">
          <div>Dieses Dokument wurde automatisch aus dem Kundenportal generiert.</div>
          <div>Prüfsiegel Zentrum UG</div>
        </div>
      </div>
    </body>
  </html>`;
}

