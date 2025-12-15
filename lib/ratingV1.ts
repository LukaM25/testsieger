export type RatingSectionKey = 'A' | 'B' | 'C' | 'D';

export type RatingCriterion = {
  id: string; // e.g. "B2"
  section: RatingSectionKey;
  row: number; // Excel-like row number
  label: string;
};

export type RatingValue = {
  score: number | null;
  note: string | null;
};

export type RatingValues = Record<string, RatingValue | undefined>;

export const RATING_CRITERIA_V1: RatingCriterion[] = [
  // A (rows 2-23)
  { id: 'B2', section: 'A', row: 2, label: 'Stabilität der Verpackung (Stöße)' },
  { id: 'B3', section: 'A', row: 3, label: 'Stabilität der Verpackung (Stürze)' },
  { id: 'B4', section: 'A', row: 4, label: 'Stabilität der Verpackung (Druck)' },
  { id: 'B5', section: 'A', row: 5, label: 'Materialstabilität' },
  { id: 'B6', section: 'A', row: 6, label: 'Schutz vor Kratzern & Beschädigungen' },
  { id: 'B7', section: 'A', row: 7, label: 'Schutzwirkung der Verpackung' },
  { id: 'B8', section: 'A', row: 8, label: 'Zusätzliche Schutzmaßnahmen' },
  { id: 'B9', section: 'A', row: 9, label: 'Sicherer Verschluss: Notwendigkeit' },
  { id: 'B10', section: 'A', row: 10, label: 'Sicherer Verschluss: Effektivität' },
  { id: 'B11', section: 'A', row: 11, label: 'Sicherer Verschluss: Benutzerfreundlichkeit' },
  { id: 'B12', section: 'A', row: 12, label: 'Schutz gegen Feuchtigkeit' },
  { id: 'B13', section: 'A', row: 13, label: 'Effektiver Schutz durch Verpackung' },
  { id: 'B14', section: 'A', row: 14, label: 'Verpackungsgröße & Materialverbrauch' },
  { id: 'B15', section: 'A', row: 15, label: 'Recycelbare/kompostierbare Materialien' },
  { id: 'B16', section: 'A', row: 16, label: 'Nicht-recycelbare Materialien' },
  { id: 'B17', section: 'A', row: 17, label: 'Vollständigkeit Packungsinhalt' },
  { id: 'B18', section: 'A', row: 18, label: 'Essentielles Zubehör vorhanden' },
  { id: 'B19', section: 'A', row: 19, label: 'Zusatznutzen Extras' },
  { id: 'B20', section: 'A', row: 20, label: 'Gebrauchsanweisung: Verfügbarkeit' },
  { id: 'B21', section: 'A', row: 21, label: 'Gebrauchsanweisung: Notwendigkeit' },
  { id: 'B22', section: 'A', row: 22, label: 'Gebrauchsanweisung: Mehrsprachigkeit' },
  { id: 'B23', section: 'A', row: 23, label: 'Gebrauchsanweisung: Verständlichkeit' },

  // B (rows 29-42)
  { id: 'B29', section: 'B', row: 29, label: 'Gesamtoptik' },
  { id: 'B30', section: 'B', row: 30, label: 'Konsistenz mit Produktfotos' },
  { id: 'B31', section: 'B', row: 31, label: 'Farbwirkung' },
  { id: 'B32', section: 'B', row: 32, label: 'Passgenauigkeit' },
  { id: 'B33', section: 'B', row: 33, label: 'Robustheit' },
  { id: 'B34', section: 'B', row: 34, label: 'Materialqualität' },
  { id: 'B35', section: 'B', row: 35, label: 'Belastbarkeit' },
  { id: 'B36', section: 'B', row: 36, label: 'Nutzungssicherheit' },
  { id: 'B37', section: 'B', row: 37, label: 'Einsatzangemessenheit' },
  { id: 'B38', section: 'B', row: 38, label: 'Umweltfreundliche Materialien' },
  { id: 'B39', section: 'B', row: 39, label: 'Energieeffizienz' },
  { id: 'B40', section: 'B', row: 40, label: 'Recyclingfähigkeit' },
  { id: 'B41', section: 'B', row: 41, label: 'Ethische Standards' },
  { id: 'B42', section: 'B', row: 42, label: 'Sonstiges (optional)' },

  // C (rows 48-51)
  { id: 'B48', section: 'C', row: 48, label: 'Übereinstimmung Werbung vs. Realität' },
  { id: 'B49', section: 'C', row: 49, label: 'Funktionalität & Bedienkomfort' },
  { id: 'B50', section: 'C', row: 50, label: 'Reaktion auf Nutzungsszenarien' },
  { id: 'B51', section: 'C', row: 51, label: 'Einzigartige Produktmerkmale' },

  // D (rows 57-61)
  { id: 'B57', section: 'D', row: 57, label: 'Preis/Leistung' },
  { id: 'B58', section: 'D', row: 58, label: 'Marktvergleich' },
  { id: 'B59', section: 'D', row: 59, label: 'Wahrgenommener Nutzen' },
  { id: 'B60', section: 'D', row: 60, label: 'Durchschnittliche Kundenbewertungen' },
  { id: 'B61', section: 'D', row: 61, label: 'Anzahl & Verteilung der Bewertungen' },
];

