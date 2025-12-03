const DEFAULT_SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1uwauj30aZ4KpwSHBL3Yi6yB85H_OQypI5ogKuR82KFk/edit?usp=sharing';

function toCsvLink(link: string) {
  if (link.includes('/export?format=csv')) return link;
  const base = link.split('/edit', 1)[0];
  return `${base}/export?format=csv`;
}

export async function fetchRatingCsv(productId: string, productName: string | null): Promise<Buffer | null> {
  const sheet = process.env.RATING_SHEET_LINK || DEFAULT_SHEET_LINK;
  try {
    const res = await fetch(toCsvLink(sheet));
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const csv = await res.text();
    return Buffer.from(csv, 'utf-8');
  } catch (err) {
    console.error('RATING_CSV_FETCH_ERROR', { productId, productName, err });
    return null;
  }
}
