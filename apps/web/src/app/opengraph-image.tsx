import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Jornada Leve — sua evolução organizada';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#eaf6ef,#ffffff)', color: '#18332a' }}>
      <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#157347', marginBottom: 54 }}>● Jornada Leve</div>
      <div style={{ display: 'flex', maxWidth: 980, fontSize: 72, lineHeight: 1.08, fontWeight: 800 }}>Sua evolução organizada em um só lugar.</div>
      <div style={{ display: 'flex', marginTop: 32, fontSize: 28, color: '#456158' }}>Registros simples, gráficos e privacidade.</div>
    </div>,
    size,
  );
}