const SECTION_WEIGHTS: Record<RatingSectionKey, number> = { A: 1, B: 2, C: 2, D: 1 };

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: Array<number | null | undefined>) {
  const numeric = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (numeric.length === 0) return null;
  return numeric.reduce((a, b) => a + b, 0) / numeric.length;
}

export function gradeFromAverage(score1to10: number) {
  // Matches sheet formula: ROUND(6-(C-1)*5/9, 1)
  return round1(6 - (score1to10 - 1) * 5 / 9);
}

export function categoryFromGrade(grade: number) {
  if (grade >= 1 && grade < 2) return 'Sehr gut';
  if (grade >= 2 && grade < 3) return 'Gut';
  if (grade >= 3 && grade < 4) return 'Befriedigend';
  if (grade >= 4 && grade < 5) return 'Ausreichend';
  return 'Wiederholen';
}

export type RatingComputed = {
  sectionAverage: Record<RatingSectionKey, number | null>;
  sectionGrade: Record<RatingSectionKey, number | null>;
  sectionCategory: Record<RatingSectionKey, string | null>;
  overallAverage: number | null;
  overallGrade: number | null;
  overallCategory: string | null;
};

export function computeRating(values: RatingValues): RatingComputed {
  const bySection: Record<RatingSectionKey, Array<number | null | undefined>> = { A: [], B: [], C: [], D: [] };
  for (const crit of RATING_CRITERIA_V1) {
    bySection[crit.section].push(values[crit.id]?.score ?? null);
  }

  const sectionAverage: RatingComputed['sectionAverage'] = {
    A: average(bySection.A),
    B: average(bySection.B),
    C: average(bySection.C),
    D: average(bySection.D),
  };

  const sectionGrade: RatingComputed['sectionGrade'] = { A: null, B: null, C: null, D: null };
  const sectionCategory: RatingComputed['sectionCategory'] = { A: null, B: null, C: null, D: null };
  (Object.keys(sectionAverage) as RatingSectionKey[]).forEach((k) => {
    const avg = sectionAverage[k];
    if (typeof avg === 'number') {
      const grade = gradeFromAverage(avg);
      sectionGrade[k] = grade;
      sectionCategory[k] = categoryFromGrade(grade);
    }
  });

  const weightedSum =
    (sectionAverage.A ?? 0) * SECTION_WEIGHTS.A +
    (sectionAverage.B ?? 0) * SECTION_WEIGHTS.B +
    (sectionAverage.C ?? 0) * SECTION_WEIGHTS.C +
    (sectionAverage.D ?? 0) * SECTION_WEIGHTS.D;
  const hasAllSections = (Object.keys(sectionAverage) as RatingSectionKey[]).every(
    (k) => typeof sectionAverage[k] === 'number'
  );
  const overallAverage = hasAllSections ? weightedSum / 6 : null;
  const overallGrade = typeof overallAverage === 'number' ? gradeFromAverage(overallAverage) : null;
  const overallCategory = typeof overallGrade === 'number' ? categoryFromGrade(overallGrade) : null;

  return { sectionAverage, sectionGrade, sectionCategory, overallAverage, overallGrade, overallCategory };
}

