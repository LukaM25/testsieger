import { ImageResponse } from 'next/og';

export const alt = 'Deutsches Prüfsiegel Institut: Produkttest & Prüfsiegel für Amazon-Seller';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #16294d 0%, #0b1730 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, color: '#bae6fd', letterSpacing: 4 }}>
          <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 7, background: '#38bdf8' }} />
          DPI
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>Deutsches Prüfsiegel Institut</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 40, color: '#cbd5e1' }}>
            Produkttest &amp; Prüfsiegel für Amazon-Seller
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 28, color: '#e0f2fe' }}>
          <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
            Prüfbericht mit QR-Code
          </div>
          <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
            Testgebühr ab 179 € netto
          </div>
          <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
            dpi-siegel.de
          </div>
        </div>
      </div>
    ),
    size,
  );
}