function csvEscape(value: any) {
  const v = value == null ? '' : String(value);
  if (/[\",\n\r]/.test(v)) return `"${v.replace(/\"/g, '""')}"`;
  return v;
}

function csvLine(cols: any[]) {
  return cols.map(csvEscape).join(',');
}

function fmtNumber(value: number | null, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return '';
  return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
}

export function buildRatingCsvV1(opts: {
  productId: string;
  productName?: string | null;
  values: RatingValues;
  computed: RatingComputed;
  delimiter?: ',' | ';';
}) {
  const { productId, productName, values, computed } = opts;

  const rows: string[][] = [];
  rows.push(['ProductId', productId, '', '', '']);
  rows.push(['ProductName', productName || '', '', '', '']);
  rows.push(['', '', '', '', '']);

  const getScore = (row: number) => values[`B${row}`]?.score ?? null;
  const getNote = (row: number) => values[`B${row}`]?.note ?? null;

  // Header A
  rows.push(['Kriterium A Produktschutz (Gewichtung 1x)', 'Bewertung (1–10)', 'Bemerkung', '', '']);
  for (let r = 2; r <= 23; r++) {
    const crit = RATING_CRITERIA_V1.find((c) => c.row === r && c.section === 'A');
    rows.push([crit?.label || '', fmtNumber(getScore(r), 0), getNote(r) || '', '', '']);
  }
  rows.push(['Ergebnis:', fmtNumber(computed.sectionAverage.A, 2), ' ', '', '']);
  rows.push(['', '', '', '', '']);
  rows.push(['', '', '', '', '']);

  // Header B
  rows.push(['Kriterium B Verarbeitung und Erscheinungsbild (Gewichtung x2)', '', '', '', '']);
  rows.push(['Unterkategorie', 'Bewertung (1-10)', 'Bemerkung', '', '']);
  for (let r = 29; r <= 42; r++) {
    const crit = RATING_CRITERIA_V1.find((c) => c.row === r && c.section === 'B');
    rows.push([crit?.label || '', fmtNumber(getScore(r), 0), getNote(r) || '', '', '']);
  }
  rows.push(['Ergebnis', fmtNumber(computed.sectionAverage.B, 2), ' ', '', '']);
  rows.push(['', '', '', '', '']);
  rows.push(['', '', '', '', '']);

  // Header C
  rows.push(['Kriterium C Praxistest – Werbeversprechen (Gewichtung x2)', '', '', '', '']);
  rows.push(['Unterkategorie', 'Bewertung (1–10)', 'Bemerkung', '', '']);
  for (let r = 48; r <= 51; r++) {
    const crit = RATING_CRITERIA_V1.find((c) => c.row === r && c.section === 'C');
    rows.push([crit?.label || '', fmtNumber(getScore(r), 0), getNote(r) || '', '', '']);
  }
  rows.push(['Ergebnis', fmtNumber(computed.sectionAverage.C, 2), ' ', '', '']);
  rows.push(['', '', '', '', '']);
  rows.push(['', '', '', '', '']);

  // Header D
  rows.push(['Kriterium D Preis-/Leistungsverhältnis & Verbraucherbewertungen (Gewichtung 1x)', '', '', '', '']);
  rows.push(['Unterkategorie', 'Bewertung (1–10)', 'Bemerkung', '', '']);
  for (let r = 57; r <= 61; r++) {
    const crit = RATING_CRITERIA_V1.find((c) => c.row === r && c.section === 'D');
    rows.push([crit?.label || '', fmtNumber(getScore(r), 0), getNote(r) || '', '', '']);
  }
  rows.push(['Ergebnis', fmtNumber(computed.sectionAverage.D, 2), ' ', '', '']);
  rows.push(['', '', '', '', '']);

  // Summary table
  rows.push(['Gesamtauswertung', '', '', '', '']);
  rows.push(['', '', '', '', '']);
  rows.push(['Kriterium', 'Gew', 'Durchschnittspunktzahl (1–10)', 'Note (1,0–5,0)', 'Bewertungskategorie']);
  rows.push([
    'A: Produktschutz',
    '1x',
    fmtNumber(computed.sectionAverage.A, 2),
    computed.sectionGrade.A != null ? fmtNumber(computed.sectionGrade.A, 1) : '',
    computed.sectionCategory.A ?? '',
  ]);
  rows.push([
    'B: Verarbeitung & Erscheinungsbild',
    '2x',
    fmtNumber(computed.sectionAverage.B, 2),
    computed.sectionGrade.B != null ? fmtNumber(computed.sectionGrade.B, 1) : '',
    computed.sectionCategory.B ?? '',
  ]);
  rows.push([
    'C: Praxistest',
    '2x',
    fmtNumber(computed.sectionAverage.C, 2),
    computed.sectionGrade.C != null ? fmtNumber(computed.sectionGrade.C, 1) : '',
    computed.sectionCategory.C ?? '',
  ]);
  rows.push([
    'D: Preis/Leistungsverhältnis & Verbraucherbewertungen',
    '1x',
    fmtNumber(computed.sectionAverage.D, 2),
    computed.sectionGrade.D != null ? fmtNumber(computed.sectionGrade.D, 1) : '',
    computed.sectionCategory.D ?? '',
  ]);
  rows.push(['Gesamt', '6x', '[(A1 + B2 + C2 + D1) ÷ 6]', '', '']);
  rows.push([
    '=',
    '',
    fmtNumber(computed.overallAverage, 2),
    computed.overallGrade != null ? fmtNumber(computed.overallGrade, 1) : '',
    computed.overallCategory ?? '',
  ]);
  rows.push(['', '', '', '', '']);
  rows.push(['', '', '', '', '']);

  // Notenschlüssel (static)
  rows.push(['Notenschlüssel', '', '', '', '']);
  rows.push(['Punktebereich', 'Note (deutsch, 1–5)', 'Bewertungskategorie', '', '']);
  rows.push(['9,0 – 10,0', '1,0 – 1,5', 'Hervorragend', '', '']);
  rows.push(['8,0 – 8,9', '1,6 – 2,0', 'Sehr gut', '', '']);
  rows.push(['7,0 – 7,9', '2,1 – 2,5', 'Gut', '', '']);
  rows.push(['6,0 – 6,9', '2,6 – 3,0', 'Befriedigend', '', '']);
  rows.push(['5,0 – 5,9', '3,1 – 3,5', 'Ausreichend', '', '']);
  rows.push(['4,0 – 4,9', '3,6 – 4,0', 'Mangelhaft', '', '']);
  rows.push(['3,0 – 3,9', '4,1 – 4,5', 'Schlecht', '', '']);
  rows.push(['0 – 2,9', '4,6 – 5,0', 'Sehr schlecht', '', '']);

  const csv = rows.map((r) => csvLine(r)).join('\n');
  return Buffer.from(csv, 'utf-8');
}

export function normalizeScore(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 10) return null;
  return Math.round(n);
}

export function normalizeNote(raw: unknown): string | null {
  const s = raw == null ? '' : String(raw);
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
}
